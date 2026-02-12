import type { Entry } from '../entries'
import type { TagDriver, TagInsight, TagSleepDriver } from '../types/stats'

export const DEFAULT_TAG_DRIVER_MIN_COUNT = 3

/** Returns YYYY-MM-DD for the calendar day before entryDate. */
function getPrevDateString(entryDate: string): string {
  const d = new Date(`${entryDate}T12:00:00`)
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export const buildTagInsights = (entries: Entry[], limit?: number) => {
  const aggregates = new Map<
    string,
    {
      sleepSum: number
      sleepCount: number
      moodSum: number
      moodCount: number
      count: number
    }
  >()
  entries.forEach((entry) => {
    const sleep = entry.sleep_hours === null ? Number.NaN : Number(entry.sleep_hours)
    const mood = entry.mood === null ? Number.NaN : Number(entry.mood)
    const hasSleep = Number.isFinite(sleep)
    const hasMood = Number.isFinite(mood)
    const tags = entry.tags ?? []
    tags.forEach((tag) => {
      const key = tag.trim()
      if (!key) return
      const current = aggregates.get(key) ?? {
        sleepSum: 0,
        sleepCount: 0,
        moodSum: 0,
        moodCount: 0,
        count: 0,
      }
      if (hasSleep) {
        current.sleepSum += sleep
        current.sleepCount += 1
      }
      if (hasMood) {
        current.moodSum += mood
        current.moodCount += 1
      }
      current.count += 1
      aggregates.set(key, current)
    })
  })

  const insights: TagInsight[] = Array.from(aggregates.entries())
    .map(([tag, data]) => ({
      tag,
      sleep: data.sleepCount ? data.sleepSum / data.sleepCount : null,
      mood: data.moodCount ? data.moodSum / data.moodCount : null,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)

  return typeof limit === 'number' ? insights.slice(0, limit) : insights
}

export const buildTagDrivers = (
  entries: Entry[],
  minCount: number = DEFAULT_TAG_DRIVER_MIN_COUNT,
): TagDriver[] => {
  if (!entries.length) return []
  const aggregates = new Map<string, { moodSum: number, count: number }>()
  let overallMoodSum = 0
  let overallCount = 0

  entries.forEach((entry) => {
    const mood = entry.mood === null ? Number.NaN : Number(entry.mood)
    if (!Number.isFinite(mood)) return
    overallMoodSum += mood
    overallCount += 1

    const tags = new Set((entry.tags ?? []).map(tag => tag.trim()))
    tags.forEach((tag) => {
      if (!tag) return
      const current = aggregates.get(tag) ?? { moodSum: 0, count: 0 }
      current.moodSum += mood
      current.count += 1
      aggregates.set(tag, current)
    })
  })

  if (!overallCount) return []

  const drivers: TagDriver[] = Array.from(aggregates.entries())
    .map(([tag, data]) => {
      const moodWith = data.count ? data.moodSum / data.count : null
      const withoutCount = overallCount - data.count
      const moodWithout = withoutCount > 0
        ? (overallMoodSum - data.moodSum) / withoutCount
        : null
      const delta = moodWith !== null && moodWithout !== null
        ? moodWith - moodWithout
        : null

      return {
        tag,
        count: data.count,
        moodWith,
        moodWithout,
        delta,
      }
    })
    .filter(driver => driver.count >= minCount && driver.delta !== null)
    .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))

  return drivers
}

/**
 * Tag → sleep impact using previous day's tags (D-1).
 * For each entry D with sleep, uses tags from the entry for D-1.
 * Positive delta = more sleep when that tag was on the previous day.
 */
export const buildTagSleepDrivers = (
  entries: Entry[],
  minCount: number = DEFAULT_TAG_DRIVER_MIN_COUNT,
): TagSleepDriver[] => {
  if (!entries.length) return []
  const byDate = new Map(entries.map(e => [e.entry_date, e]))
  let totalSleepSum = 0
  let totalCount = 0
  const tagData = new Map<string, { sleepSum: number, count: number }>()

  entries.forEach((entry) => {
    const sleep = entry.sleep_hours === null ? Number.NaN : Number(entry.sleep_hours)
    if (!Number.isFinite(sleep)) return
    const prevDate = getPrevDateString(entry.entry_date)
    const prevEntry = byDate.get(prevDate)
    if (!prevEntry?.tags?.length) return
    totalSleepSum += sleep
    totalCount += 1
    const tags = new Set((prevEntry.tags ?? []).map(t => t.trim()).filter(Boolean))
    tags.forEach((tag) => {
      const current = tagData.get(tag) ?? { sleepSum: 0, count: 0 }
      current.sleepSum += sleep
      current.count += 1
      tagData.set(tag, current)
    })
  })

  if (!totalCount) return []

  return Array.from(tagData.entries())
    .map(([tag, data]) => {
      const sleepWith = data.count ? data.sleepSum / data.count : null
      const withoutCount = totalCount - data.count
      const sleepWithout = withoutCount > 0
        ? (totalSleepSum - data.sleepSum) / withoutCount
        : null
      const delta = sleepWith !== null && sleepWithout !== null
        ? sleepWith - sleepWithout
        : null
      return {
        tag,
        count: data.count,
        sleepWith,
        sleepWithout,
        delta,
      }
    })
    .filter(d => d.count >= minCount && d.delta !== null)
    .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))
}
