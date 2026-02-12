import type { Entry } from '../entries'
import type { WindowStats } from '../types/stats'

export const calculateAverages = (entries: Entry[]): WindowStats => {
  if (!entries.length) {
    return { sleep: null, mood: null, count: 0 }
  }

  let sleepSum = 0
  let sleepCount = 0
  let moodSum = 0
  let moodCount = 0
  let completeCount = 0

  entries.forEach((entry) => {
    const sleep = entry.sleep_hours === null ? Number.NaN : Number(entry.sleep_hours)
    const mood = entry.mood === null ? Number.NaN : Number(entry.mood)
    const hasSleep = Number.isFinite(sleep)
    const hasMood = Number.isFinite(mood)
    if (hasSleep) {
      sleepSum += sleep
      sleepCount += 1
    }
    if (hasMood) {
      moodSum += mood
      moodCount += 1
    }
    if (hasSleep && hasMood) {
      completeCount += 1
    }
  })

  return {
    sleep: sleepCount ? sleepSum / sleepCount : null,
    mood: moodCount ? moodSum / moodCount : null,
    count: completeCount,
  }
}
