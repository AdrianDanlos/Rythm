import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { upsertEntry, type Entry } from '../lib/entries'
import { getSupportMessage } from '../lib/supportMessage'
import { buildStats, type StatsResult } from '../lib/stats'
import { MAX_TAG_LENGTH, parseTags } from '../lib/utils/stringUtils'

const DEFAULT_TAG_SUGGESTIONS = [
  'Caffeine',
  'Stress',
  'Late intake',
  'Evening screens',
  'Late bedtime',
  'Excercise',
  'Fragmented sleep',
  'Alcohol intake',
  'Progress',
  'Social',
  'Sunlight',
]

/** Once the user has this many unique tags in their entries, we stop showing default suggestions. */
const SUGGEST_DEFAULTS_UNTIL_USER_TAG_COUNT = 5

type UseLogFormParams = {
  userId?: string
  entries: Entry[]
  setEntries: (entries: Entry[]) => void
  stats: StatsResult
  today: string
  formatLocalDate: (value: Date) => string
  sleepThreshold: number
  isPro: boolean
  maxTagsPerEntry: number
  setEntriesError: (value: string | null) => void
  onStreakReached?: () => void
  onEntrySavedForToday?: () => void
}

export const useLogForm = ({
  userId,
  entries,
  setEntries,
  stats,
  today,
  formatLocalDate,
  sleepThreshold,
  maxTagsPerEntry,
  setEntriesError,
  onStreakReached,
  onEntrySavedForToday,
}: UseLogFormParams) => {
  const [entryDate, setEntryDate] = useState(today)
  const [sleepHours, setSleepHours] = useState('')
  const [mood, setMood] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const selectedDate = useMemo(
    () => new Date(`${entryDate}T00:00:00`),
    [entryDate],
  )

  const tagSuggestions = useMemo(() => {
    const sorted = [...entries].sort((a, b) =>
      b.entry_date.localeCompare(a.entry_date),
    )
    const userTagSet = new Set<string>()
    sorted.forEach((entry) => {
      entry.tags?.forEach((tag) => {
        const normalized = tag.trim().toLowerCase()
        if (normalized) userTagSet.add(normalized)
      })
    })

    if (userTagSet.size >= SUGGEST_DEFAULTS_UNTIL_USER_TAG_COUNT) {
      const suggestions: string[] = []
      const seen = new Set<string>()
      sorted.forEach((entry) => {
        entry.tags?.forEach((tag) => {
          const normalized = tag.trim().toLowerCase()
          if (!normalized || seen.has(normalized)) return
          seen.add(normalized)
          suggestions.push(normalized)
        })
      })
      return suggestions
    }

    const defaultsLower = DEFAULT_TAG_SUGGESTIONS.map(t => t.trim().toLowerCase())
    const seen = new Set<string>(defaultsLower)
    const suggestions = [...defaultsLower]
    sorted.forEach((entry) => {
      entry.tags?.forEach((tag) => {
        const normalized = tag.trim().toLowerCase()
        if (!normalized || seen.has(normalized)) return
        seen.add(normalized)
        suggestions.push(normalized)
      })
    })
    return suggestions
  }, [entries])

  const parseSleepHours = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return null
    if (trimmed.includes(':')) {
      const match = /^(\d{1,2})\s*:\s*(\d{1,2})$/.exec(trimmed)
      if (!match) return null
      const hours = Number(match[1])
      const minutes = Number(match[2])
      if (!Number.isFinite(hours) || !Number.isFinite(minutes) || minutes >= 60) {
        return null
      }
      return hours + minutes / 60
    }
    if (/[hH]/.test(trimmed)) {
      const match = /^(\d{1,2})\s*h(?:\s*(\d{1,2})\s*(?:m|min)?)?$/i.exec(trimmed)
      if (!match) return null
      const hours = Number(match[1])
      const minutes = match[2] ? Number(match[2]) : 0
      if (!Number.isFinite(hours) || !Number.isFinite(minutes) || minutes >= 60) {
        return null
      }
      return hours + minutes / 60
    }
    const asNumber = Number(trimmed)
    if (!Number.isFinite(asNumber)) return null
    return asNumber
  }

  const formatSleepHoursOption = (value: number) => {
    const rounded = Math.round(value * 4) / 4
    return rounded.toFixed(2).replace(/\.?0+$/, '')
  }

  const showEntriesError = (message: string) => {
    toast.error(message)
    setSaved(false)
  }

  useEffect(() => {
    const existing = entries.find(item => item.entry_date === entryDate)
    if (existing) {
      setSleepHours(
        existing.sleep_hours === null
          ? ''
          : formatSleepHoursOption(existing.sleep_hours),
      )
      setMood(existing.mood)
      setNote(existing.note ?? '')
      setTags(existing.tags?.join(', ') ?? '')
      return
    }

    setSleepHours('')
    setMood(null)
    setNote('')
    setTags('')
  }, [entryDate, entries])

  const handleSave = async (event: FormEvent, options?: { silent?: boolean }) => {
    event.preventDefault()
    if (!userId) return

    if (entryDate > today) {
      if (!options?.silent) showEntriesError('You cannot log entries in the future.')
      return
    }

    const hasSleepInput = sleepHours.trim().length > 0
    const parsedSleep = parseSleepHours(sleepHours)
    if (hasSleepInput && parsedSleep === null) {
      if (!options?.silent) showEntriesError('Sleep hours are invalid.')
      return
    }
    if (parsedSleep !== null && (parsedSleep < 0 || parsedSleep > 12)) {
      if (!options?.silent) showEntriesError('Sleep hours must be between 0 and 12.')
      return
    }
    if (mood !== null && (mood < 1 || mood > 5)) {
      if (!options?.silent) showEntriesError('Mood rating must be between 1 and 5.')
      return
    }

    const tagList = parseTags(tags)
    if (tagList.some(tag => tag.length > MAX_TAG_LENGTH)) {
      if (!options?.silent) showEntriesError(`Each daily event must be ${MAX_TAG_LENGTH} characters or less.`)
      return
    }
    if (tagList.length > maxTagsPerEntry) {
      if (!options?.silent) showEntriesError(`Limit ${maxTagsPerEntry} daily events per entry.`)
      return
    }

    const normalizedNote = note.trim() ? note.trim() : null
    const hasAnyValue = parsedSleep !== null
      || mood !== null
      || normalizedNote !== null
      || tagList.length > 0
    if (!hasAnyValue) {
      if (!options?.silent) showEntriesError('Add at least one value before saving.')
      return
    }

    const existing = entries.find(item => item.entry_date === entryDate)
    const isComplete = parsedSleep !== null && mood !== null
    const completedAt = isComplete
      ? (existing?.is_complete && existing.completed_at
          ? existing.completed_at
          : new Date().toISOString())
      : null

    setSaving(true)
    setEntriesError(null)
    try {
      const savedEntry = await upsertEntry({
        user_id: userId,
        entry_date: entryDate,
        sleep_hours: parsedSleep,
        mood,
        note: normalizedNote,
        ...(tagList.length ? { tags: tagList } : { tags: null }),
        is_complete: isComplete,
        completed_at: completedAt,
      })

      const nextEntries = (() => {
        const filtered = entries.filter(item => item.entry_date !== entryDate)
        return [...filtered, savedEntry].sort((a, b) =>
          a.entry_date.localeCompare(b.entry_date),
        )
      })()
      setEntries(nextEntries)
      const nextStats = buildStats(nextEntries, sleepThreshold, formatLocalDate)
      if (nextStats.streak === 7 && stats.streak < 7) {
        onStreakReached?.()
      }
      setSaved(true)
      if (!options?.silent) {
        if (tagList.length === 0) {
          toast.info('Saved. No daily events added. Add them next time for better insights.')
        }
        else {
          toast.success(getSupportMessage({
            sleepHours: parsedSleep,
            mood,
            sleepThreshold,
            tags: tagList,
            isComplete,
          }))
        }
      }
      window.setTimeout(() => setSaved(false), 2000)
      if (entryDate === today && isComplete && !options?.silent) {
        window.setTimeout(() => onEntrySavedForToday?.(), 500)
      }
    }
    catch {
      if (!options?.silent) showEntriesError('Unable to save entry.')
    }
    finally {
      setSaving(false)
    }
  }

  return {
    setEntryDate,
    selectedDate,
    sleepHours,
    setSleepHours,
    mood,
    setMood,
    note,
    setNote,
    tags,
    setTags,
    tagSuggestions,
    saving,
    saved,
    handleSave,
  }
}
