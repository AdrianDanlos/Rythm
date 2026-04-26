import type { Entry } from '../entries'

const parseDay = (entryDate: string) => {
  const d = new Date(`${entryDate}T00:00:00`)
  d.setHours(0, 0, 0, 0)
  return d
}

const localDateKey = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Consecutive complete log days, anchored to the present.
 * Partial days (entry row exists, not complete) do not add to the count
 * and do not break the chain. Only a calendar day with no entry at all
 * is a gap that ends the streak.
 *
 * - Anchor: today if complete, else yesterday if that day has any entry (or
 *   the streak would end when today and yesterday are both without a row).
 * - A partial for today and a blank yesterday yields streak 0.
 */
export function getCurrentCompleteStreak(
  entries: Entry[],
  formatLocalDate: (date: Date) => string,
  options?: { today?: Date },
): number {
  if (!entries.length) return 0
  const completeByDate = new Set(
    entries.filter(e => e.is_complete).map(e => e.entry_date),
  )
  if (!completeByDate.size) return 0
  const anyByDate = new Set(entries.map(e => e.entry_date))

  const today = new Date(options?.today ?? new Date())
  today.setHours(0, 0, 0, 0)
  const todayKey = formatLocalDate(today)
  const yest = new Date(today)
  yest.setDate(yest.getDate() - 1)
  const yestKey = formatLocalDate(yest)

  let anchor: Date
  if (completeByDate.has(todayKey)) {
    anchor = today
  }
  else if (anyByDate.has(yestKey)) {
    anchor = yest
  }
  else if (anyByDate.has(todayKey)) {
    return 0
  }
  else {
    return 0
  }

  let streak = 0
  const cursor = new Date(anchor)
  while (true) {
    const key = formatLocalDate(cursor)
    if (!anyByDate.has(key)) break
    if (completeByDate.has(key)) {
      streak += 1
    }
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/**
 * Longest run: count complete days in any chain of days where each day has
 * an entry; blank calendar days (no row) break the run. Partials do not
 * add to the count and do not break a run of complete days.
 */
export function getLongestCompleteStreak(entries: Entry[]): number {
  const allDates = [...new Set(entries.map(e => e.entry_date))]
  if (!allDates.length) return 0
  const completeSet = new Set(
    entries.filter(e => e.is_complete).map(e => e.entry_date),
  )
  const anySet = new Set(allDates)
  const sorted = allDates.map(parseDay).sort((a, b) => a.getTime() - b.getTime())
  const minD = sorted[0]!
  const maxD = sorted[sorted.length - 1]!

  let run = 0
  let maxRun = 0
  for (let d = new Date(minD); d.getTime() <= maxD.getTime(); d.setDate(d.getDate() + 1)) {
    const key = localDateKey(d)
    if (!anySet.has(key)) {
      maxRun = Math.max(maxRun, run)
      run = 0
    }
    else {
      if (completeSet.has(key)) {
        run += 1
      }
      maxRun = Math.max(maxRun, run)
    }
  }
  return Math.max(maxRun, run)
}
