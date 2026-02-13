import type { RollingPoint, TagDriver, TagSleepDriver, TrendPoint } from './types/stats'

const clampValue = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const formatPreviewDate = (offsetDays: number) => {
  const date = new Date()
  date.setDate(date.getDate() - offsetDays)
  return date.toISOString().slice(0, 10)
}

export const buildMockRollingSeries = (pointCount = 90): RollingPoint[] => {
  return Array.from({ length: pointCount }, (_, index) => {
    const phase = index / 6
    const longPhase = index / 16
    const sleepBase = 7.2
    const moodBase = 3.4
    const sleepWave = Math.sin(phase) * 0.9 + Math.cos(longPhase) * 0.5
    const moodWave = Math.sin(phase + 0.8) * 0.55 + Math.cos(longPhase + 0.4) * 0.35

    const sleep7 = clampValue(sleepBase + sleepWave + 0.1, 4.2, 9.4)
    const sleep30 = clampValue(sleepBase + sleepWave * 0.75, 4.4, 9.2)
    const sleep90 = clampValue(sleepBase + sleepWave * 0.5, 4.6, 9.0)
    const mood7 = clampValue(moodBase + moodWave + 0.05, 1.3, 4.8)
    const mood30 = clampValue(moodBase + moodWave * 0.75, 1.4, 4.6)
    const mood90 = clampValue(moodBase + moodWave * 0.5, 1.5, 4.4)

    return {
      date: formatPreviewDate(pointCount - 1 - index),
      sleep7: Number(sleep7.toFixed(1)),
      sleep30: Number(sleep30.toFixed(1)),
      sleep90: Number(sleep90.toFixed(1)),
      mood7: Number(mood7.toFixed(1)),
      mood30: Number(mood30.toFixed(1)),
      mood90: Number(mood90.toFixed(1)),
    }
  })
}

const buildMockTrendPoints = (pointCount: number): TrendPoint[] => {
  return Array.from({ length: pointCount }, (_, index) => {
    const phase = index / 5
    const longPhase = index / 14
    const sleepBase = 7.1
    const moodBase = 3.3
    const sleepWave = Math.sin(phase) * 0.95 + Math.cos(longPhase) * 0.5
    const moodWave = Math.sin(phase + 0.6) * 0.6 + Math.cos(longPhase + 0.2) * 0.4

    const sleep = clampValue(sleepBase + sleepWave, 4.1, 9.5)
    const mood = clampValue(moodBase + moodWave, 1.2, 4.9)

    return {
      date: formatPreviewDate(pointCount - 1 - index),
      sleep: Number(sleep.toFixed(1)),
      mood: Number(mood.toFixed(1)),
    }
  })
}

export const buildMockTrendSeries = () => ({
  last30: buildMockTrendPoints(30),
  last90: buildMockTrendPoints(90),
  last365: buildMockTrendPoints(365),
})

export const buildMockTagDrivers = (): TagDriver[] => [
  { tag: 'Exercise', count: 12, moodWith: 3.8, moodWithout: 3.2, delta: 0.6 },
  { tag: 'Meditation', count: 8, moodWith: 3.9, moodWithout: 3.3, delta: 0.5 },
  { tag: 'Late night', count: 10, moodWith: 2.9, moodWithout: 3.4, delta: -0.5 },
  { tag: 'Skipped meal', count: 6, moodWith: 2.8, moodWithout: 3.3, delta: -0.4 },
]

export const buildMockTagSleepDrivers = (): TagSleepDriver[] => [
  { tag: 'No caffeine', count: 14, sleepWith: 7.4, sleepWithout: 6.9, delta: 0.5 },
  { tag: 'Wind down', count: 9, sleepWith: 7.2, sleepWithout: 6.7, delta: 0.4 },
  { tag: 'Screen time', count: 11, sleepWith: 6.2, sleepWithout: 6.8, delta: -0.5 },
  { tag: 'Stress', count: 7, sleepWith: 6.1, sleepWithout: 6.6, delta: -0.4 },
]

/** Minimal shape for scatter chart; used for Pro teaser preview. */
export type MockScatterPoint = {
  id: string
  sleep_hours_clamped: number
  sleep_hours_jittered: number
  mood_jittered: number
  mood: number
}

/** Quasi-random in [0,1] from index to spread points without clustering. */
const scatterHash = (index: number, prime: number) => ((index * prime) % 101) / 101

export const buildMockScatterPlottedData = (pointCount = 180): MockScatterPoint[] => {
  return Array.from({ length: pointCount }, (_, index) => {
    // Spread across full chart: sleep 4–10h, mood 1–5 (different primes so points don't line up)
    const sleepNorm = scatterHash(index, 17) * 0.85 + 0.075
    const moodNorm = scatterHash(index, 31) * 0.85 + 0.075
    const sleep = 4 + sleepNorm * 6
    const mood = 1 + moodNorm * 4
    const jitter = (scatterHash(index, 7) - 0.5) * 0.25
    const sleepJittered = clampValue(sleep + jitter, 4, 10)
    const moodJittered = clampValue(mood + jitter * 0.5, 1, 5)
    return {
      id: `mock-scatter-${index}`,
      sleep_hours_clamped: sleep,
      sleep_hours_jittered: sleepJittered,
      mood_jittered: moodJittered,
      mood: Math.round(mood * 10) / 10,
    }
  })
}
