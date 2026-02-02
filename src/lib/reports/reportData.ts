import type { Entry } from '../entries'
import { calculateAverages } from '../utils/averages'
import { getCorrelationInsight } from '../utils/correlation'
import { getSleepConsistencyLabel } from '../utils/sleepConsistency'
import { buildTagInsights } from '../utils/tagInsights'
import { formatLongDate } from '../utils/dateFormatters'

export type ReportRange = {
  start: Date
  end: Date
  priorStart: Date
  priorEnd: Date
}

export type WeeklySummary = {
  label: string
  avgSleep: number | null
  avgMood: number | null
  sleepStdDev: number | null
}

export type MoodDip = {
  from: Entry
  to: Entry
  delta: number
}

export type ReportData = {
  recentEntries: Entry[]
  priorEntries: Entry[]
  monthlyConsistency: string | null
  monthlyCorrelation: string | null
  monthlyTags: ReturnType<typeof buildTagInsights>
  allTimeTags: ReturnType<typeof buildTagInsights>
  avgSleep: number | null
  avgMood: number | null
  priorAvgSleep: number | null
  priorAvgMood: number | null
  sleepDelta: number | null
  moodDelta: number | null
  bestDay: Entry | null
  bestNight: Entry | null
  biggestMoodDip: MoodDip | null
  weeklySummaries: WeeklySummary[]
  allTimeAvgSleep: number | null
  allTimeAvgMood: number | null
}

export const getReportRange = (rangeDays: number): ReportRange => {
  const end = new Date()
  end.setHours(0, 0, 0, 0)
  const start = new Date(end)
  start.setDate(end.getDate() - (rangeDays - 1))
  const priorStart = new Date(start)
  priorStart.setDate(start.getDate() - rangeDays)
  const priorEnd = new Date(start)
  priorEnd.setDate(start.getDate() - 1)

  return {
    start,
    end,
    priorStart,
    priorEnd,
  }
}

export const getEntriesInRange = (
  entries: Entry[],
  start: Date,
  end: Date,
) => entries.filter((entry) => {
  const date = new Date(`${entry.entry_date}T00:00:00`)
  date.setHours(0, 0, 0, 0)
  return date >= start && date <= end
})

const calculateStdDev = (values: number[]) => {
  if (values.length < 2) return null
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance = values.reduce(
    (sum, value) => sum + (value - mean) ** 2,
    0,
  ) / values.length
  return Math.sqrt(variance)
}

const buildWeeklySummaries = (recentEntries: Entry[]): WeeklySummary[] => {
  if (!recentEntries.length) return []
  const sorted = [...recentEntries].sort((a, b) =>
    a.entry_date.localeCompare(b.entry_date),
  )
  const weekBuckets: Record<string, {
    count: number
    sleep: number
    mood: number
    sleeps: number[]
  }> = {}
  sorted.forEach((entry) => {
    const date = new Date(`${entry.entry_date}T00:00:00`)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const key = weekStart.toISOString().slice(0, 10)
    if (!weekBuckets[key]) {
      weekBuckets[key] = { count: 0, sleep: 0, mood: 0, sleeps: [] }
    }
    const sleepValue = Number(entry.sleep_hours)
    if (Number.isFinite(sleepValue)) {
      weekBuckets[key].sleeps.push(sleepValue)
    }
    weekBuckets[key].count += 1
    weekBuckets[key].sleep += Number(entry.sleep_hours) || 0
    weekBuckets[key].mood += Number(entry.mood) || 0
  })
  return Object.entries(weekBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([startKey, totals]) => {
      const weekStart = new Date(`${startKey}T00:00:00`)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      const avgSleep = totals.count ? totals.sleep / totals.count : null
      const avgMood = totals.count ? totals.mood / totals.count : null
      const sleepStdDev = calculateStdDev(totals.sleeps)
      return {
        label: `${formatLongDate(weekStart)} - ${formatLongDate(weekEnd)}`,
        avgSleep,
        avgMood,
        sleepStdDev,
      }
    })
    .slice(-4)
}

const findBestDay = (recentEntries: Entry[]) =>
  recentEntries.reduce<Entry | null>((best, entry) => {
    if (!best || Number(entry.mood) > Number(best.mood)) return entry
    return best
  }, null)

const findBestNight = (recentEntries: Entry[]) =>
  recentEntries.reduce<Entry | null>((best, entry) => {
    const sleepValue = Number(entry.sleep_hours)
    if (!Number.isFinite(sleepValue)) return best
    if (!best) return entry
    const bestSleepValue = Number(best.sleep_hours)
    if (!Number.isFinite(bestSleepValue)) return entry
    return sleepValue > bestSleepValue ? entry : best
  }, null)

const findBiggestMoodDip = (recentEntries: Entry[]) => {
  if (recentEntries.length < 2) return null
  const sorted = [...recentEntries].sort((a, b) =>
    a.entry_date.localeCompare(b.entry_date),
  )
  let dip: MoodDip | null = null
  for (let i = 1; i < sorted.length; i += 1) {
    const previous = sorted[i - 1]
    const current = sorted[i]
    const previousMood = Number(previous.mood)
    const currentMood = Number(current.mood)
    if (!Number.isFinite(previousMood) || !Number.isFinite(currentMood)) continue
    const delta = currentMood - previousMood
    if (delta < 0 && (!dip || Math.abs(delta) > Math.abs(dip.delta))) {
      dip = { from: previous, to: current, delta }
    }
  }
  return dip
}

export const buildReportData = (
  entries: Entry[],
  recentEntries: Entry[],
  priorEntries: Entry[],
): ReportData => {
  const monthlyConsistency = getSleepConsistencyLabel(recentEntries)
  const monthlyCorrelation = getCorrelationInsight(recentEntries).label

  const monthlyTags = buildTagInsights(recentEntries, 5)
  const allTimeTags = buildTagInsights(entries, 5)

  const { sleep: avgSleep, mood: avgMood } = calculateAverages(recentEntries)
  const { sleep: priorAvgSleep, mood: priorAvgMood } = calculateAverages(priorEntries)

  const bestDay = findBestDay(recentEntries)
  const bestNight = findBestNight(recentEntries)
  const biggestMoodDip = findBiggestMoodDip(recentEntries)
  const weeklySummaries = buildWeeklySummaries(recentEntries)

  const sleepDelta = avgSleep !== null && priorAvgSleep !== null
    ? avgSleep - priorAvgSleep
    : null
  const moodDelta = avgMood !== null && priorAvgMood !== null
    ? avgMood - priorAvgMood
    : null

  const {
    sleep: allTimeAvgSleep,
    mood: allTimeAvgMood,
  } = calculateAverages(entries)

  return {
    recentEntries,
    priorEntries,
    monthlyConsistency,
    monthlyCorrelation,
    monthlyTags,
    allTimeTags,
    avgSleep,
    avgMood,
    priorAvgSleep,
    priorAvgMood,
    sleepDelta,
    moodDelta,
    bestDay,
    bestNight,
    biggestMoodDip,
    weeklySummaries,
    allTimeAvgSleep,
    allTimeAvgMood,
  }
}
