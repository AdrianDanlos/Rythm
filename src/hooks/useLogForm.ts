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
import { getDefaultLogDate } from '../lib/utils/defaultLogDate'

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
  yesterday: string
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
  yesterday,
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
  const defaultLogDate = useMemo(
    () => getDefaultLogDate(today, yesterday, entries),
    [today, yesterday, entries],
  )
  const prevDefaultLogDateRef = useRef(today)
  const lastUserIdRef = useRef(userId)

  useEffect(() => {
    if (userId === lastUserIdRef.current) {
      return
    }
    // Keep log date account-scoped; empty entries → today until fetch resolves (then sync effect may move to yesterday).
    const nextDefault = getDefaultLogDate(today, yesterday, [])
    prevDefaultLogDateRef.current = nextDefault
    setEntryDate(nextDefault)
    lastUserIdRef.current = userId
  }, [userId, today, yesterday])

  /** When the computed default changes, follow it only if the user was still on the previous default. */
  useEffect(() => {
    const prev = prevDefaultLogDateRef.current
    if (prev !== defaultLogDate) {
      setEntryDate(ed => (ed === prev ? defaultLogDate : ed))
      prevDefaultLogDateRef.current = defaultLogDate
    }
  }, [defaultLogDate])
  const [sleepHours, setSleepHoursState] = useState(defaultSleepHoursOption)
  const [mood, setMoodState] = useState<number | null>(null)
  const [note, setNoteState] = useState('')
  const [tags, setTagsState] = useState('')
  const [saving, setSaving] = useState(false)

  const setSleepHours = useCallback((value: SetStateAction<string>) => {
    setSleepHoursState(value)
  }, [])
  const setMood = useCallback((value: SetStateAction<number | null>) => {
    setMoodState(value)
  }, [])
  const setNote = useCallback((value: SetStateAction<string>) => {
    setNoteState(value)
  }, [])
  const setTags = useCallback((value: SetStateAction<string>) => {
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
  }

  useEffect(() => {
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

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()
    if (!userId) return

    if (entryDate > today) {
      showEntriesError(t('log.futureError'))
      return
    }

    const hasSleepInput = sleepHours.trim().length > 0
    const parsedSleep = parseSleepHours(sleepHours)
    if (hasSleepInput && parsedSleep === null) {
      showEntriesError(t('log.invalidSleep'))
      return
    }

    const sleepHoursToSave = hasSleepInput ? parsedSleep! : DEFAULT_LOG_SLEEP_HOURS
    if (sleepHoursToSave < 0 || sleepHoursToSave > MAX_LOG_SLEEP_HOURS) {
      showEntriesError(t('log.sleepRange'))
      return
    }
    if (mood !== null && (mood < 1 || mood > 5)) {
      showEntriesError(t('log.moodRange'))
      return
    }

    const tagList = parseTags(tags)
    if (tagList.some(tag => tag.length > MAX_TAG_LENGTH)) {
      showEntriesError(t('log.maxTagLength', { count: MAX_TAG_LENGTH }))
      return
    }
    if (tagList.length > maxTagsPerEntry) {
      showEntriesError(t('log.maxTagsPerEntry', { count: maxTagsPerEntry }))
      return
    }

    const normalizedNote = note.trim() ? note.trim() : null
    const hasAnyValue = mood !== null
      || normalizedNote !== null
      || tagList.length > 0
      || hasSleepInput
    if (!hasAnyValue) {
      showEntriesError(t('log.addAtLeastOneValue'))
      return
    }

    if (entries.length === 0 && mood === null) {
      showEntriesError(t('log.firstDayNeedMood'))
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
      const isFirstEntrySave = entries.length === 0 && nextEntries.length === 1
      const suppressPostSaveToast = shouldSuppressPostSaveToast?.(nextEntries.length) ?? false
      if (!suppressPostSaveToast && !isFirstEntrySave) {
        if (tagList.length === 0) {
          if (mood === null) {
            toast.info(t('log.postSaveNeedMood'))
          }
          else {
            const isShortSleep = sleepHoursToSave < (sleepThreshold - 1)
            const moodKey = mood >= 4 ? 'GoodMood' : mood <= 2 ? 'LowMood' : null
            const messageKey = moodKey
              ? `log.postSaveSuggestions.${isShortSleep ? 'lowSleep' : 'normalSleep'}NoEvents${moodKey}`
              : 'log.saveNoEvents'
            toast.info(t(messageKey))
          }
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
      onEntrySaveSuccess?.({
        previousEntryCount: entries.length,
        nextEntryCount: nextEntries.length,
      })
      onEntrySavedForToday?.(nextEntries.length)
    }
    catch {
      showEntriesError(t('log.saveEntryError'))
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
    handleSave,
  }
}
