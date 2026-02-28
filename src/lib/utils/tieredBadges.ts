import type { Entry } from '../entries'
import type { Badge } from '../types/stats'
import i18n from '../../i18n'

const MS_PER_DAY = 24 * 60 * 60 * 1000
const t = (key: string, params?: Record<string, unknown>) => i18n.t(key, params)

const getUnitLabel = (unitKey: string, count: number) => {
  if (count === 1) {
    const singularMap: Record<string, string> = {
      days: 'day',
      nights: 'night',
      events: 'event',
      times: 'time',
    }
    return t(`badges.units.${singularMap[unitKey] ?? unitKey}`)
  }
  return t(`badges.units.${unitKey}`)
}

const parseEntryDate = (entry: Entry) => {
  const date = new Date(`${entry.entry_date}T00:00:00`)
  date.setHours(0, 0, 0, 0)
  return date
}

const daysBetween = (from: Date, to: Date) =>
  Math.round((to.getTime() - from.getTime()) / MS_PER_DAY)

function getTierState(
  value: number,
  thresholds: number[],
  tierLabels: string[],
  unitLabel: string,
) {
  const unlocked = value >= thresholds[0]
  const tiersReached = thresholds.filter(t => value >= t).length
  const currentTierIndex = unlocked
    ? Math.min(tiersReached - 1, thresholds.length - 1)
    : 0
  const nextThreshold = currentTierIndex + 1 < thresholds.length ? thresholds[currentTierIndex + 1] : null
  const currentTierLabel = currentTierIndex >= 0 ? tierLabels[currentTierIndex] : null
  const nextTierLabel = nextThreshold !== null ? tierLabels[currentTierIndex + 1] : null
  const progressValue = nextThreshold !== null ? Math.min(value, nextThreshold) : value
  const progressTotal = nextThreshold !== null ? nextThreshold : Math.max(value, 1)
  const unitDisplay = getUnitLabel(unitLabel, nextThreshold ?? value)
  const progressText = nextThreshold !== null
    ? `${Math.min(value, nextThreshold)}/${nextThreshold} ${unitDisplay}`
    : t('badges.maxLevel')
  return {
    currentTierIndex,
    currentTierLabel,
    nextThreshold,
    nextTierLabel,
    unlocked,
    progressValue,
    progressTotal,
    progressText: unlocked ? progressText : `${Math.min(value, thresholds[0])}/${thresholds[0]} ${unitLabel}`,
  }
}

function buildTieredBadge(
  id: string,
  badgeName: string,
  value: number,
  thresholds: number[],
  tierLabels: string[],
  unitLabel: string,
): Badge {
  const state = getTierState(value, thresholds, tierLabels, unitLabel)
  const title = badgeName
  const description = state.nextThreshold !== null
    ? `${state.nextTierLabel}.`
    : (state.currentTierLabel ? `${state.currentTierLabel}.` : t('badges.maxLevelReached'))
  const lockedUnit = getUnitLabel(unitLabel, thresholds[0])
  return {
    id,
    title,
    description,
    unlocked: state.unlocked,
    progressText: state.unlocked ? state.progressText : `${Math.min(value, thresholds[0])}/${thresholds[0]} ${lockedUnit}`,
    progressValue: state.unlocked ? state.progressValue : Math.min(value, thresholds[0]),
    progressTotal: state.unlocked ? state.progressTotal : thresholds[0],
    currentTierIndex: state.currentTierIndex,
    tierCount: thresholds.length,
  }
}

function buildNonIncrementalBadge(
  id: string,
  title: string,
  description: string,
  unlocked: boolean,
): Badge {
  return {
    id,
    title,
    description,
    unlocked,
    progressText: unlocked ? t('badges.maxLevel') : '0/1',
    progressValue: unlocked ? 1 : 0,
    progressTotal: 1,
    currentTierIndex: unlocked ? 1 : 0,
    tierCount: 1,
  }
}

// --- Incremental badge 1: Logger beast ---
const LOGGER_THRESHOLDS = [1, 7, 30, 180, 365]
const LOGGER_LABELS = () => ([
  t('badges.logger.tier1'),
  t('badges.logger.tier2'),
  t('badges.logger.tier3'),
  t('badges.logger.tier4'),
  t('badges.logger.tier5'),
])

