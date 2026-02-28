import type { Entry } from '../entries'
import { t } from 'i18next'
import type { StatCounts } from '../stats'
import type { RollingSummary, WeekdayAveragePoint, WindowStats } from '../types/stats'

const WEEKDAY_FULL_LABEL: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
}

export type MotivationContext = {
  entries: Entry[]
  statCounts: StatCounts
  streak: number
  windowAverages: { last7: WindowStats, last30: WindowStats }
  rollingSummaries: RollingSummary[]
  rhythmScore: number | null
  moodBySleepDeltaPercent: number | null
  hasMissingStats: boolean
  weekdayAverages: WeekdayAveragePoint[]
  correlationLabel: string | null
}

type MessageDef = {
  id: string
  condition: (ctx: MotivationContext) => boolean
  getText: (ctx: MotivationContext) => string
}

const MOTIVATION_MESSAGES: MessageDef[] = [
  {
    id: 'streak-building',
    condition: ctx => ctx.streak >= 7 && ctx.streak < 30,
    getText: () => t('motivation.streakBuilding'),
  },
  {
    id: 'sleep-improving',
    condition: (ctx) => {
      const summary7 = ctx.rollingSummaries.find(s => s.days === 7)
      return summary7 != null && summary7.sleepDelta != null && summary7.sleepDelta > 0
    },
    getText: () => t('motivation.sleepImproving'),
  },
  {
    id: 'mood-trend-up',
    condition: (ctx) => {
      const summary7 = ctx.rollingSummaries.find(s => s.days === 7)
      return summary7 != null && summary7.moodDelta != null && summary7.moodDelta > 0
    },
    getText: () => t('motivation.moodTrendUp'),
  },
  {
    id: 'mood-better-when-sleep-better',
    condition: ctx =>
      ctx.moodBySleepDeltaPercent != null && ctx.moodBySleepDeltaPercent >= 10,
    getText: ctx => t('motivation.moodBetterWhenSleepBetter', {
      percent: Math.round(ctx.moodBySleepDeltaPercent!),
    }),
  },
  {
    id: 'new-first-week',
    condition: ctx => ctx.statCounts.completeEntries <= 7,
    getText: () => t('motivation.newFirstWeek'),
  },
  {
    id: 'coming-back-after-gap',
    condition: ctx =>
      ctx.streak === 1 && ctx.statCounts.completeEntries > 7,
    getText: () => t('motivation.comingBackAfterGap'),
  },
  {
    id: 'sleep-consistency-improving',
    condition: ctx =>
      ctx.rhythmScore != null && ctx.rhythmScore >= 70,
    getText: () => t('motivation.sleepConsistencyImproving'),
  },
  {
    id: 'unlocked-several-stats',
    condition: (ctx) => {
      const n = ctx.statCounts.completeEntries
      return !ctx.hasMissingStats && n >= 3 && n <= 5
    },
    getText: () => t('motivation.unlockedSeveralStats'),
  },
  {
    id: 'weekday-pattern',
    condition: (ctx) => {
      if (ctx.statCounts.completeEntries < 30) return false
      const withData = ctx.weekdayAverages.filter(
        d => d.observationCount >= 2 && d.avgSleep != null,
      )
      return withData.length >= 1
    },
    getText: (ctx) => {
      const withData = ctx.weekdayAverages
        .filter(d => d.observationCount >= 2 && d.avgSleep != null)
        .sort((a, b) => (b.avgSleep ?? 0) - (a.avgSleep ?? 0))
      const best = withData[0]
      const dayLabel = best
        ? WEEKDAY_FULL_LABEL[best.label] ?? best.label
        : ''
      return t('motivation.weekdayPattern', { day: dayLabel })
    },
  },
  {
    id: 'logging-on-low-mood-days',
    condition: (ctx) => {
      const withMood = ctx.entries.filter(
        e => e.mood != null && Number.isFinite(Number(e.mood)),
      )
      if (withMood.length < 5) return false
      const lowMoodCount = withMood.filter(e => Number(e.mood) <= 2).length
      return lowMoodCount >= 3 && lowMoodCount / withMood.length >= 0.15
    },
    getText: () => t('motivation.loggingLowMoodDays'),
  },
  {
    id: 'long-term-tracker',
    condition: ctx => ctx.statCounts.completeEntries >= 60,
    getText: ctx => t('motivation.longTermTracker', {
      count: ctx.statCounts.completeEntries,
    }),
  },
  {
    id: 'tip-anchor-wake',
    condition: () => true,
    getText: () => t('motivation.tipAnchorWake'),
  },
  {
    id: 'tip-morning-light',
    condition: () => true,
    getText: () => t('motivation.tipMorningLight'),
  },
  {
    id: 'tip-move-often',
    condition: () => true,
    getText: () => t('motivation.tipMoveOften'),
  },
  {
    id: 'tip-wind-down',
    condition: () => true,
    getText: () => t('motivation.tipWindDown'),
  },
  {
    id: 'tip-connection',
    condition: () => true,
    getText: () => t('motivation.tipConnection'),
  },
]

function daySeed(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function simpleHash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

/**
 * Returns one motivational message based on current context.
 * When multiple messages are eligible, picks one by day-based rotation for variance.
 * At least one message is always eligible (unconditional tips), so a message is always returned.
 */
export function getMotivationMessage(ctx: MotivationContext): { text: string } {
  const eligible = MOTIVATION_MESSAGES.filter(m => m.condition(ctx))
  const seed = simpleHash(daySeed())
  const index = seed % eligible.length
  const chosen = eligible[index]
  return { text: chosen.getText(ctx) }
}
