import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { upsertEntry, type Entry } from '../lib/entries'
import { buildStats, type StatsResult } from '../lib/stats'
import { formatSleepHours } from '../lib/utils/sleepHours'
import { parseTags } from '../lib/utils/stringUtils'

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
  isPro,
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
    const seen = new Set<string>()
    const suggestions: string[] = []
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

  useEffect(() => {
    const existing = entries.find(item => item.entry_date === entryDate)
    if (existing) {
      setSleepHours(formatSleepHours(existing.sleep_hours))
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

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()
    if (!userId) return

    if (entryDate > today) {
      setEntriesError('You cannot log entries in the future.')
      setSaved(false)
      return
    }

    const parsedSleep = parseSleepHours(sleepHours)
    if (parsedSleep === null) {
      setEntriesError('Sleep hours must be a number or time like 7h 30m or 7:30.')
      setSaved(false)
      return
    }
    if (parsedSleep < 0 || parsedSleep > 12) {
      setEntriesError('Sleep hours must be between 0 and 12.')
      setSaved(false)
      return
    }
    if (!mood) {
      setEntriesError('Select a mood rating.')
      setSaved(false)
      return
    }

    const tagList = isPro ? parseTags(tags) : []
    if (isPro && tagList.length > maxTagsPerEntry) {
      setEntriesError(`Limit ${maxTagsPerEntry} tags per entry.`)
      setSaved(false)
      return
    }

    setSaving(true)
    setEntriesError(null)
    try {
      const savedEntry = await upsertEntry({
        user_id: userId,
        entry_date: entryDate,
        sleep_hours: parsedSleep,
        mood,
        note: note.trim() ? note.trim() : null,
        ...(isPro ? { tags: tagList.length ? tagList : null } : {}),
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
      window.setTimeout(() => setSaved(false), 2000)
      if (entryDate === today) {
        window.setTimeout(() => onEntrySavedForToday?.(), 500)
      }
    }
    catch {
      setEntriesError('Unable to save entry.')
      setSaved(false)
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
