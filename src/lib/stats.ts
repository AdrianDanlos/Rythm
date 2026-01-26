import type { Entry } from './entries'

type WindowStats = {
  sleep: number | null
  mood: number | null
  count: number
}

type TrendPoint = {
  date: string
  sleep: number | null
  mood: number | null
}

type RollingPoint = {
  date: string
  sleep7: number | null
  sleep30: number | null
  sleep90: number | null
  mood7: number | null
  mood30: number | null
  mood90: number | null
}

type RollingSummary = {
  days: number
  sleep: number | null
  mood: number | null
  sleepDelta: number | null
  moodDelta: number | null
}

type TagInsight = {
  tag: string
  sleep: number | null
  mood: number | null
  count: number
}

export type StatsResult = {
  windowAverages: {
    last7: WindowStats
    last30: WindowStats
    last90: WindowStats
    last365: WindowStats
  }
  streak: number
  sleepConsistencyLabel: string | null
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
  tagInsights: TagInsight[]
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

  const buildWindow = (days: number, offsetDays = 0): WindowStats => {
    const end = new Date()
    end.setHours(0, 0, 0, 0)
    end.setDate(end.getDate() - offsetDays)
    const start = new Date(end)
    start.setDate(end.getDate() - (days - 1))

    const windowEntries = entriesWithDate.filter(
      entry => entry.date >= start && entry.date <= end,
    )

    if (!windowEntries.length) {
      return { sleep: null, mood: null, count: 0 }
    }

    const totals = windowEntries.reduce(
      (acc, entry) => {
        acc.sleep += Number(entry.sleep_hours)
        acc.mood += Number(entry.mood)
        return acc
      },
      { sleep: 0, mood: 0 },
    )

    return {
      sleep: totals.sleep / windowEntries.length,
      mood: totals.mood / windowEntries.length,
      count: windowEntries.length,
    }
  }

  const windowAverages = {
    last7: buildWindow(7),
    last30: buildWindow(30),
    last90: buildWindow(90),
    last365: buildWindow(365),
  }

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

  let sleepConsistencyLabel: string | null = null
  if (entries.length) {
    const mean
      = entries.reduce((sum, entry) => sum + Number(entry.sleep_hours), 0)
        / entries.length
    const variance
      = entries.reduce((sum, entry) => {
        const diff = Number(entry.sleep_hours) - mean
        return sum + diff * diff
      }, 0) / entries.length
    const sleepConsistency = Math.sqrt(variance)

    if (sleepConsistency <= 0.9) sleepConsistencyLabel = 'Very consistent'
    else if (sleepConsistency <= 2.0) sleepConsistencyLabel = 'Consistent'
    else if (sleepConsistency <= 3.5) sleepConsistencyLabel = 'Mixed'
    else sleepConsistencyLabel = 'Unstable'
  }

  let correlationLabel: string | null = null
  let correlationDirection: string | null = null
  if (entries.length >= 2) {
    const meanSleep
      = entries.reduce((sum, entry) => sum + Number(entry.sleep_hours), 0)
        / entries.length
    const meanMood
      = entries.reduce((sum, entry) => sum + Number(entry.mood), 0) / entries.length

    let numerator = 0
    let sumSleep = 0
    let sumMood = 0

    entries.forEach((entry) => {
      const sleepDelta = Number(entry.sleep_hours) - meanSleep
      const moodDelta = Number(entry.mood) - meanMood
      numerator += sleepDelta * moodDelta
      sumSleep += sleepDelta * sleepDelta
      sumMood += moodDelta * moodDelta
    })

    const denominator = Math.sqrt(sumSleep * sumMood)
    if (denominator !== 0) {
      const correlation = numerator / denominator
      const magnitude = Math.abs(correlation)
      correlationLabel
        = magnitude < 0.2
          ? 'No clear'
          : magnitude < 0.4
            ? 'Weak'
            : magnitude < 0.7
              ? 'Moderate'
              : 'Strong'

      if (correlation > 0.05) correlationDirection = 'Higher sleep, better mood'
      else if (correlation < -0.05)
        correlationDirection = 'Higher sleep, lower mood'
      else correlationDirection = 'No clear direction'
    }
  }

  let moodBySleepThreshold = { high: null, low: null } as {
    high: number | null
    low: number | null
  }
  if (entries.length) {
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
    if (!windowEntries.length) {
      return { sleep: null, mood: null }
    }
    const totals = windowEntries.reduce(
      (acc, entry) => {
        acc.sleep += Number(entry.sleep_hours)
        acc.mood += Number(entry.mood)
        return acc
      },
      { sleep: 0, mood: 0 },
    )
    return {
      sleep: totals.sleep / windowEntries.length,
      mood: totals.mood / windowEntries.length,
    }
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

  const tagInsights = (() => {
    const aggregates = new Map<
      string,
      { sleepSum: number, moodSum: number, count: number }
    >()
    entries.forEach((entry) => {
      const tags = entry.tags ?? []
      tags.forEach((tag) => {
        const key = tag.trim()
        if (!key) return
        const current = aggregates.get(key) ?? {
          sleepSum: 0,
          moodSum: 0,
          count: 0,
        }
        current.sleepSum += Number(entry.sleep_hours)
        current.moodSum += Number(entry.mood)
        current.count += 1
        aggregates.set(key, current)
      })
    })
    return Array.from(aggregates.entries())
      .map(([tag, data]) => ({
        tag,
        sleep: data.count ? data.sleepSum / data.count : null,
        mood: data.count ? data.moodSum / data.count : null,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count)
  })()

  return {
    windowAverages,
    streak,
    sleepConsistencyLabel,
    correlationLabel,
    correlationDirection,
    moodBySleepThreshold,
    moodByPersonalThreshold,
    personalSleepThreshold,
    trendSeries,
    rollingSeries,
    rollingSummaries,
    tagInsights,
  }
}
