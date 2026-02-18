import type { Entry } from '../entries'
import type { Badge } from '../types/stats'

const MS_PER_DAY = 24 * 60 * 60 * 1000

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
  const unitDisplay = nextThreshold === 1 && unitLabel.endsWith('s') ? unitLabel.slice(0, -1) : unitLabel
  const progressText = nextThreshold !== null
    ? `${Math.min(value, nextThreshold)}/${nextThreshold} ${unitDisplay}`
    : 'Max level'
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
    : (state.currentTierLabel ? `${state.currentTierLabel}.` : 'Max level reached.')
  const lockedUnit = thresholds[0] === 1 && unitLabel.endsWith('s') ? unitLabel.slice(0, -1) : unitLabel
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
    progressText: unlocked ? 'Max level' : '0/1',
    progressValue: unlocked ? 1 : 0,
    progressTotal: 1,
    currentTierIndex: unlocked ? 1 : 0,
    tierCount: 1,
  }
}

// --- Incremental badge 1: Logger beast ---
const LOGGER_THRESHOLDS = [1, 7, 30, 180, 365]
const LOGGER_LABELS = [
  '1 logged day',
  '7 logged days',
  '30 logged days',
  '180 logged days',
  '365 logged days',
]

export function getLoggerBadge(entries: Entry[]): Badge {
  const total = entries.length
  return buildTieredBadge(
    'logger-beast',
    'Logger beast',
    total,
    LOGGER_THRESHOLDS,
    LOGGER_LABELS,
    'days',
  )
}

// --- Incremental badge 2: Eight-Hour Elite (8+ hours per night) ---
const EIGHT_HOUR_THRESHOLDS = [1, 7, 14, 21, 30]
const EIGHT_HOUR_LABELS = [
  '8+ hours for 1 night',
  '8+ hours for 7 nights',
  '8+ hours for 14 nights',
  '8+ hours for 21 nights',
  '8+ hours for 30 nights',
]

export function getEightHourEliteBadge(entries: Entry[]): Badge {
  const count = entries.filter((e) => {
    const h = Number(e.sleep_hours)
    return Number.isFinite(h) && h >= 8
  }).length
  return buildTieredBadge(
    'eight-hour-elite',
    'Eight-Hour Elite',
    count,
    EIGHT_HOUR_THRESHOLDS,
    EIGHT_HOUR_LABELS,
    'nights',
  )
}

// --- Incremental badge 3: Events Explorer (unique/different daily events = distinct tags) ---
const EVENTS_EXPLORER_THRESHOLDS = [5, 10, 15, 20, 30]
const EVENTS_EXPLORER_LABELS = [
  'Add 5 different daily events',
  'Add 10 different daily events',
  'Add 15 different daily events',
  'Add 20 different daily events',
  'Add 30 different daily events',
]

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
    'Events Explorer',
    uniqueTags.size,
    EVENTS_EXPLORER_THRESHOLDS,
    EVENTS_EXPLORER_LABELS,
    'events',
  )
}

// --- Incremental badge 4: Events Master (total daily events count) ---
const EVENTS_MASTER_THRESHOLDS = [10, 25, 50, 100, 500]
const EVENTS_MASTER_LABELS = [
  'Add 10 daily events',
  'Add 25 daily events',
  'Add 50 daily events',
  'Add 100 daily events',
  'Add 500 daily events',
]

export function getEventsMasterBadge(entries: Entry[]): Badge {
  const total = entries.reduce((sum, e) => sum + (e.tags?.length ?? 0), 0)
  return buildTieredBadge(
    'events-master',
    'Events Master',
    total,
    EVENTS_MASTER_THRESHOLDS,
    EVENTS_MASTER_LABELS,
    'events',
  )
}

// --- Incremental badge 5: Peak Days (mood 5/5) ---
const PEAK_DAYS_THRESHOLDS = [1, 3, 7, 14, 30]
const PEAK_DAYS_LABELS = [
  '1 day with mood 5/5',
  '3 days with mood 5/5',
  '7 days with mood 5/5',
  '14 days with mood 5/5',
  '30 days with mood 5/5',
]

export function getPeakDaysBadge(entries: Entry[]): Badge {
  const count = entries.filter(e => typeof e.mood === 'number' && e.mood === 5).length
  return buildTieredBadge(
    'peak-days',
    'Peak Days',
    count,
    PEAK_DAYS_THRESHOLDS,
    PEAK_DAYS_LABELS,
    'days',
  )
}

