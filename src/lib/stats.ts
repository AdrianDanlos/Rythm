import type { Entry } from './entries'
import type {
  RollingPoint,
  RollingSummary,
  SleepConsistencyBadge,
  TagDriver,
  TagSleepDriver,
  TrendPoint,
  WindowStats,
} from './types/stats'
import { calculateAverages } from './utils/averages'
import { getCorrelationInsight } from './utils/correlation'
import {
  getSleepConsistencyBadges,
  getSleepConsistencyLabel,
} from './utils/sleepConsistency'
import { buildTagDrivers, buildTagSleepDrivers } from './utils/tagInsights'

export type StatsResult = {
  windowAverages: {
    last7: WindowStats
    last30: WindowStats
    last90: WindowStats
    last365: WindowStats
  }
  rhythmScore: number | null
  streak: number
  sleepConsistencyLabel: string | null
  sleepConsistencyBadges: SleepConsistencyBadge[]
  correlationLabel: string | null
  correlationDirection: string | null
  moodBySleepThreshold: { high: number | null, low: number | null }
  moodByPersonalThreshold: { high: number | null, low: number | null }
  personalSleepThreshold: number | null
  trendSeries: {
    last30: TrendPoint[]
    last90: TrendPoint[]
    last365: TrendPoint[]
  }
  rollingSeries: RollingPoint[]
  rollingSummaries: RollingSummary[]
  tagDrivers: TagDriver[]
  tagSleepDrivers: TagSleepDriver[]
}

export const buildWeeklyTrendSeries = (points: TrendPoint[]): TrendPoint[] => {
  if (!points.length) return []
  const bucketSize = 7
  const weekly: TrendPoint[] = []
  for (let i = 0; i < points.length; i += bucketSize) {
    const slice = points.slice(i, i + bucketSize)
    const sleepValues = slice
      .map(point => point.sleep)
      .filter((value): value is number => typeof value === 'number')
    const moodValues = slice
      .map(point => point.mood)
      .filter((value): value is number => typeof value === 'number')
    const sleepAvg = sleepValues.length
      ? sleepValues.reduce((sum, value) => sum + value, 0) / sleepValues.length
      : null
    const moodAvg = moodValues.length
      ? moodValues.reduce((sum, value) => sum + value, 0) / moodValues.length
      : null
    weekly.push({
      date: slice[0]?.date ?? '',
      sleep: sleepAvg,
      mood: moodAvg,
    })
  }
  return weekly
}

