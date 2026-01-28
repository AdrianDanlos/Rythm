import type { Entry } from '../entries'

export const getSleepConsistencyLabel = (entries: Entry[]) => {
  if (!entries.length) return null
  const mean
    = entries.reduce((sum, entry) => sum + Number(entry.sleep_hours), 0)
      / entries.length
  const variance
    = entries.reduce((sum, entry) => {
      const diff = Number(entry.sleep_hours) - mean
      return sum + diff * diff
    }, 0) / entries.length
  const sleepConsistency = Math.sqrt(variance)
  if (sleepConsistency <= 0.9) return 'Very consistent'
  if (sleepConsistency <= 2.0) return 'Consistent'
  if (sleepConsistency <= 3.5) return 'Mixed'
  return 'Unstable'
}
