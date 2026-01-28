import type { Entry } from '../entries'
import type { WindowStats } from '../types/stats'

export const calculateAverages = (entries: Entry[]): WindowStats => {
  if (!entries.length) {
    return { sleep: null, mood: null, count: 0 }
  }

  const totals = entries.reduce(
    (acc, entry) => {
      acc.sleep += Number(entry.sleep_hours)
      acc.mood += Number(entry.mood)
      return acc
    },
    { sleep: 0, mood: 0 },
  )

  return {
    sleep: totals.sleep / entries.length,
    mood: totals.mood / entries.length,
    count: entries.length,
  }
}
