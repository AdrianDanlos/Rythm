import { describe, expect, it } from 'vitest'
import type { Entry } from '../entries'
import { buildStats } from '../stats'
import { getCurrentCompleteStreak, getLongestCompleteStreak } from '../utils/streak'
import {
  getMonthlyMilestoneBadge,
  getTieredBadges,
  visibleBadgesForInsightsEntryCount,
} from '../utils/tieredBadges'

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const makeEntry = (overrides: Partial<Entry>): Entry => ({
  id: 'entry',
  user_id: 'user',
  entry_date: '2026-01-01',
  sleep_hours: 8,
  mood: 4,
  note: null,
  tags: null,
  is_complete: true,
  completed_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('getCurrentCompleteStreak / getLongestCompleteStreak', () => {
  it('returns 30 for 30 consecutive complete days', () => {
    const entries = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(2026, 0, 1 + i)
      return makeEntry({
        id: `e-${i}`,
        entry_date: formatLocalDate(d),
      })
    })
    const endOfRun = new Date(2026, 0, 30)
    expect(getCurrentCompleteStreak(entries, formatLocalDate, { today: endOfRun })).toBe(30)
    expect(getLongestCompleteStreak(entries)).toBe(30)
  })

  it('longest stays 30 after streak breaks', () => {
    const thirty = Array.from({ length: 30 }, (_, i) =>
      makeEntry({
        id: `a-${i}`,
        entry_date: formatLocalDate(new Date(2026, 0, 1 + i)),
      }),
    )
    const afterGapDate = new Date(2026, 1, 15)
    const afterGap = makeEntry({
      id: 'b',
      entry_date: formatLocalDate(afterGapDate),
    })
    const entries = [...thirty, afterGap]
    expect(getLongestCompleteStreak(entries)).toBe(30)
    expect(getCurrentCompleteStreak(entries, formatLocalDate, { today: afterGapDate })).toBe(1)
  })

  it('partial day (entry row, not complete) does not break the streak; only a blank day does', () => {
    const entries = [
      makeEntry({ id: '1', entry_date: '2026-01-01' }),
      makeEntry({
        id: '2',
        entry_date: '2026-01-02',
        is_complete: false,
        mood: null,
        completed_at: null,
      }),
      makeEntry({ id: '3', entry_date: '2026-01-03' }),
    ]
    expect(getCurrentCompleteStreak(entries, formatLocalDate, { today: new Date(2026, 0, 3) })).toBe(2)
    expect(getLongestCompleteStreak(entries)).toBe(2)
  })

  it('returns 0 when the latest completed entry is in the distant past', () => {
    const entries = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2026, 2, 1 + i)
      return makeEntry({
        id: `m-${i}`,
        entry_date: formatLocalDate(d),
      })
    })
    expect(getCurrentCompleteStreak(entries, formatLocalDate, { today: new Date(2026, 3, 24) })).toBe(0)
  })
})

describe('monthly milestone badge (30-day streak)', () => {
  it('unlocks at 30 consecutive complete days', () => {
    const endOfRun = new Date(2026, 0, 30)
    const entries = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(2026, 0, 1 + i)
      return makeEntry({
        id: `e-${i}`,
        entry_date: formatLocalDate(d),
      })
    })
    const current = getCurrentCompleteStreak(entries, formatLocalDate, { today: endOfRun })
    const longest = getLongestCompleteStreak(entries)
    const badge = getMonthlyMilestoneBadge(current, longest)
    expect(badge.unlocked).toBe(true)
    expect(badge.progressValue).toBe(30)
    expect(badge.id).toBe('monthly-milestone')
  })

  it('shows 29/30 when longest run is 29', () => {
    const badge = getMonthlyMilestoneBadge(29, 29)
    expect(badge.unlocked).toBe(false)
    expect(badge.progressValue).toBe(29)
  })

  it('stays unlocked when current streak drops but longest was 30', () => {
    const badge = getMonthlyMilestoneBadge(3, 30)
    expect(badge.unlocked).toBe(true)
    expect(badge.progressValue).toBe(30)
  })

  it('buildStats exposes unlocked monthly badge for 30-day run', () => {
    const end = new Date()
    end.setHours(0, 0, 0, 0)
    const start = new Date(end)
    start.setDate(end.getDate() - 29)
    const entries = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return makeEntry({
        id: `e-${i}`,
        entry_date: formatLocalDate(d),
      })
    })
    const stats = buildStats(entries, 7, formatLocalDate)
    const monthly = stats.sleepConsistencyBadges.find(b => b.id === 'monthly-milestone')
    expect(monthly?.unlocked).toBe(true)
    expect(stats.streak).toBe(30)
  })

  it('draft after 30 complete days: streak 30 and badge still unlocks', () => {
    const end = new Date()
    end.setHours(0, 0, 0, 0)
    const start = new Date(end)
    start.setDate(end.getDate() - 29)
    const thirty = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return makeEntry({
        id: `c-${i}`,
        entry_date: formatLocalDate(d),
      })
    })
    const tomorrow = new Date(end)
    tomorrow.setDate(end.getDate() + 1)
    const draftNext = makeEntry({
      id: 'draft',
      entry_date: formatLocalDate(tomorrow),
      is_complete: false,
      mood: null,
      completed_at: null,
    })
    const entries = [...thirty, draftNext]
    const stats = buildStats(entries, 7, formatLocalDate)
    expect(stats.streak).toBe(30)
    const monthly = stats.sleepConsistencyBadges.find(b => b.id === 'monthly-milestone')
    expect(monthly?.unlocked).toBe(true)
  })

  it('getTieredBadges passes streak into monthly milestone', () => {
    const badges = getTieredBadges([], 30, 30)
    const monthly = badges.find(b => b.id === 'monthly-milestone')
    expect(monthly?.unlocked).toBe(true)
  })
})

describe('visibleBadgesForInsightsEntryCount', () => {
  const twoDayEntries = [
    makeEntry({ id: 'a', entry_date: '2026-01-01' }),
    makeEntry({ id: 'b', entry_date: '2026-01-02' }),
  ]
  const badges = getTieredBadges(twoDayEntries, 2, 2)

  it('shows only four starter badges below five logged days', () => {
    const visible = visibleBadgesForInsightsEntryCount(badges, 2)
    expect(visible.map(b => b.id)).toEqual([
      'mood-steady',
      'logger-beast',
      'eight-hour-elite',
      'monthly-milestone',
    ])
  })

  it('shows full list from five logged days onward', () => {
    const visible = visibleBadgesForInsightsEntryCount(badges, 5)
    expect(visible).toHaveLength(badges.length)
    expect(visible.map(b => b.id)).toEqual(badges.map(b => b.id))
  })
})