export const buildStats = (
  entries: Entry[],
  sleepThreshold: number,
  formatLocalDate: (date: Date) => string,
): StatsResult => {
  const entriesWithDate = entries.map((entry) => {
    const date = new Date(`${entry.entry_date}T00:00:00`)
    date.setHours(0, 0, 0, 0)
    return { ...entry, date }
  })

  const getWindowEntries = (days: number, offsetDays = 0) => {
    const end = new Date()
    end.setHours(0, 0, 0, 0)
    end.setDate(end.getDate() - offsetDays)
    const start = new Date(end)
    start.setDate(end.getDate() - (days - 1))

    return entriesWithDate.filter(
      entry => entry.date >= start && entry.date <= end,
    )
  }

  const buildWindow = (days: number, offsetDays = 0): WindowStats =>
    calculateAverages(getWindowEntries(days, offsetDays))

  const windowAverages = {
    last7: buildWindow(7),
    last30: buildWindow(30),
    last90: buildWindow(90),
    last365: buildWindow(365),
  }

  const rhythmScore = (() => {
    const windowEntries = getWindowEntries(30)
    if (windowEntries.length < 5) return null
    const sleepValues = windowEntries
      .map(entry => Number(entry.sleep_hours))
      .filter((value): value is number => Number.isFinite(value))
    if (sleepValues.length < 5) return null
    const mean = sleepValues.reduce((sum, value) => sum + value, 0) / sleepValues.length
    const variance = sleepValues.reduce((sum, value) => {
      const diff = value - mean
      return sum + diff * diff
    }, 0) / sleepValues.length
    const stdDev = Math.sqrt(variance)
    const maxStdDev = 3
    const normalized = 1 - Math.min(maxStdDev, Math.max(0, stdDev)) / maxStdDev
    return Math.round(Math.max(0, Math.min(1, normalized)) * 100)
  })()

  let streak = 0
  if (entriesWithDate.length) {
    const dateSet = new Set(entriesWithDate.map(entry => entry.entry_date))
    const latestDate = entriesWithDate.reduce(
      (max, entry) => (entry.entry_date > max ? entry.entry_date : max),
      entriesWithDate[0].entry_date,
    )

    const current = new Date(`${latestDate}T00:00:00`)
    while (true) {
      const key = formatLocalDate(current)
      if (!dateSet.has(key)) break
      streak += 1
      current.setDate(current.getDate() - 1)
    }
  }

  const sleepConsistencyLabel = getSleepConsistencyLabel(entries)
  const sleepConsistencyBadges = getSleepConsistencyBadges(entries)
  const {
    label: correlationLabel,
    direction: correlationDirection,
  } = getCorrelationInsight(entries)

  const minNightsForMoodBySleep = 5
  let moodBySleepThreshold = { high: null, low: null } as {
    high: number | null
    low: number | null
  }
  if (entries.length >= minNightsForMoodBySleep) {
    const buckets = entries.reduce(
      (acc, entry) => {
        const target = Number(entry.sleep_hours) >= sleepThreshold ? 'high' : 'low'
        acc[target].sum += Number(entry.mood)
        acc[target].count += 1
        return acc
      },
      {
        high: { sum: 0, count: 0 },
        low: { sum: 0, count: 0 },
      },
    )

    moodBySleepThreshold = {
      high: buckets.high.count ? buckets.high.sum / buckets.high.count : null,
      low: buckets.low.count ? buckets.low.sum / buckets.low.count : null,
    }
  }

  const buildTrendSeries = (days: number): TrendPoint[] => {
    const end = new Date()
    end.setHours(0, 0, 0, 0)
    const start = new Date(end)
    start.setDate(end.getDate() - (days - 1))
    const map = new Map(
      entriesWithDate.map(entry => [entry.entry_date, entry]),
    )
    const points: TrendPoint[] = []
    const cursor = new Date(start)
    while (cursor <= end) {
      const key = formatLocalDate(cursor)
      const entry = map.get(key)
      points.push({
        date: key,
        sleep: entry ? Number(entry.sleep_hours) : null,
        mood: entry ? Number(entry.mood) : null,
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    return points
  }

  const trendSeries = {
    last30: buildTrendSeries(30),
    last90: buildTrendSeries(90),
    last365: buildTrendSeries(365),
  }

  const getWindowAverage = (
    endDate: Date,
    days: number,
  ): { sleep: number | null, mood: number | null } => {
    const end = new Date(endDate)
    end.setHours(0, 0, 0, 0)
    const start = new Date(end)
    start.setDate(end.getDate() - (days - 1))
    const windowEntries = entriesWithDate.filter(
      entry => entry.date >= start && entry.date <= end,
    )
    const averages = calculateAverages(windowEntries)
    return { sleep: averages.sleep, mood: averages.mood }
  }

  const rollingSeries = (() => {
    const end = new Date()
    end.setHours(0, 0, 0, 0)
    const start = new Date(end)
    start.setDate(end.getDate() - 89)
    const points: RollingPoint[] = []
    const cursor = new Date(start)
    while (cursor <= end) {
      const avg7 = getWindowAverage(cursor, 7)
      const avg30 = getWindowAverage(cursor, 30)
      const avg90 = getWindowAverage(cursor, 90)
      points.push({
        date: formatLocalDate(cursor),
        sleep7: avg7.sleep,
        sleep30: avg30.sleep,
        sleep90: avg90.sleep,
        mood7: avg7.mood,
        mood30: avg30.mood,
        mood90: avg90.mood,
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    return points
  })()

  const rollingSummaries: RollingSummary[] = [7, 30, 90].map((days) => {
    const current = buildWindow(days)
    const previous = buildWindow(days, days)
    return {
      days,
      sleep: current.sleep,
      mood: current.mood,
      sleepDelta:
        current.sleep !== null && previous.sleep !== null
          ? current.sleep - previous.sleep
          : null,
      moodDelta:
        current.mood !== null && previous.mood !== null
          ? current.mood - previous.mood
          : null,
    }
  })

  const personalSleepThreshold = (() => {
    if (entries.length < 5) return null
    const sorted = [...entries].sort((a, b) => b.mood - a.mood)
    const topCount = Math.max(3, Math.ceil(entries.length * 0.3))
    const topEntries = sorted.slice(0, topCount)
    const avgSleep
      = topEntries.reduce((sum, entry) => sum + Number(entry.sleep_hours), 0)
        / topEntries.length
    const rounded = Math.round(avgSleep * 2) / 2
    return Math.min(10, Math.max(4, rounded))
  })()

  const moodByPersonalThreshold = (() => {
    if (!personalSleepThreshold) {
      return { high: null, low: null }
    }
    const buckets = entries.reduce(
      (acc, entry) => {
        const target
          = Number(entry.sleep_hours) >= personalSleepThreshold ? 'high' : 'low'
        acc[target].sum += Number(entry.mood)
        acc[target].count += 1
        return acc
      },
      {
        high: { sum: 0, count: 0 },
        low: { sum: 0, count: 0 },
      },
    )
    return {
      high: buckets.high.count ? buckets.high.sum / buckets.high.count : null,
      low: buckets.low.count ? buckets.low.sum / buckets.low.count : null,
    }
  })()

  const tagDrivers = buildTagDrivers(entries)
  const tagSleepDrivers = buildTagSleepDrivers(entries)

  return {
    windowAverages,
    rhythmScore,
    streak,
    sleepConsistencyLabel,
    sleepConsistencyBadges,
    correlationLabel,
    correlationDirection,
    moodBySleepThreshold,
    moodByPersonalThreshold,
    personalSleepThreshold,
    trendSeries,
    rollingSeries,
    rollingSummaries,
    tagDrivers,
    tagSleepDrivers,
  }
}
