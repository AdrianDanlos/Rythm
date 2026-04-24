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
 * Consecutive complete calendar days, anchored to the present.
 *
 * Rules:
 * - If today is complete, streak ends today.
 * - If today is not complete, streak ends yesterday (so you get the full day to log).
 * - If yesterday is missing, streak is 0 (old streaks don't persist indefinitely).
 */
export function getCurrentCompleteStreak(
  entries: Entry[],
  formatLocalDate: (date: Date) => string,
  options?: { today?: Date },
): number {
  const complete = entries.filter(entry => entry.is_complete)
  if (!complete.length) return 0
  const dateSet = new Set(complete.map(entry => entry.entry_date))

  const today = new Date(options?.today ?? new Date())
  today.setHours(0, 0, 0, 0)
  const todayKey = formatLocalDate(today)

  const anchor = new Date(today)
  if (!dateSet.has(todayKey)) {
    anchor.setDate(anchor.getDate() - 1)
    const anchorKey = formatLocalDate(anchor)
    if (!dateSet.has(anchorKey)) return 0
  }

  let streak = 0
  const cursor = new Date(anchor)
  while (true) {
    const key = formatLocalDate(cursor)
    if (!dateSet.has(key)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
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
