import type { Entry } from '../entries'
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
    getText: () =>
      'You\'re building a real habit. Every day you log is a vote for yourself.',
  },
  {
    id: 'sleep-improving',
    condition: (ctx) => {
      const summary7 = ctx.rollingSummaries.find(s => s.days === 7)
      return summary7 != null && summary7.sleepDelta != null && summary7.sleepDelta > 0
    },
    getText: () =>
      'Your sleep is heading in the right direction. Small changes add up.',
  },
  {
    id: 'mood-trend-up',
    condition: (ctx) => {
      const summary7 = ctx.rollingSummaries.find(s => s.days === 7)
      return summary7 != null && summary7.moodDelta != null && summary7.moodDelta > 0
    },
    getText: () =>
      'Your mood trend is climbing. You\'re doing something right.',
  },
  {
    id: 'mood-better-when-sleep-better',
    condition: ctx =>
      ctx.moodBySleepDeltaPercent != null && ctx.moodBySleepDeltaPercent >= 10,
    getText: () =>
      'When you sleep well, your mood tends to rise. You\'re not imagining it; your data shows it.',
  },
  {
    id: 'more-sleep-lately',
    condition: (ctx) => {
      const { last7, last30 } = ctx.windowAverages
      return (
        last7.sleep != null
        && last30.sleep != null
        && last7.sleep > last30.sleep
      )
    },
    getText: () =>
      'You\'ve been giving rest more priority. Your future self will thank you.',
  },
  {
    id: 'new-first-week',
    condition: ctx => ctx.statCounts.completeEntries <= 7,
    getText: () =>
      'You\'ve started. That\'s often the hardest part. You\'re already ahead.',
  },
  {
    id: 'coming-back-after-gap',
    condition: ctx =>
      ctx.streak === 1 && ctx.statCounts.completeEntries > 7,
    getText: () =>
      'You\'re back. That matters more than the gap. Today counts.',
  },
  {
    id: 'steady-mood-despite-ups-and-downs',
    condition: ctx =>
      ctx.statCounts.completeEntries >= 14 && ctx.correlationLabel != null,
    getText: () =>
      'You\'re tracking through the ups and downs. That\'s how you learn what actually helps.',
  },
  {
    id: 'sleep-consistency-improving',
    condition: ctx =>
      ctx.rhythmScore != null && ctx.rhythmScore >= 70,
    getText: () =>
      'Your sleep is becoming more predictable. Consistency is a superpower.',
  },
  {
    id: 'unlocked-several-stats',
    condition: (ctx) => {
      const n = ctx.statCounts.completeEntries
      return !ctx.hasMissingStats && n >= 3 && n <= 5
    },
    getText: () =>
      'You\'re starting to see the full picture. Keep going and it gets even clearer.',
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
      return `You tend to sleep better on ${dayLabel}. Knowing your pattern is half the battle.`
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
    getText: () =>
      'You\'re still logging on the hard days. That\'s what makes the good days show up in your data.',
  },
  {
    id: 'long-term-tracker',
    condition: ctx => ctx.statCounts.completeEntries >= 60,
    getText: () =>
      'You\'ve put in the time. Your data is starting to repay you.',
  },
  {
    id: 'tip-anchor-wake',
    condition: () => true,
    getText: () =>
      'Waking up around the same time most days, even on weekends, helps your body clock so you sleep better and feel more alert.',
  },
  {
    id: 'tip-morning-light',
    condition: () => true,
    getText: () =>
      'Getting some daylight in the first hour after you wake helps you stay focused during the day and fall asleep easier at night.',
  },
  {
    id: 'tip-move-often',
    condition: () => true,
    getText: () =>
      'Moving regularly, even short walks, can lift your mood and help you handle stress better.',
  },
  {
    id: 'tip-wind-down',
    condition: () => true,
    getText: () =>
      'Dimming screens and taking it easy in the last hour before bed helps your brain wind down so you fall asleep faster and sleep better.',
  },
  {
    id: 'tip-connection',
    condition: () => true,
    getText: () =>
      'Even short, real moments with others can boost how you feel and support your health over time.',
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
