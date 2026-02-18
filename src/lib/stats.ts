import type { Entry } from './entries'
import type {
  RollingPoint,
  RollingSummary,
  Badge,
  TagDriver,
  TagSleepDriver,
  TrendPoint,
  WeekdayAveragePoint,
  WindowStats,
} from './types/stats'
import { calculateAverages } from './utils/averages'
import { getCorrelationInsight } from './utils/correlation'
import { getTieredBadges } from './utils/tieredBadges'
import { getSleepConsistencyLabel } from './utils/sleepConsistency'
import { buildTagDrivers, buildTagSleepDrivers } from './utils/tagInsights'

export type StatCounts = {
  /** Entries in last 30 days with sleep (for rhythm score) */
  last30WithSleep: number
  /** All entries with sleep (for sleep consistency) */
  sleepEntries: number
  /** All entries with both sleep and mood (for correlation and mood-by-sleep) */
  completeEntries: number
}

export type StatsResult = {
  windowAverages: {
    last7: WindowStats
    last30: WindowStats
    last90: WindowStats
    last365: WindowStats
  }
  statCounts: StatCounts
  rhythmScore: number | null
  streak: number
  sleepConsistencyLabel: string | null
  sleepConsistencyBadges: Badge[]
  correlationLabel: string | null
  correlationDirection: string | null
  moodBySleepThreshold: { high: number | null, low: number | null }
  /** Count of entries with sleep >= threshold and sleep < threshold (for helper copy) */
  moodBySleepBucketCounts: { high: number, low: number }
  moodByPersonalThreshold: { high: number | null, low: number | null }
  personalSleepThreshold: number | null
  trendSeries: {
    last30: TrendPoint[]
    last90: TrendPoint[]
    last365: TrendPoint[]
  }
  rollingSeries: RollingPoint[]
  rollingSummaries: RollingSummary[]
  weekdayAverages: WeekdayAveragePoint[]
  tagDrivers: TagDriver[]
  tagSleepDrivers: TagSleepDriver[]
}

export const buildBucketedTrendSeries = (
  points: TrendPoint[],
  bucketSize: number,
): TrendPoint[] => {
  if (!points.length || bucketSize < 1) return []
  const bucketed: TrendPoint[] = []
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
    bucketed.push({
      date: slice[0]?.date ?? '',
      sleep: sleepAvg,
      mood: moodAvg,
    })
  }
  return bucketed
}

export const buildWeeklyTrendSeries = (points: TrendPoint[]): TrendPoint[] =>
  buildBucketedTrendSeries(points, 7)