export function getLoggerBadge(entries: Entry[]): Badge {
  const total = entries.length
  return buildTieredBadge(
    'logger-beast',
    t('badges.logger.title'),
    total,
    LOGGER_THRESHOLDS,
    LOGGER_LABELS(),
    'days',
  )
}

// --- Incremental badge 2: Eight-Hour Elite (8+ hours per night) ---
const EIGHT_HOUR_THRESHOLDS = [1, 7, 14, 21, 30]
const EIGHT_HOUR_LABELS = () => ([
  t('badges.eightHour.tier1'),
  t('badges.eightHour.tier2'),
  t('badges.eightHour.tier3'),
  t('badges.eightHour.tier4'),
  t('badges.eightHour.tier5'),
])

export function getEightHourEliteBadge(entries: Entry[]): Badge {
  const count = entries.filter((e) => {
    const h = Number(e.sleep_hours)
    return Number.isFinite(h) && h >= 8
  }).length
  return buildTieredBadge(
    'eight-hour-elite',
    t('badges.eightHour.title'),
    count,
    EIGHT_HOUR_THRESHOLDS,
    EIGHT_HOUR_LABELS(),
    'nights',
  )
}

// --- Incremental badge 3: Events Explorer (unique/different daily events = distinct tags) ---
const EVENTS_EXPLORER_THRESHOLDS = [5, 10, 15, 20, 30]
const EVENTS_EXPLORER_LABELS = () => ([
  t('badges.eventsExplorer.tier1'),
  t('badges.eventsExplorer.tier2'),
  t('badges.eventsExplorer.tier3'),
  t('badges.eventsExplorer.tier4'),
  t('badges.eventsExplorer.tier5'),
])

export function getEventsExplorerBadge(entries: Entry[]): Badge {
  const uniqueTags = new Set<string>()
  entries.forEach((e) => {
    (e.tags ?? []).forEach((t) => {
      const trimmed = t.trim().toLowerCase()
      if (trimmed) uniqueTags.add(trimmed)
    })
  })
  return buildTieredBadge(
    'events-explorer',
    t('badges.eventsExplorer.title'),
    uniqueTags.size,
    EVENTS_EXPLORER_THRESHOLDS,
    EVENTS_EXPLORER_LABELS(),
    'events',
  )
}

// --- Incremental badge 4: Events Master (total daily events count) ---
const EVENTS_MASTER_THRESHOLDS = [10, 25, 50, 100, 500]
const EVENTS_MASTER_LABELS = () => ([
  t('badges.eventsMaster.tier1'),
  t('badges.eventsMaster.tier2'),
  t('badges.eventsMaster.tier3'),
  t('badges.eventsMaster.tier4'),
  t('badges.eventsMaster.tier5'),
])

export function getEventsMasterBadge(entries: Entry[]): Badge {
  const total = entries.reduce((sum, e) => sum + (e.tags?.length ?? 0), 0)
  return buildTieredBadge(
    'events-master',
    t('badges.eventsMaster.title'),
    total,
    EVENTS_MASTER_THRESHOLDS,
    EVENTS_MASTER_LABELS(),
    'events',
  )
}

// --- Incremental badge 5: Peak Days (mood 5/5) ---
const PEAK_DAYS_THRESHOLDS = [1, 3, 7, 14, 30]
const PEAK_DAYS_LABELS = () => ([
  t('badges.peakDays.tier1'),
  t('badges.peakDays.tier2'),
  t('badges.peakDays.tier3'),
  t('badges.peakDays.tier4'),
  t('badges.peakDays.tier5'),
])

export function getPeakDaysBadge(entries: Entry[]): Badge {
  const count = entries.filter(e => typeof e.mood === 'number' && e.mood === 5).length
  return buildTieredBadge(
    'peak-days',
    t('badges.peakDays.title'),
    count,
    PEAK_DAYS_THRESHOLDS,
    PEAK_DAYS_LABELS(),
    'days',
  )
}

// --- Incremental badge 6: Reflector (notes count) ---
const REFLECTOR_THRESHOLDS = [5, 10, 15, 20, 30]
const REFLECTOR_LABELS = () => ([
  t('badges.reflector.tier1'),
  t('badges.reflector.tier2'),
  t('badges.reflector.tier3'),
  t('badges.reflector.tier4'),
  t('badges.reflector.tier5'),
])

