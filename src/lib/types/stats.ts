export type SleepMoodAverages = {
  sleep: number | null
  mood: number | null
}

export type WindowStats = SleepMoodAverages & {
  count: number
}

export type TrendPoint = {
  date: string
  sleep: number | null
  mood: number | null
}

export type RollingPoint = {
  date: string
  sleep7: number | null
  sleep30: number | null
  sleep90: number | null
  mood7: number | null
  mood30: number | null
  mood90: number | null
}

export type RollingSummary = {
  days: number
  sleep: number | null
  mood: number | null
  sleepDelta: number | null
  moodDelta: number | null
}

export type WeekdayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export type WeekdayAveragePoint = {
  dayKey: WeekdayKey
  label: string
  avgSleep: number | null
  avgMood: number | null
  observationCount: number
}

export type TagInsight = {
  tag: string
  sleep: number | null
  mood: number | null
  count: number
}

export type TagDriver = {
  tag: string
  count: number
  moodWith: number | null
  moodWithout: number | null
  delta: number | null
}

export type TagSleepDriver = {
  tag: string
  count: number
  sleepWith: number | null
  sleepWithout: number | null
  delta: number | null
}

export type Badge = {
  id: string
  title: string
  description: string
  unlocked: boolean
  progressText: string | null
  progressValue: number
  progressTotal: number
  /** 0-based tier for incremental badges; 0 = locked, 1 = unlocked for non-incremental */
  currentTierIndex: number
  /** Total tiers (1 for non-incremental) */
  tierCount: number
}
