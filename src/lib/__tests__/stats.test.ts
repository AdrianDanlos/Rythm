import { describe, expect, it } from 'vitest'
import type { Entry } from '../entries'
import type { TrendPoint } from '../types/stats'
import { buildStats, buildWeeklyTrendSeries } from '../stats'

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

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

describe('buildWeeklyTrendSeries', () => {
  it('averages numeric values per 7-day bucket', () => {
    const points: TrendPoint[] = [
      { date: '2026-01-01', sleep: 6, mood: 4 },
      { date: '2026-01-02', sleep: 7, mood: 5 },
      { date: '2026-01-03', sleep: 8, mood: null },
      { date: '2026-01-04', sleep: null, mood: 6 },
      { date: '2026-01-05', sleep: 9, mood: 7 },
      { date: '2026-01-06', sleep: 7, mood: 5 },
      { date: '2026-01-07', sleep: 8, mood: 6 },
      { date: '2026-01-08', sleep: 5, mood: 3 },
    ]

    const weekly = buildWeeklyTrendSeries(points)

    expect(weekly).toEqual([
      {
        date: '2026-01-01',
        sleep: 7.5,
        mood: 5.5,
      },
      {
        date: '2026-01-08',
        sleep: 5,
        mood: 3,
      },
    ])
  })
})

describe('buildStats', () => {
  it('counts streak with complete entries only', () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const twoDaysAgo = new Date(today)
    twoDaysAgo.setDate(today.getDate() - 2)

    const entries = [
      makeEntry({ id: 'a', entry_date: formatLocalDate(twoDaysAgo), is_complete: true }),
      makeEntry({ id: 'b', entry_date: formatLocalDate(yesterday), is_complete: false, mood: null, completed_at: null }),
      makeEntry({ id: 'c', entry_date: formatLocalDate(today), is_complete: true }),
    ]

    const stats = buildStats(entries, 7, formatLocalDate)
    expect(stats.streak).toBe(1)
  })

  it('ignores incomplete rows in mood-by-sleep stats', () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const entries = Array.from({ length: 5 }, (_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() - index)
      return makeEntry({
        id: `entry-${index}`,
        entry_date: formatLocalDate(date),
        sleep_hours: index < 3 ? 8 : 6,
        mood: index < 3 ? 5 : 2,
      })
    })
    entries.push(
      makeEntry({
        id: 'draft',
        entry_date: formatLocalDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)),
        sleep_hours: 10,
        mood: null,
        is_complete: false,
        completed_at: null,
      }),
    )

    const stats = buildStats(entries, 7, formatLocalDate)
    expect(stats.moodBySleepThreshold).toEqual({
      high: 5,
      low: 2,
    })
  })
})
