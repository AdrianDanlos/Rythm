import type { Entry } from '../entries'

export type CorrelationLevel =
  | 'notClear'
  | 'weak'
  | 'moderate'
  | 'strong'

export type CorrelationDirection =
  | 'higherSleepSlightlyBetterMood'
  | 'higherSleepBetterMood'
  | 'higherSleepClearlyBetterMood'
  | 'higherSleepSlightlyLowerMood'
  | 'higherSleepLowerMood'
  | 'higherSleepClearlyLowerMood'
  | 'noClearDirection'

type CorrelationInsight = {
  label: CorrelationLevel | null
  direction: CorrelationDirection | null
}

const DIRECTION_BY_STRENGTH: Record<
  Exclude<CorrelationLevel, 'notClear'>,
  { positive: CorrelationDirection, negative: CorrelationDirection }
> = {
  weak: { positive: 'higherSleepSlightlyBetterMood', negative: 'higherSleepSlightlyLowerMood' },
  moderate: { positive: 'higherSleepBetterMood', negative: 'higherSleepLowerMood' },
  strong: { positive: 'higherSleepClearlyBetterMood', negative: 'higherSleepClearlyLowerMood' },
}

export const getCorrelationInsight = (entries: Entry[]): CorrelationInsight => {
  const pairedEntries = entries.filter((entry) => {
    const sleep = entry.sleep_hours === null ? Number.NaN : Number(entry.sleep_hours)
    const mood = entry.mood === null ? Number.NaN : Number(entry.mood)
    return Number.isFinite(sleep) && Number.isFinite(mood)
  })

  if (pairedEntries.length < 4) {
    return { label: null, direction: null }
  }

  const meanSleep
    = pairedEntries.reduce((sum, entry) => sum + Number(entry.sleep_hours), 0)
      / pairedEntries.length
  const meanMood
    = pairedEntries.reduce((sum, entry) => sum + Number(entry.mood), 0) / pairedEntries.length

  let numerator = 0
  let sumSleep = 0
  let sumMood = 0

  pairedEntries.forEach((entry) => {
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
    = magnitude < 0.12
      ? 'notClear'
      : magnitude < 0.3
        ? 'weak'
        : magnitude < 0.55
          ? 'moderate'
          : 'strong'

  const direction: CorrelationDirection
    = Math.abs(correlation) <= 0.02 || label === 'notClear'
      ? 'noClearDirection'
      : DIRECTION_BY_STRENGTH[label][correlation > 0.02 ? 'positive' : 'negative']

  return { label, direction }
}
