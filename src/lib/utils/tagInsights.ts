import type { Entry } from '../entries'
import type { TagDriver, TagInsight } from '../types/stats'

export const DEFAULT_TAG_DRIVER_MIN_COUNT = 3

export const buildTagInsights = (entries: Entry[], limit?: number) => {
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

  const insights: TagInsight[] = Array.from(aggregates.entries())
    .map(([tag, data]) => ({
      tag,
      sleep: data.count ? data.sleepSum / data.count : null,
      mood: data.count ? data.moodSum / data.count : null,
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
    const mood = Number(entry.mood)
    if (Number.isNaN(mood)) return
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