export function getReflectorBadge(entries: Entry[]): Badge {
  const count = entries.filter(e => (e.note ?? '').trim().length > 0).length
  return buildTieredBadge(
    'reflector',
    t('badges.reflector.title'),
    count,
    REFLECTOR_THRESHOLDS,
    REFLECTOR_LABELS(),
    'times',
  )
}

// --- Incremental badge 7: Mood Steady (consecutive days mood >= 3/5) ---
const MOOD_STEADY_THRESHOLDS = [2, 5, 10, 14, 21]
const MOOD_STEADY_LABELS = () => ([
  t('badges.moodSteady.tier1'),
  t('badges.moodSteady.tier2'),
  t('badges.moodSteady.tier3'),
  t('badges.moodSteady.tier4'),
  t('badges.moodSteady.tier5'),
])

function getLongestConsecutiveMoodSteady(entries: Entry[]): number {
  if (!entries.length) return 0
  const sorted = [...entries].sort((a, b) => a.entry_date.localeCompare(b.entry_date))
  let best = 0
  let current = 0
  let prevDate: string | null = null
  for (const entry of sorted) {
    const mood = entry.mood
    const ok = typeof mood === 'number' && Number.isFinite(mood) && mood >= 3
    const isConsecutive = prevDate !== null && daysBetween(parseEntryDate({ ...entry, entry_date: prevDate }), parseEntryDate(entry)) === 1
    if (ok) {
      if (isConsecutive) {
        current += 1
      }
      else {
        current = 1
      }
      if (current > best) best = current
    }
    else {
      current = 0
    }
    prevDate = entry.entry_date
  }
  return best
}

/** Current streak (consecutive days with mood ≥ 3) ending at the most recent entry. Resets when streak is broken. */
function getCurrentConsecutiveMoodSteady(entries: Entry[]): number {
  if (!entries.length) return 0
  const sorted = [...entries].sort((a, b) => a.entry_date.localeCompare(b.entry_date))
  let count = 0
  let prevDate: string | null = null
  for (const entry of sorted) {
    const mood = entry.mood
    const ok = typeof mood === 'number' && Number.isFinite(mood) && mood >= 3
    const isConsecutive = prevDate !== null && daysBetween(parseEntryDate({ ...entry, entry_date: prevDate }), parseEntryDate(entry)) === 1
    if (ok) {
      count = isConsecutive ? count + 1 : 1
    }
    else {
      count = 0
    }
    prevDate = entry.entry_date
  }
  return count
}

export function getMoodSteadyBadge(entries: Entry[]): Badge {
  const bestStreak = getLongestConsecutiveMoodSteady(entries)
  const badge = buildTieredBadge(
    'mood-steady',
    t('badges.moodSteady.title'),
    bestStreak,
    MOOD_STEADY_THRESHOLDS,
    MOOD_STEADY_LABELS(),
    'days',
  )
  const currentStreak = getCurrentConsecutiveMoodSteady(entries)
  const state = getTierState(bestStreak, MOOD_STEADY_THRESHOLDS, MOOD_STEADY_LABELS(), 'days')
  const nextThreshold = state.currentTierIndex + 1 < MOOD_STEADY_THRESHOLDS.length ? MOOD_STEADY_THRESHOLDS[state.currentTierIndex + 1] : null
  const progressTotal = nextThreshold ?? state.progressTotal
  const progressValue = Math.min(currentStreak, progressTotal)
  const unitDisplay = getUnitLabel('days', progressTotal)
  return {
    ...badge,
    progressValue: badge.unlocked ? progressValue : Math.min(currentStreak, MOOD_STEADY_THRESHOLDS[0]),
    progressTotal: badge.unlocked ? progressTotal : MOOD_STEADY_THRESHOLDS[0],
    progressText: badge.unlocked
      ? (nextThreshold !== null ? `${progressValue}/${progressTotal} ${unitDisplay}` : t('badges.maxLevel'))
      : `${Math.min(currentStreak, MOOD_STEADY_THRESHOLDS[0])}/${MOOD_STEADY_THRESHOLDS[0]} ${getUnitLabel('days', MOOD_STEADY_THRESHOLDS[0])}`,
  }
}

