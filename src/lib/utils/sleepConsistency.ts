import type { Entry } from '../entries'
import type { SleepConsistencyBadge } from '../types/stats'

const MS_PER_DAY = 24 * 60 * 60 * 1000

const parseEntryDate = (entry: Entry) => {
  const date = new Date(`${entry.entry_date}T00:00:00`)
  date.setHours(0, 0, 0, 0)
  return date
}

const daysBetween = (from: Date, to: Date) =>
  Math.round((to.getTime() - from.getTime()) / MS_PER_DAY)

const getSleepConsistencyStdDev = (entries: Entry[]) => {
  if (entries.length < 2) return null
  const mean
    = entries.reduce((sum, entry) => sum + Number(entry.sleep_hours), 0)
      / entries.length
  const variance
    = entries.reduce((sum, entry) => {
      const diff = Number(entry.sleep_hours) - mean
      return sum + diff * diff
    }, 0) / entries.length
  return Math.sqrt(variance)
}

export const getSleepConsistencyLabel = (entries: Entry[]) => {
  const sleepConsistency = getSleepConsistencyStdDev(entries)
  if (sleepConsistency === null) return null
  if (sleepConsistency <= 0.9) return 'Very consistent'
  if (sleepConsistency <= 2.0) return 'Consistent'
  if (sleepConsistency <= 3.5) return 'Mixed'
  return 'Unstable'
}

