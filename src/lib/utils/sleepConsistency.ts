import type { Entry } from '../entries'

const getSleepConsistencyStdDev = (entries: Entry[]) => {
  const sleepEntries = entries.filter((entry) => {
    const value = Number(entry.sleep_hours)
    return Number.isFinite(value)
  })
  if (sleepEntries.length < 2) return null
  const mean
    = sleepEntries.reduce((sum, entry) => sum + Number(entry.sleep_hours), 0)
      / sleepEntries.length
  const variance
    = sleepEntries.reduce((sum, entry) => {
      const diff = Number(entry.sleep_hours) - mean
      return sum + diff * diff
    }, 0) / sleepEntries.length
  return Math.sqrt(variance)
}

export const getSleepConsistencyLabel = (entries: Entry[]) => {
  const sleepConsistency = getSleepConsistencyStdDev(entries)
  if (sleepConsistency === null) return null
  if (sleepConsistency <= 0.9) return 'Very consistent'
  if (sleepConsistency <= 2.0) return 'Consistent'
  if (sleepConsistency <= 3.5) return 'Mixed'
  return 'Unstable'
}
