import type { Entry } from '../entries'

const MS_PER_DAY = 24 * 60 * 60 * 1000

const parseDay = (entryDate: string) => {
  const d = new Date(`${entryDate}T00:00:00`)
  d.setHours(0, 0, 0, 0)
  return d
}

const daysBetween = (from: Date, to: Date) =>
  Math.round((to.getTime() - from.getTime()) / MS_PER_DAY)

/**
 * Consecutive complete days ending at the latest complete entry date
 * (same logic as Insights streak).
 */
export function getCurrentCompleteStreak(
  entries: Entry[],
  formatLocalDate: (date: Date) => string,
): number {
  const complete = entries.filter(entry => entry.is_complete)
  if (!complete.length) return 0
  const dateSet = new Set(complete.map(entry => entry.entry_date))
  const latestDate = complete.reduce(
    (max, entry) => (entry.entry_date > max ? entry.entry_date : max),
    complete[0].entry_date,
  )
  let streak = 0
  const current = new Date(`${latestDate}T00:00:00`)
  while (true) {
    const key = formatLocalDate(current)
    if (!dateSet.has(key)) break
    streak += 1
    current.setDate(current.getDate() - 1)
  }
  return streak
}

/** Longest run of consecutive calendar days with at least one complete entry. */
export function getLongestCompleteStreak(entries: Entry[]): number {
  const dates = [...new Set(
    entries.filter(e => e.is_complete).map(e => e.entry_date),
  )].sort()
  if (!dates.length) return 0
  let maxRun = 1
  let run = 1
  for (let i = 1; i < dates.length; i++) {
    const diff = daysBetween(parseDay(dates[i - 1]), parseDay(dates[i]))
    if (diff === 1) {
      run += 1
      maxRun = Math.max(maxRun, run)
    }
    else {
      run = 1
    }
  }
  return maxRun
}
