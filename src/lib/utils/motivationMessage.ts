import type { Entry } from '../entries'
import { t } from 'i18next'
import type { StatCounts } from '../stats'
import type { RollingSummary, WeekdayAveragePoint, WindowStats } from '../types/stats'

const WEEKDAY_FULL_LABEL_KEY: Record<string, string> = {
  Mon: 'insights.weekdayMonFull',
  Tue: 'insights.weekdayTueFull',
  Wed: 'insights.weekdayWedFull',
  Thu: 'insights.weekdayThuFull',
  Fri: 'insights.weekdayFriFull',
  Sat: 'insights.weekdaySatFull',
  Sun: 'insights.weekdaySunFull',
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

const MIN_TAG_MOOD_LIFT_ENTRIES = 5
const MIN_TAG_MOOD_LIFT_PERCENT = 5

function normalizeMotivationTag(raw: string): string {
  return raw.trim().toLowerCase()
}

function entryHasNormalizedTag(entry: Entry, normalizedTag: string): boolean {
  return (entry.tags ?? []).some(t => normalizeMotivationTag(t) === normalizedTag)
}

/** ≥5 days with tag; avg mood ≥5% higher than days without; strongest lift wins (tie → lexicographic). */
function bestQualifyingTagForMoodLift(ctx: MotivationContext): string | null {
  const withMood = ctx.entries.filter(
    e => e.mood != null && Number.isFinite(Number(e.mood)),
  )
  const tagSet = new Set<string>()
  for (const e of withMood) {
    for (const raw of e.tags ?? []) {
      const n = normalizeMotivationTag(raw)
      if (n) tagSet.add(n)
    }
  }

  let bestTag: string | null = null
  let bestPct = -Infinity

  for (const tag of tagSet) {
    const withTagMoods: number[] = []
    const withoutTagMoods: number[] = []
    for (const e of withMood) {
      const m = Number(e.mood)
      if (entryHasNormalizedTag(e, tag)) withTagMoods.push(m)
      else withoutTagMoods.push(m)
    }
    if (withTagMoods.length < MIN_TAG_MOOD_LIFT_ENTRIES) continue
    if (withoutTagMoods.length === 0) continue

    const avgWith = withTagMoods.reduce((a, b) => a + b, 0) / withTagMoods.length
    const avgWithout = withoutTagMoods.reduce((a, b) => a + b, 0) / withoutTagMoods.length
    if (avgWithout <= 0) continue

    const pct = ((avgWith - avgWithout) / avgWithout) * 100
    if (pct < MIN_TAG_MOOD_LIFT_PERCENT) continue

    if (
      pct > bestPct
      || (pct === bestPct && bestTag !== null && tag.localeCompare(bestTag) < 0)
    ) {
      bestTag = tag
      bestPct = pct
    }
  }

  return bestTag
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
    id: 'mood-higher-with-tag',
    condition: ctx => bestQualifyingTagForMoodLift(ctx) != null,
    getText: (ctx) => {
      const tag = bestQualifyingTagForMoodLift(ctx)!
      return t('motivation.moodHigherWithTag', { tag })
    },
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
      const dayLabelKey = best ? WEEKDAY_FULL_LABEL_KEY[best.label] : null
      const dayLabel = dayLabelKey ? t(dayLabelKey) : (best?.label ?? '')
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