// --- Non-incremental badge 1: Balanced Week (all 7 nights 6–9 hours) ---
function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function hasBalancedWeek(entries: Entry[]): boolean {
  const byDate = new Map<string, number>()
  entries.forEach((e) => {
    const h = Number(e.sleep_hours)
    if (Number.isFinite(h)) byDate.set(e.entry_date, h)
  })
  const dates = [...byDate.keys()].sort()
  for (const startKey of dates) {
    const start = parseEntryDate({ ...entries[0], entry_date: startKey })
    let allInRange = true
    for (let d = 0; d < 7; d += 1) {
      const next = new Date(start)
      next.setDate(start.getDate() + d)
      const key = formatDateKey(next)
      const sleep = byDate.get(key)
      if (sleep === undefined || sleep < 6 || sleep > 9) {
        allInRange = false
        break
      }
    }
    if (allInRange) return true
  }
  return false
}

export function getBalancedWeekBadge(entries: Entry[]): Badge {
  const unlocked = hasBalancedWeek(entries)
  return buildNonIncrementalBadge(
    'balanced-week',
    t('badges.balancedWeek.title'),
    t('badges.balancedWeek.description'),
    unlocked,
  )
}

// --- Non-incremental badge 2: Monthly Milestone (30 logged days in current month) ---
function getCurrentMonthKey(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function getMonthlyMilestoneBadge(entries: Entry[]): Badge {
  const currentMonthKey = getCurrentMonthKey()
  const count = entries.filter(e => e.entry_date.startsWith(currentMonthKey)).length
  const unlocked = count >= 30
  const progressValue = Math.min(count, 30)
  const progressTotal = 30
  const progressText = unlocked
    ? `30/30 ${getUnitLabel('days', 30)}`
    : `${count}/30 ${getUnitLabel('days', 30)}`
  return {
    id: 'monthly-milestone',
    title: t('badges.monthlyMilestone.title'),
    description: t('badges.monthlyMilestone.description'),
    unlocked,
    progressText,
    progressValue,
    progressTotal,
    currentTierIndex: unlocked ? 1 : 0,
    tierCount: 1,
  }
}

// --- Non-incremental badge 3: Bounce Back (2+ good-mood days after 2+ low-mood days) ---
const MOOD_GOOD = 3

function hasBounceBack(entries: Entry[]): boolean {
  const sorted = [...entries]
    .filter(e => typeof e.mood === 'number' && Number.isFinite(e.mood))
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date))
  if (sorted.length < 4) return false
  let lowRun = 0
  let highRun = 0
  let prevDate: string | null = null
  let prevWasLow = false
  for (const entry of sorted) {
    const mood = entry.mood as number
    const isGood = mood >= MOOD_GOOD
    const isConsecutive = prevDate !== null && daysBetween(parseEntryDate({ ...entry, entry_date: prevDate }), parseEntryDate(entry)) === 1
    if (isGood) {
      highRun = isConsecutive ? highRun + 1 : 1
      if (lowRun >= 2 && highRun >= 2) return true
      // do not reset lowRun here: we need it to still be >= 2 when highRun reaches 2
    }
    else {
      // only extend low run when the previous day was also low (consecutive low days)
      lowRun = isConsecutive && prevWasLow ? lowRun + 1 : 1
      highRun = 0
    }
    prevDate = entry.entry_date
    prevWasLow = !isGood
  }
  return false
}

export function getBounceBackBadge(entries: Entry[]): Badge {
  const unlocked = hasBounceBack(entries)
  return buildNonIncrementalBadge(
    'bounce-back',
    t('badges.bounceBack.title'),
    t('badges.bounceBack.description'),
    unlocked,
  )
}

export function getTieredBadges(entries: Entry[]): Badge[] {
  return [
    getLoggerBadge(entries),
    getEightHourEliteBadge(entries),
    getEventsExplorerBadge(entries),
    getEventsMasterBadge(entries),
    getPeakDaysBadge(entries),
    getReflectorBadge(entries),
    getMoodSteadyBadge(entries),
    getBalancedWeekBadge(entries),
    getMonthlyMilestoneBadge(entries),
    getBounceBackBadge(entries),
  ]
}
