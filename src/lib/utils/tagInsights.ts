import type { Entry } from '../entries'
import type { TagInsight } from '../types/stats'

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
