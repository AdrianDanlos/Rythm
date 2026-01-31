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
})
