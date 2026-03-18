import { describe, expect, it } from 'vitest'
import type { Entry } from '../entries'
import { buildStats } from '../stats'
import { getCurrentCompleteStreak, getLongestCompleteStreak } from '../utils/streak'
import { getMonthlyMilestoneBadge, getTieredBadges } from '../utils/tieredBadges'

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
    expect(getCurrentCompleteStreak(entries, formatLocalDate)).toBe(30)
    expect(getLongestCompleteStreak(entries)).toBe(30)
  })

  it('longest stays 30 after streak breaks', () => {
    const thirty = Array.from({ length: 30 }, (_, i) =>
      makeEntry({
        id: `a-${i}`,
        entry_date: formatLocalDate(new Date(2026, 0, 1 + i)),
      }),
    )
    const afterGap = makeEntry({
      id: 'b',
      entry_date: formatLocalDate(new Date(2026, 1, 15)),
    })
    const entries = [...thirty, afterGap]
    expect(getLongestCompleteStreak(entries)).toBe(30)
    expect(getCurrentCompleteStreak(entries, formatLocalDate)).toBe(1)
  })

  it('incomplete-only day breaks current streak but not longest if past run existed', () => {
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
    expect(getCurrentCompleteStreak(entries, formatLocalDate)).toBe(1)
    expect(getLongestCompleteStreak(entries)).toBe(1)
  })
})

describe('monthly milestone badge (30-day streak)', () => {
  it('unlocks at 30 consecutive complete days', () => {
    const entries = Array.from({ length: 30 }, (_, i) =>
      makeEntry({
        id: `e-${i}`,
        entry_date: formatLocalDate(new Date(2026, 0, 1 + i)),
      }),
    )
    const current = getCurrentCompleteStreak(entries, formatLocalDate)
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
    const entries = Array.from({ length: 30 }, (_, i) =>
      makeEntry({
        id: `e-${i}`,
        entry_date: formatLocalDate(new Date(2026, 0, 1 + i)),
      }),
    )
    const stats = buildStats(entries, 7, formatLocalDate)
    const monthly = stats.sleepConsistencyBadges.find(b => b.id === 'monthly-milestone')
    expect(monthly?.unlocked).toBe(true)
    expect(stats.streak).toBe(30)
  })

  it('draft after 30 complete days: streak 30 and badge still unlocks', () => {
    const thirty = Array.from({ length: 30 }, (_, i) =>
      makeEntry({
        id: `c-${i}`,
        entry_date: formatLocalDate(new Date(2026, 0, 1 + i)),
      }),
    )
    const draftNext = makeEntry({
      id: 'draft',
      entry_date: formatLocalDate(new Date(2026, 0, 31)),
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