export const getSleepConsistencyBadges = (
  entries: Entry[],
): SleepConsistencyBadge[] => {
  if (!entries.length) return []
  const sorted = [...entries].sort((a, b) =>
    a.entry_date.localeCompare(b.entry_date),
  )

  const badges: SleepConsistencyBadge[] = []
  const totalNights = sorted.length
  const countAtLeast = (hours: number) =>
    sorted.filter(entry => Number(entry.sleep_hours) >= hours).length
  const addBadge = (
    id: string,
    title: string,
    description: string,
    unlocked: boolean,
    progressText: string | null,
    progressValue: number,
    progressTotal: number,
  ) => {
    badges.push({
      id,
      title,
      description,
      unlocked,
      progressText: unlocked ? null : progressText,
      progressValue,
      progressTotal,
    })
  }

  const monthlyCounts = new Map<string, number>()
  sorted.forEach((entry) => {
    const monthKey = entry.entry_date.slice(0, 7)
    monthlyCounts.set(monthKey, (monthlyCounts.get(monthKey) ?? 0) + 1)
  })
  const maxMonthlyCount = Math.max(0, ...monthlyCounts.values())

  let currentStreak = 1
  let maxStreak = 1
  let hasThreeDay = false
  let hasSevenDay = false
  let hasBalancedWeek = false
  const consecutiveWindow: Entry[] = []
  let balancedRun = 0
  let maxBalancedRun = 0

  for (let i = 0; i < sorted.length; i += 1) {
    const entry = sorted[i]
    const hours = Number(entry.sleep_hours)
    if (i === 0) {
      consecutiveWindow.push(entry)
      balancedRun = hours >= 6 && hours <= 9 ? 1 : 0
      maxBalancedRun = balancedRun
      continue
    }

    const prev = sorted[i - 1]
    const gap = daysBetween(parseEntryDate(prev), parseEntryDate(entry))
    if (gap === 1) {
      currentStreak += 1
      consecutiveWindow.push(entry)
      if (hours >= 6 && hours <= 9) {
        balancedRun += 1
      }
      else {
        balancedRun = 0
      }
    }
    else {
      currentStreak = 1
      consecutiveWindow.length = 0
      consecutiveWindow.push(entry)
      balancedRun = hours >= 6 && hours <= 9 ? 1 : 0
    }
    if (currentStreak > maxStreak) maxStreak = currentStreak
    if (balancedRun > maxBalancedRun) maxBalancedRun = balancedRun

    if (currentStreak >= 3) hasThreeDay = true
    if (currentStreak >= 7) hasSevenDay = true
    if (consecutiveWindow.length > 7) consecutiveWindow.shift()
    if (consecutiveWindow.length === 7) {
      const balanced = consecutiveWindow.every((windowEntry) => {
        const hours = Number(windowEntry.sleep_hours)
        return hours >= 6 && hours <= 9
      })
      if (balanced) hasBalancedWeek = true
    }
  }

  let maxSevenTotal = 0
  for (let i = 0; i <= sorted.length - 7; i += 1) {
    const window = sorted.slice(i, i + 7)
    const total = window.reduce((sum, entry) => sum + Number(entry.sleep_hours), 0)
    if (total > maxSevenTotal) maxSevenTotal = total
  }

  const sevenHourCount = countAtLeast(7)
  addBadge(
    'seven-hour-standard',
    'Seven-Hour Standard',
    '7+ hours for 5 nights.',
    sevenHourCount >= 5,
    `${Math.min(sevenHourCount, 5)}/5 nights`,
    Math.min(sevenHourCount, 5),
    5,
  )
  const eightHourCount = countAtLeast(8)
  addBadge(
    'eight-hour-elite',
    'Eight-Hour Elite',
    '8+ hours for 3 nights.',
    eightHourCount >= 3,
    `${Math.min(eightHourCount, 3)}/3 nights`,
    Math.min(eightHourCount, 3),
    3,
  )
  const nineHourCount = countAtLeast(9)
  addBadge(
    'sleep-marathon',
    'Sleep Marathon',
    'Logged 9+ hours once.',
    nineHourCount >= 1,
    `${Math.min(nineHourCount, 1)}/1 nights`,
    Math.min(nineHourCount, 1),
    1,
  )
  addBadge(
    'three-day-streak',
    'Three-Day Streak',
    'Logged 3 days in a row.',
    hasThreeDay,
    `${Math.min(maxStreak, 3)}/3 days`,
    Math.min(maxStreak, 3),
    3,
  )
  addBadge(
    'consistent-week',
    'Consistent Week',
    'Logged 7 days in a row.',
    hasSevenDay,
    `${Math.min(maxStreak, 7)}/7 days`,
    Math.min(maxStreak, 7),
    7,
  )
  addBadge(
    'balanced-week',
    'Balanced Week',
    'All 7 nights between 6–9 hours.',
    hasBalancedWeek,
    `${Math.min(maxBalancedRun, 7)}/7 nights in range`,
    Math.min(maxBalancedRun, 7),
    7,
  )
  addBadge(
    'monthly-milestone',
    'Monthly Milestone',
    '30 logged nights in a month.',
    maxMonthlyCount >= 30,
    `${Math.min(maxMonthlyCount, 30)}/30 nights`,
    Math.min(maxMonthlyCount, 30),
    30,
  )
  addBadge(
    'century-club',
    'Century Club',
    '100 total logged nights.',
    totalNights >= 100,
    `${Math.min(totalNights, 100)}/100 nights`,
    Math.min(totalNights, 100),
    100,
  )
  addBadge(
    'half-year-habit',
    'Half-Year Habit',
    '180 total logged nights.',
    totalNights >= 180,
    `${Math.min(totalNights, 180)}/180 nights`,
    Math.min(totalNights, 180),
    180,
  )
  addBadge(
    'rest-reward',
    'Rest Reward',
    '50+ hours in 7 nights.',
    maxSevenTotal >= 50,
    `${maxSevenTotal.toFixed(1)}h / 50h`,
    Math.min(maxSevenTotal, 50),
    50,
  )

  return badges.sort((a, b) => {
    const aProgress = (a.progressValue ?? 0) / (a.progressTotal || 1)
    const bProgress = (b.progressValue ?? 0) / (b.progressTotal || 1)
    if (bProgress !== aProgress) return bProgress - aProgress
    if (a.unlocked !== b.unlocked) return Number(b.unlocked) - Number(a.unlocked)
    return a.title.localeCompare(b.title)
  })
}
