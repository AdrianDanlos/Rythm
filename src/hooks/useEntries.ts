import { useEffect, useMemo, useState } from 'react'
import { t } from 'i18next'
import { fetchEntries, type Entry } from '../lib/entries'
import { buildStats } from '../lib/stats'
import i18n from '../i18n'
import { calculateAverages } from '../lib/utils/averages'

type UseEntriesParams = {
  userId?: string
  sleepThreshold: number
  formatLocalDate: (value: Date) => string
  onEntriesLoaded?: (entries: Entry[]) => void
}

export const useEntries = ({
  userId,
  sleepThreshold,
  formatLocalDate,
  onEntriesLoaded,
}: UseEntriesParams) => {
  const [entries, setEntries] = useState<Entry[]>([])
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [entriesError, setEntriesError] = useState<string | null>(null)
  /** False until first fetch for current userId has completed; prevents flicker before we know if quick start should show */
  const [entriesSettled, setEntriesSettled] = useState(false)

  useEffect(() => {
    if (!userId) {
      setEntries([])
      setEntriesLoading(false)
      setEntriesError(null)
      setEntriesSettled(false)
      return
    }

    setEntriesSettled(false)

    const loadEntries = async () => {
      setEntriesLoading(true)
      setEntriesError(null)
      try {
        const data = await fetchEntries(userId)
        setEntries(data)
        onEntriesLoaded?.(data)
      }
      catch {
        setEntriesError(t('errors.unableToLoadEntries'))
      }
      finally {
        setEntriesLoading(false)
        setEntriesSettled(true)
      }
    }

    loadEntries()
  }, [userId, onEntriesLoaded])

  const chartData = useMemo(
    () =>
      entries.map(entry => ({
        ...entry,
        sleep_hours: entry.sleep_hours === null ? null : Number(entry.sleep_hours),
        mood: entry.mood === null ? null : Number(entry.mood),
      })),
    [entries],
  )

  const averages = useMemo(() => calculateAverages(entries), [entries])

  const highlightedDates = useMemo(() => {
    const uniqueDates = new Map<string, Date>()
    entries.forEach((entry) => {
      if (!entry.is_complete) return
      const date = new Date(`${entry.entry_date}T00:00:00`)
      date.setHours(0, 0, 0, 0)
      uniqueDates.set(entry.entry_date, date)
    })
    return Array.from(uniqueDates.values())
  }, [entries])

  const incompleteHighlightedDates = useMemo(() => {
    const uniqueDates = new Map<string, Date>()
    entries.forEach((entry) => {
      if (entry.is_complete) return
      const date = new Date(`${entry.entry_date}T00:00:00`)
      date.setHours(0, 0, 0, 0)
      uniqueDates.set(entry.entry_date, date)
    })
    return Array.from(uniqueDates.values())
  }, [entries])

  const stats = useMemo(
    () => buildStats(entries, sleepThreshold, formatLocalDate),
    [entries, sleepThreshold, formatLocalDate, i18n.resolvedLanguage],
  )

  return {
    entries,
    setEntries,
    entriesLoading,
    entriesSettled,
    entriesError,
    setEntriesError,
    chartData,
    averages,
    highlightedDates,
    incompleteHighlightedDates,
    stats,
  }
}
