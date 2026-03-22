import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { t } from 'i18next'
import { toast } from 'sonner'
import { upsertEntry, type Entry } from '../lib/entries'
import { getSupportMessage } from '../lib/supportMessage'
import { buildStats, type StatsResult } from '../lib/stats'
import { MAX_TAG_LENGTH, parseTags } from '../lib/utils/stringUtils'
import {
  DEFAULT_LOG_SLEEP_HOURS,
  formatSleepHoursOption,
  parseSleepHours,
} from '../lib/utils/sleepHours'

const DEFAULT_TAG_SUGGESTION_KEYS = [
  'log.defaultTags.caffeine',
  'log.defaultTags.stress',
  'log.defaultTags.lateEating',
  'log.defaultTags.eveningScreens',
  'log.defaultTags.lateBedtime',
  'log.defaultTags.exercise',
  'log.defaultTags.fragmentedSleep',
  'log.defaultTags.alcoholConsumption',
  'log.defaultTags.progressFeeling',
  'log.defaultTags.social',
  'log.defaultTags.sunlight',
] as const

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
  onStreakReached,
  onEntrySavedForToday,
}: UseLogFormParams) => {
  const [entryDate, setEntryDate] = useState(today)
  const lastAppTodayRef = useRef(today)
  /** When the real calendar day advances, move off yesterday if user was on "today". */
  useEffect(() => {
    const prevToday = lastAppTodayRef.current
    if (today !== prevToday) {
      setEntryDate((ed) => (ed === prevToday ? today : ed))
      lastAppTodayRef.current = today
    }
  }, [today])
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

    let suggestions: string[]

    if (userTagSet.size >= SUGGEST_DEFAULTS_UNTIL_USER_TAG_COUNT) {
      suggestions = []
      const seen = new Set<string>()
      sorted.forEach((entry) => {
        entry.tags?.forEach((tag) => {
          const normalized = tag.trim().toLowerCase()
          if (!normalized || seen.has(normalized)) return
          seen.add(normalized)
          suggestions.push(normalized)
        })
      })
    }
    else {
      const defaultsLower = DEFAULT_TAG_SUGGESTION_KEYS.map(key =>
        t(key).trim().toLowerCase(),
      )
      const seen = new Set<string>(defaultsLower)
      suggestions = [...defaultsLower]
      sorted.forEach((entry) => {
        entry.tags?.forEach((tag) => {
          const normalized = tag.trim().toLowerCase()
          if (!normalized || seen.has(normalized)) return
          seen.add(normalized)
          suggestions.push(normalized)
        })
      })
    }

    const suggestionSet = new Set(suggestions)
    const formTags = parseTags(tags)
    formTags.forEach((tag) => {
      if (!suggestionSet.has(tag)) {
        suggestionSet.add(tag)
        suggestions.push(tag)
      }
    })
    return suggestions
  }, [entries, tags])

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
      if (!options?.silent) showEntriesError(t('log.futureError'))
      return
    }

    const hasSleepInput = sleepHours.trim().length > 0
    const parsedSleep = parseSleepHours(sleepHours)
    if (hasSleepInput && parsedSleep === null) {
      if (!options?.silent) showEntriesError(t('log.invalidSleep'))
      return
    }
    const sleepHoursToSave = hasSleepInput ? parsedSleep! : DEFAULT_LOG_SLEEP_HOURS
    if (sleepHoursToSave < 0 || sleepHoursToSave > 12) {
      if (!options?.silent) showEntriesError(t('log.sleepRange'))
      return
    }
    if (mood !== null && (mood < 1 || mood > 5)) {
      if (!options?.silent) showEntriesError(t('log.moodRange'))
      return
    }

    const tagList = parseTags(tags)
    if (tagList.some(tag => tag.length > MAX_TAG_LENGTH)) {
      if (!options?.silent) {
        showEntriesError(t('log.maxTagLength', { count: MAX_TAG_LENGTH }))
      }
      return
    }
    if (tagList.length > maxTagsPerEntry) {
      if (!options?.silent) {
        showEntriesError(t('log.maxTagsPerEntry', { count: maxTagsPerEntry }))
      }
      return
    }

    const normalizedNote = note.trim() ? note.trim() : null
    const hasAnyValue = mood !== null
      || normalizedNote !== null
      || tagList.length > 0
      || hasSleepInput
    if (!hasAnyValue) {
      if (!options?.silent) showEntriesError(t('log.addAtLeastOneValue'))
      return
    }

    const existing = entries.find(item => item.entry_date === entryDate)
    const isComplete = mood !== null
    const completedAt = isComplete
      ? (existing?.is_complete && existing.completed_at
          ? existing.completed_at
          : new Date().toISOString())
      : null

    setSaving(true)
    try {
      const savedEntry = await upsertEntry({
        user_id: userId,
        entry_date: entryDate,
        sleep_hours: sleepHoursToSave,
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
          const isCompleteAfterSave = mood !== null
          const isShortSleep = sleepHoursToSave < (sleepThreshold - 1)
          const moodKey = mood == null ? null : mood >= 4 ? 'GoodMood' : mood <= 2 ? 'LowMood' : null
          const messageKey = isCompleteAfterSave && moodKey
            ? `log.postSaveSuggestions.${isShortSleep ? 'lowSleep' : 'normalSleep'}NoEvents${moodKey}`
            : 'log.saveNoEvents'
          toast.info(t(messageKey))
        }
        else {
          toast.success(getSupportMessage({
            sleepHours: sleepHoursToSave,
            mood,
            sleepThreshold,
            tags: tagList,
          }))
        }
      }
      window.setTimeout(() => setSaved(false), 2000)
      if (entryDate === today && isComplete && !options?.silent) {
        window.setTimeout(() => onEntrySavedForToday?.(), 500)
      }
    }
    catch {
      if (!options?.silent) showEntriesError(t('log.saveEntryError'))
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
