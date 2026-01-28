import type { Entry } from '../entries'

type CorrelationInsight = {
  label: string | null
  direction: string | null
}

export const getCorrelationInsight = (entries: Entry[]): CorrelationInsight => {
  if (entries.length < 2) {
    return { label: null, direction: null }
  }

  const meanSleep
    = entries.reduce((sum, entry) => sum + Number(entry.sleep_hours), 0)
      / entries.length
  const meanMood
    = entries.reduce((sum, entry) => sum + Number(entry.mood), 0) / entries.length

  let numerator = 0
  let sumSleep = 0
  let sumMood = 0

  entries.forEach((entry) => {
    const sleepDelta = Number(entry.sleep_hours) - meanSleep
    const moodDelta = Number(entry.mood) - meanMood
    numerator += sleepDelta * moodDelta
    sumSleep += sleepDelta * sleepDelta
    sumMood += moodDelta * moodDelta
  })

  const denominator = Math.sqrt(sumSleep * sumMood)
  if (denominator === 0) {
    return { label: null, direction: null }
  }

  const correlation = numerator / denominator
  const magnitude = Math.abs(correlation)
  const label
    = magnitude < 0.2
      ? 'No clear'
      : magnitude < 0.4
        ? 'Weak'
        : magnitude < 0.7
          ? 'Moderate'
          : 'Strong'

  const direction
    = correlation > 0.05
      ? 'Higher sleep, better mood'
      : correlation < -0.05
        ? 'Higher sleep, lower mood'
        : 'No clear direction'

  return { label, direction }
}