export const buildStats = (
  entries: Entry[],
  sleepThreshold: number,
  formatLocalDate: (date: Date) => string,
): StatsResult => {
  const toFiniteSleep = (entry: Entry) => {
    const value = entry.sleep_hours === null ? Number.NaN : Number(entry.sleep_hours)
    return Number.isFinite(value) ? value : null
  }
  const toFiniteMood = (entry: Entry) => {
    const value = entry.mood === null ? Number.NaN : Number(entry.mood)
    return Number.isFinite(value) ? value : null
  }
  const completeEntries = entries.filter((entry) => {
    const sleep = toFiniteSleep(entry)
    const mood = toFiniteMood(entry)
    return sleep !== null && mood !== null
  })
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
  const completeEntriesWithDate = entriesWithDate.filter(entry => entry.is_complete)
  if (completeEntriesWithDate.length) {
    const dateSet = new Set(completeEntriesWithDate.map(entry => entry.entry_date))
    const latestDate = completeEntriesWithDate.reduce(
      (max, entry) => (entry.entry_date > max ? entry.entry_date : max),
      completeEntriesWithDate[0].entry_date,
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
  const sleepConsistencyBadges = getTieredBadges(entries)
  const {
    label: correlationLabel,
    direction: correlationDirection,
  } = getCorrelationInsight(entries)

  const moodBySleepBuckets = completeEntries.reduce(
    (acc, entry) => {
      const sleep = toFiniteSleep(entry)
      const mood = toFiniteMood(entry)
      if (sleep === null || mood === null) return acc
      const target = sleep >= sleepThreshold ? 'high' : 'low'
      acc[target].sum += mood
      acc[target].count += 1
      return acc
    },
    {
      high: { sum: 0, count: 0 },
      low: { sum: 0, count: 0 },
    },
  )

  const moodBySleepBucketCounts = {
    high: moodBySleepBuckets.high.count,
    low: moodBySleepBuckets.low.count,
  }

  const hasHighAndLow = moodBySleepBuckets.high.count >= 1 && moodBySleepBuckets.low.count >= 1
  const moodBySleepThreshold = hasHighAndLow
    ? {
        high: moodBySleepBuckets.high.sum / moodBySleepBuckets.high.count,
        low: moodBySleepBuckets.low.sum / moodBySleepBuckets.low.count,
      }
    : { high: null, low: null } as { high: number | null, low: number | null }

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
      const sleep = entry ? toFiniteSleep(entry) : null
      const mood = entry ? toFiniteMood(entry) : null
      points.push({
        date: key,
        sleep,
        mood,
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

  const weekdayAverages: WeekdayAveragePoint[] = (() => {
    const weekdayConfig: Array<{ dayIndex: number, dayKey: WeekdayAveragePoint['dayKey'], label: string }> = [
      { dayIndex: 1, dayKey: 'mon', label: 'Mon' },
      { dayIndex: 2, dayKey: 'tue', label: 'Tue' },
      { dayIndex: 3, dayKey: 'wed', label: 'Wed' },
      { dayIndex: 4, dayKey: 'thu', label: 'Thu' },
      { dayIndex: 5, dayKey: 'fri', label: 'Fri' },
      { dayIndex: 6, dayKey: 'sat', label: 'Sat' },
      { dayIndex: 0, dayKey: 'sun', label: 'Sun' },
    ]
    const buckets = new Map(
      weekdayConfig.map(({ dayIndex }) => [
        dayIndex,
        { sleepSum: 0, moodSum: 0, count: 0 },
      ]),
    )

    entriesWithDate.forEach((entry) => {
      const sleep = toFiniteSleep(entry)
      const mood = toFiniteMood(entry)
      if (sleep === null || mood === null) return
      const bucket = buckets.get(entry.date.getDay())
      if (!bucket) return
      bucket.sleepSum += sleep
      bucket.moodSum += mood
      bucket.count += 1
    })

    return weekdayConfig.map(({ dayIndex, dayKey, label }) => {
      const bucket = buckets.get(dayIndex)
      const count = bucket?.count ?? 0
      const avgSleep = bucket && count ? bucket.sleepSum / count : null
      const avgMood = bucket && count ? bucket.moodSum / count : null
      return {
        dayKey,
        label,
        avgSleep,
        avgMood,
        observationCount: count,
      }
    })
  })()

  const personalSleepThreshold = (() => {
    if (completeEntries.length < 5) return null
    const sorted = [...completeEntries].sort((a, b) =>
      Number(b.mood) - Number(a.mood),
    )
    const topCount = Math.max(3, Math.ceil(completeEntries.length * 0.3))
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
    const buckets = completeEntries.reduce(
      (acc, entry) => {
        const sleep = toFiniteSleep(entry)
        const mood = toFiniteMood(entry)
        if (sleep === null || mood === null) return acc
        const target
          = sleep >= personalSleepThreshold ? 'high' : 'low'
        acc[target].sum += mood
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

  const last30WithSleep = getWindowEntries(30).filter(entry =>
    Number.isFinite(Number(entry.sleep_hours)),
  ).length
  const sleepEntries = entries.filter(entry =>
    Number.isFinite(Number(entry.sleep_hours)),
  ).length
  const statCounts: StatCounts = {
    last30WithSleep,
    sleepEntries,
    completeEntries: completeEntries.length,
  }

  return {
    windowAverages,
    statCounts,
    rhythmScore,
    streak,
    sleepConsistencyLabel,
    sleepConsistencyBadges,
    correlationLabel,
    correlationDirection,
    moodBySleepThreshold,
    moodBySleepBucketCounts,
    moodByPersonalThreshold,
    personalSleepThreshold,
    trendSeries,
    rollingSeries,
    rollingSummaries,
    weekdayAverages,
    tagDrivers,
    tagSleepDrivers,
  }
}
