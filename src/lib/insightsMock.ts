import type { RollingPoint, TrendPoint } from './types/stats'

const clampValue = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const formatPreviewDate = (offsetDays: number) => {
  const date = new Date()
  date.setDate(date.getDate() - offsetDays)
  return date.toISOString().slice(0, 10)
}

export const buildMockRollingSeries = (pointCount = 90): RollingPoint[] => {
  return Array.from({ length: pointCount }, (_, index) => {
    const phase = index / 8
    const longPhase = index / 22
    const sleepBase = 7.2
    const moodBase = 3.4
    const sleepWave = Math.sin(phase) * 0.6 + Math.cos(longPhase) * 0.3
    const moodWave = Math.sin(phase + 0.8) * 0.35 + Math.cos(longPhase + 0.4) * 0.2

    const sleep7 = clampValue(sleepBase + sleepWave + 0.1, 4.2, 9.4)
    const sleep30 = clampValue(sleepBase + sleepWave * 0.7, 4.4, 9.2)
    const sleep90 = clampValue(sleepBase + sleepWave * 0.45, 4.6, 9.0)
    const mood7 = clampValue(moodBase + moodWave + 0.05, 1.3, 4.8)
    const mood30 = clampValue(moodBase + moodWave * 0.7, 1.4, 4.6)
    const mood90 = clampValue(moodBase + moodWave * 0.45, 1.5, 4.4)

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
    const phase = index / 6
    const longPhase = index / 18
    const sleepBase = 7.1
    const moodBase = 3.3
    const sleepWave = Math.sin(phase) * 0.7 + Math.cos(longPhase) * 0.35
    const moodWave = Math.sin(phase + 0.6) * 0.4 + Math.cos(longPhase + 0.2) * 0.25

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
