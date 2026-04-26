import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type SetStateAction,
} from 'react'
import { t } from 'i18next'
import { toast } from 'sonner'
import { upsertEntry, type Entry } from '../lib/entries'
import { getSupportMessage } from '../lib/supportMessage'
import { buildStats, type StatsResult } from '../lib/stats'
import type { Badge } from '../lib/types/stats'
import { MAX_TAG_LENGTH, parseTags } from '../lib/utils/stringUtils'
import {
  DEFAULT_LOG_SLEEP_HOURS,
  formatSleepHoursOption,
  MAX_LOG_SLEEP_HOURS,
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
  onStreakReached?: (streakDays: number) => void
  onBadgeMilestoneReached?: (badge: Badge) => void
  shouldSuppressPostSaveToast?: (entryCount: number) => boolean
  onEntrySavedForToday?: (entryCount: number) => void
  onEntrySaveSuccess?: (payload: { previousEntryCount: number, nextEntryCount: number }) => void
  onFirstEntryCreated?: () => void
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
  onBadgeMilestoneReached,
  shouldSuppressPostSaveToast,
  onEntrySavedForToday,
  onEntrySaveSuccess,
  onFirstEntryCreated,
}: UseLogFormParams) => {
  const defaultSleepHoursOption = formatSleepHoursOption(DEFAULT_LOG_SLEEP_HOURS)
  const [entryDate, setEntryDate] = useState(today)
  const lastAppTodayRef = useRef(today)
  const lastUserIdRef = useRef(userId)
  /** When the real calendar day advances, move off yesterday if user was on "today". */
  useEffect(() => {
    const prevToday = lastAppTodayRef.current
    if (today !== prevToday) {
      setEntryDate(ed => (ed === prevToday ? today : ed))
      lastAppTodayRef.current = today
    }
  }, [today])
  useEffect(() => {
    if (userId === lastUserIdRef.current) {
      return
    }
    // Keep log date account-scoped: switching users should never inherit prior user's selected day.
    setEntryDate(today)
    lastAppTodayRef.current = today
    lastUserIdRef.current = userId
  }, [userId, today])
  const [sleepHours, setSleepHoursState] = useState(defaultSleepHoursOption)
  const [mood, setMoodState] = useState<number | null>(null)
  const [note, setNoteState] = useState('')
  const [tags, setTagsState] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  /**
   * True after the user changes sleep, mood, note, or tags for the current day.
   * Resets when we load a day from `entries` / `entryDate`. Silent auto-save no-ops if false;
   * explicit Save ignores this (the default sleep value in the UI still persists on submit).
   */
  const userEditedLogRef = useRef(false)

  const setSleepHours = useCallback((value: SetStateAction<string>) => {
    userEditedLogRef.current = true
    setSleepHoursState(value)
  }, [])
  const setMood = useCallback((value: SetStateAction<number | null>) => {
    userEditedLogRef.current = true
    setMoodState(value)
  }, [])
  const setNote = useCallback((value: SetStateAction<string>) => {
    userEditedLogRef.current = true
    setNoteState(value)
  }, [])
  const setTags = useCallback((value: SetStateAction<string>) => {
    userEditedLogRef.current = true
    setTagsState(value)
  }, [])

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
    userEditedLogRef.current = false
    const existing = entries.find(item => item.entry_date === entryDate)
    if (existing) {
      setSleepHoursState(
        existing.sleep_hours === null
          ? defaultSleepHoursOption
          : formatSleepHoursOption(existing.sleep_hours),
      )
      setMoodState(existing.mood)
      setNoteState(existing.note ?? '')
      setTagsState(existing.tags?.join(', ') ?? '')
    }
    else {
      setSleepHoursState(defaultSleepHoursOption)
      setMoodState(null)
      setNoteState('')
      setTagsState('')
    }
  }, [entryDate, entries, defaultSleepHoursOption])

  const handleSave = async (event: FormEvent, options?: { silent?: boolean }) => {
    event.preventDefault()
    if (options?.silent && !userEditedLogRef.current) {
      return
    }
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
    if (sleepHoursToSave < 0 || sleepHoursToSave > MAX_LOG_SLEEP_HOURS) {
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

    if (entries.length === 0 && mood === null) {
      if (!options?.silent) {
        showEntriesError(t('log.firstDayNeedMood'))
      }
      else {
        setSaved(false)
      }
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
      if (entries.length === 0) {
        onFirstEntryCreated?.()
      }
      setEntries(nextEntries)
      const nextStats = buildStats(nextEntries, sleepThreshold, formatLocalDate)
      // Celebrate on key milestones: 3, 7, 14, 21, 30, then every 10 days from 40 onward.
      const isStreakMilestone = nextStats.streak === 3
        || nextStats.streak === 7
        || nextStats.streak === 14
        || nextStats.streak === 21
        || nextStats.streak === 30
        || (nextStats.streak >= 40 && nextStats.streak % 10 === 0)
      if (isStreakMilestone && stats.streak < nextStats.streak) {
        onStreakReached?.(nextStats.streak)
      }

      const prevBadgeById = new Map(stats.sleepConsistencyBadges.map(b => [b.id, b]))
      const tierUps = nextStats.sleepConsistencyBadges.flatMap((nextBadge) => {
        const prevTier = prevBadgeById.get(nextBadge.id)?.currentTierIndex ?? -1
        const nextTier = nextBadge.currentTierIndex
        return nextTier > prevTier
          ? [{ badge: nextBadge, tierDelta: nextTier - prevTier }]
          : []
      })
      if (tierUps.length > 0) {
        tierUps.sort((a, b) => b.tierDelta - a.tierDelta || a.badge.id.localeCompare(b.badge.id))
        onBadgeMilestoneReached?.(tierUps[0]!.badge)
      }
      setSaved(true)
      const isFirstEntrySave = entries.length === 0 && nextEntries.length === 1
      const suppressPostSaveToast = shouldSuppressPostSaveToast?.(nextEntries.length) ?? false
      if (!options?.silent && !suppressPostSaveToast && !isFirstEntrySave) {
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
      if (!options?.silent) {
        onEntrySaveSuccess?.({
          previousEntryCount: entries.length,
          nextEntryCount: nextEntries.length,
        })
        onEntrySavedForToday?.(nextEntries.length)
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
