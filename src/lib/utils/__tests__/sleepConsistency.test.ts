import { describe, expect, it } from 'vitest'
import type { Entry } from '../../entries'
import { getSleepConsistencyLabel } from '../sleepConsistency'

const makeEntry = (sleep: number | null, mood: number | null = 4): Entry => ({
  id: `entry-${sleep}-${mood}`,
  user_id: 'user',
  entry_date: '2026-01-01',
  sleep_hours: sleep,
  mood,
  note: null,
  tags: null,
  is_complete: sleep !== null && mood !== null,
  completed_at: sleep !== null && mood !== null ? '2026-01-01T00:00:00Z' : null,
  created_at: '2026-01-01T00:00:00Z',
})

describe('getSleepConsistencyLabel', () => {
  it('returns null when there are fewer than two sleep entries', () => {
    expect(getSleepConsistencyLabel([])).toBeNull()
    expect(getSleepConsistencyLabel([makeEntry(8)])).toBeNull()
  })

  it('labels tight sleep distributions as veryConsistent', () => {
    const entries = [
      makeEntry(8),
      makeEntry(8),
      makeEntry(8.2),
      makeEntry(7.8),
    ]
    expect(getSleepConsistencyLabel(entries)).toBe('veryConsistent')
  })

  it('ignores entries with null sleep instead of treating them as zero hours', () => {
    const baseline = [
      makeEntry(8),
      makeEntry(8),
      makeEntry(8.2),
      makeEntry(7.8),
    ]
    const withNullSleep = [
      ...baseline,
      makeEntry(null, 5),
      makeEntry(null, 3),
    ]
    expect(getSleepConsistencyLabel(withNullSleep)).toBe(
      getSleepConsistencyLabel(baseline),
    )
  })
})
