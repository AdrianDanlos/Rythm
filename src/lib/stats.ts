import type { Entry } from './entries'

type WindowStats = {
  sleep: number | null
  mood: number | null
  count: number
}

export type StatsResult = {
  windowAverages: {
    last7: WindowStats
    last30: WindowStats
  }
  streak: number
  sleepConsistencyLabel: string | null
  correlationLabel: string | null
  correlationDirection: string | null
  moodBySleepThreshold: { high: number | null; low: number | null }
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

  const buildWindow = (days: number): WindowStats => {
    const end = new Date()
    end.setHours(0, 0, 0, 0)
    const start = new Date(end)
    start.setDate(end.getDate() - (days - 1))

    const windowEntries = entriesWithDate.filter(
      (entry) => entry.date >= start && entry.date <= end,
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
  }

  let streak = 0
  if (entriesWithDate.length) {
    const dateSet = new Set(entriesWithDate.map((entry) => entry.entry_date))
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
    const mean =
      entries.reduce((sum, entry) => sum + Number(entry.sleep_hours), 0) /
      entries.length
    const variance =
      entries.reduce((sum, entry) => {
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
    const meanSleep =
      entries.reduce((sum, entry) => sum + Number(entry.sleep_hours), 0) /
      entries.length
    const meanMood =
      entries.reduce((sum, entry) => sum + Number(entry.mood), 0) / entries.length

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
      correlationLabel =
        magnitude < 0.2
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

  return {
    windowAverages,
    streak,
    sleepConsistencyLabel,
    correlationLabel,
    correlationDirection,
    moodBySleepThreshold,
  }
}
