import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import type { Entry } from '../lib/entries'
import { upsertEntry } from '../lib/entries'
import { tagColorPalette } from '../lib/colors'
import { MAX_TAG_LENGTH } from '../lib/utils/stringUtils'

export function useTagColors(
  userId: string | undefined,
  entries: Entry[],
  setEntries: Dispatch<SetStateAction<Entry[]>>,
) {
  const [tagColors, setTagColors] = useState<Record<string, string>>({})

  // When the signed-in user changes (including logout), reset before reloading from storage — adjust during render, not in an effect.
  const [prevUserId, setPrevUserId] = useState(userId)
  if (userId !== prevUserId) {
    setPrevUserId(userId)
    setTagColors({})
  }

  useEffect(() => {
    if (!userId) return

    let cancelled = false
    try {
      const stored = window.localStorage.getItem(`rythm:tagColors:${userId}`)
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, string>
        queueMicrotask(() => {
          if (!cancelled) {
            setTagColors(parsed)
          }
        })
      }
    }
    catch {
      queueMicrotask(() => {
        if (!cancelled) {
          setTagColors({})
        }
      })
    }
    return () => {
      cancelled = true
    }
  }, [userId])

  const persistTagColors = useCallback((uid: string, next: Record<string, string>) => {
    try {
      window.localStorage.setItem(`rythm:tagColors:${uid}`, JSON.stringify(next))
    }
    catch {
      // ignore storage errors
    }
  }, [])

  const ensureTagColorForTag = useCallback((tag: string) => {
    const key = tag.trim().toLowerCase()
    if (!key) return
    setTagColors((prev) => {
      if (prev[key]) return prev

      const existingColors = new Set(Object.values(prev))
      const available = tagColorPalette.filter(color => !existingColors.has(color))
      const pool = available.length > 0 ? available : tagColorPalette
      const randomIndex = Math.floor(Math.random() * pool.length)
      const color = pool[randomIndex]

      const next = { ...prev, [key]: color }
      if (userId) {
        persistTagColors(userId, next)
      }
      return next
    })
  }, [persistTagColors, userId])

  const handleTagColorChange = useCallback((tag: string, color: string) => {
    const key = tag.trim().toLowerCase()
    if (!key) return
    setTagColors((prev) => {
      const next = { ...prev, [key]: color }
      if (userId) {
        persistTagColors(userId, next)
      }
      return next
    })
  }, [persistTagColors, userId])

  const handleRenameTag = useCallback((fromTag: string, toTag: string) => {
    const fromKey = fromTag.trim().toLowerCase()
    const toKey = toTag.trim().slice(0, MAX_TAG_LENGTH).toLowerCase()
    if (!fromKey || !toKey) return
    if (fromKey === toKey) return

    // Preserve any custom color when renaming.
    setTagColors((prev) => {
      const fromColor = prev[fromKey]
      if (!fromColor) return prev
      if (toKey === fromKey) return prev
      const next: Record<string, string> = { ...prev }
      // Only move color if new key doesn't already have one.
      if (!next[toKey]) {
        next[toKey] = fromColor
      }
      delete next[fromKey]
      if (userId) {
        persistTagColors(userId, next)
      }
      return next
    })

    // Optimistic UI update: change tags in local state immediately.
    const nextEntries = entries.map((entry) => {
      if (!entry.tags?.length) return entry
      let changed = false
      const updatedTags = entry.tags.map((tag) => {
        const normalized = tag.trim().toLowerCase()
        if (!normalized) return tag
        if (normalized === fromKey) {
          changed = true
          return toKey
        }
        return tag
      })
      return changed ? { ...entry, tags: updatedTags } : entry
    })
    setEntries(nextEntries)

    // Persist in background; keep UI responsive.
    if (!userId) return

    const affectedEntries = entries.filter(entry =>
      (entry.tags ?? []).some(tag => tag.trim().toLowerCase() === fromKey),
    )
    if (!affectedEntries.length) return

    void (async () => {
      try {
        const updatedEntries = await Promise.all(
          affectedEntries.map(async (entry) => {
            const nextTags = (entry.tags ?? []).map((tag) => {
              const normalized = tag.trim().toLowerCase()
              if (!normalized) return tag
              return normalized === fromKey ? toKey : tag
            })

            const saved = await upsertEntry({
              user_id: userId,
              entry_date: entry.entry_date,
              tags: nextTags,
            })

            return saved
          }),
        )

        const updatedByKey = new Map(
          updatedEntries.map(e => [`${e.user_id}:${e.entry_date}`, e]),
        )

        setEntries(prev =>
          prev.map((entry) => {
            const key = `${entry.user_id}:${entry.entry_date}`
            return updatedByKey.get(key) ?? entry
          }),
        )
      }
      catch {
        // If rename fails, keep optimistic UI; next reload will refetch from server.
      }
    })()
  }, [entries, persistTagColors, setEntries, userId])

  return {
    tagColors,
    ensureTagColorForTag,
    handleTagColorChange,
    handleRenameTag,
  }
}
