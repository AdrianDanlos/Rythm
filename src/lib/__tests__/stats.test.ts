import { describe, expect, it } from 'vitest'
import type { TrendPoint } from '../types/stats'
import { buildWeeklyTrendSeries } from '../stats'

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
