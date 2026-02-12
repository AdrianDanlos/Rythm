import { useEffect, useMemo, useState } from 'react'
import { fetchEntries, type Entry } from '../lib/entries'
import { buildStats } from '../lib/stats'
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

  useEffect(() => {
    if (!userId) {
      setEntries([])
      setEntriesLoading(false)
      setEntriesError(null)
      return
    }

    const loadEntries = async () => {
      setEntriesLoading(true)
      setEntriesError(null)
      try {
        const data = await fetchEntries(userId)
        setEntries(data)
        onEntriesLoaded?.(data)
      }
      catch {
        setEntriesError('Unable to load entries.')
      }
      finally {
        setEntriesLoading(false)
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

  const stats = useMemo(
    () => buildStats(entries, sleepThreshold, formatLocalDate),
    [entries, sleepThreshold, formatLocalDate],
  )

  return {
    entries,
    setEntries,
    entriesLoading,
    entriesError,
    setEntriesError,
    chartData,
    averages,
    highlightedDates,
    stats,
  }
}