// --- Incremental badge 6: Reflector (notes count) ---
const REFLECTOR_THRESHOLDS = [5, 10, 15, 20, 30]
const REFLECTOR_LABELS = [
  'Add a note 5 times',
  'Add a note 10 times',
  'Add a note 15 times',
  'Add a note 20 times',
  'Add a note 30 times',
]

export function getReflectorBadge(entries: Entry[]): Badge {
  const count = entries.filter(e => (e.note ?? '').trim().length > 0).length
  return buildTieredBadge(
    'reflector',
    'Reflector',
    count,
    REFLECTOR_THRESHOLDS,
    REFLECTOR_LABELS,
    'times',
  )
}

// --- Incremental badge 7: Mood Steady (consecutive days mood >= 3/5) ---
const MOOD_STEADY_THRESHOLDS = [2, 5, 10, 14, 21]
const MOOD_STEADY_LABELS = [
  '2 days in a row with mood ≥ 3/5',
  '5 days in a row with mood ≥ 3/5',
  '10 days in a row with mood ≥ 3/5',
  '14 days in a row with mood ≥ 3/5',
  '21 days in a row with mood ≥ 3/5',
]

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
    'Mood Steady',
    bestStreak,
    MOOD_STEADY_THRESHOLDS,
    MOOD_STEADY_LABELS,
    'days',
  )
  const currentStreak = getCurrentConsecutiveMoodSteady(entries)
  const state = getTierState(bestStreak, MOOD_STEADY_THRESHOLDS, MOOD_STEADY_LABELS, 'days')
  const nextThreshold = state.currentTierIndex + 1 < MOOD_STEADY_THRESHOLDS.length ? MOOD_STEADY_THRESHOLDS[state.currentTierIndex + 1] : null
  const progressTotal = nextThreshold ?? state.progressTotal
  const progressValue = Math.min(currentStreak, progressTotal)
  const unitDisplay = progressTotal === 1 ? 'day' : 'days'
  return {
    ...badge,
    progressValue: badge.unlocked ? progressValue : Math.min(currentStreak, MOOD_STEADY_THRESHOLDS[0]),
    progressTotal: badge.unlocked ? progressTotal : MOOD_STEADY_THRESHOLDS[0],
    progressText: badge.unlocked
      ? (nextThreshold !== null ? `${progressValue}/${progressTotal} ${unitDisplay}` : 'Max level')
      : `${Math.min(currentStreak, MOOD_STEADY_THRESHOLDS[0])}/${MOOD_STEADY_THRESHOLDS[0]} days`,
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
    'Balanced Week',
    'All 7 nights between 6–9 hours.',
    unlocked,
  )
}

// --- Non-incremental badge 2: Monthly Milestone (30 logged days in a month) ---
function hasMonthlyMilestone(entries: Entry[]): boolean {
  const byMonth = new Map<string, number>()
  entries.forEach((e) => {
    const month = e.entry_date.slice(0, 7)
    byMonth.set(month, (byMonth.get(month) ?? 0) + 1)
  })
  return [...byMonth.values()].some(c => c >= 30)
}

export function getMonthlyMilestoneBadge(entries: Entry[]): Badge {
  const unlocked = hasMonthlyMilestone(entries)
  return buildNonIncrementalBadge(
    'monthly-milestone',
    'Monthly Milestone',
    '30 logged days in a month.',
    unlocked,
  )
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
  for (const entry of sorted) {
    const mood = entry.mood as number
    const isGood = mood >= MOOD_GOOD
    const isConsecutive = prevDate !== null && daysBetween(parseEntryDate({ ...entry, entry_date: prevDate }), parseEntryDate(entry)) === 1
    if (isGood) {
      highRun = isConsecutive ? highRun + 1 : 1
      if (lowRun >= 2 && highRun >= 2) return true
      lowRun = 0
    }
    else {
      lowRun = isConsecutive ? lowRun + 1 : 1
      highRun = 0
    }
    prevDate = entry.entry_date
  }
  return false
}

export function getBounceBackBadge(entries: Entry[]): Badge {
  const unlocked = hasBounceBack(entries)
  return buildNonIncrementalBadge(
    'bounce-back',
    'Bounce Back',
    '2+ good-mood days in a row after 2+ low-mood days.',
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
