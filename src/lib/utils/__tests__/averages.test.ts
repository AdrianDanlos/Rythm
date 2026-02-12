import { describe, expect, it } from 'vitest'
import type { Entry } from '../../entries'
import { calculateAverages } from '../averages'

const makeEntry = (overrides: Partial<Entry>): Entry => ({
  id: 'entry',
  user_id: 'user',
  entry_date: '2026-01-01',
  sleep_hours: 8,
  mood: 5,
  note: null,
  tags: null,
  is_complete: true,
  completed_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('calculateAverages', () => {
  it('returns null averages for empty input', () => {
    expect(calculateAverages([])).toEqual({ sleep: null, mood: null, count: 0 })
  })

  it('averages sleep and mood values', () => {
    const entries = [
      makeEntry({ sleep_hours: 7, mood: 4 }),
      makeEntry({ sleep_hours: 9, mood: 6 }),
    ]

    expect(calculateAverages(entries)).toEqual({ sleep: 8, mood: 5, count: 2 })
  })

  it('ignores missing fields per metric and counts complete entries only', () => {
    const entries = [
      makeEntry({ sleep_hours: 7, mood: 4 }),
      makeEntry({ sleep_hours: 9, mood: null, is_complete: false, completed_at: null }),
      makeEntry({ sleep_hours: null, mood: 2, is_complete: false, completed_at: null }),
    ]

    expect(calculateAverages(entries)).toEqual({ sleep: 8, mood: 3, count: 1 })
  })
})
