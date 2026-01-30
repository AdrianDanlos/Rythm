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

export type SleepConsistencyBadge = {
  id: string
  title: string
  description: string
  unlocked: boolean
  progressText: string | null
  progressValue: number
  progressTotal: number
}
