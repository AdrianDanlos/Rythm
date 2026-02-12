import { describe, expect, it } from 'vitest'
import type { Entry } from '../../entries'
import { getCorrelationInsight } from '../correlation'

const makeEntry = (sleep: number | null, mood: number | null): Entry => ({
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

describe('getCorrelationInsight', () => {
  it('returns nulls when there are not enough entries', () => {
    expect(getCorrelationInsight([])).toEqual({ label: null, direction: null })
    expect(getCorrelationInsight([makeEntry(7, 5)])).toEqual({
      label: null,
      direction: null,
    })
  })

  it('returns nulls when variance is zero', () => {
    const entries = [
      makeEntry(8, 5),
      makeEntry(8, 5),
      makeEntry(8, 5),
    ]
    expect(getCorrelationInsight(entries)).toEqual({ label: null, direction: null })
  })

  it('detects a strong positive correlation', () => {
    const entries = [
      makeEntry(6, 3),
      makeEntry(7, 4),
      makeEntry(8, 5),
      makeEntry(9, 6),
    ]
    expect(getCorrelationInsight(entries)).toEqual({
      label: 'Strong',
      direction: 'Higher sleep, better mood',
    })
  })

  it('detects a strong negative correlation', () => {
    const entries = [
      makeEntry(6, 7),
      makeEntry(7, 6),
      makeEntry(8, 5),
      makeEntry(9, 4),
    ]
    expect(getCorrelationInsight(entries)).toEqual({
      label: 'Strong',
      direction: 'Higher sleep, lower mood',
    })
  })

  it('ignores incomplete rows when computing correlation', () => {
    const entries = [
      makeEntry(6, 3),
      makeEntry(7, 4),
      makeEntry(8, null),
      makeEntry(null, 5),
      makeEntry(9, 6),
    ]
    expect(getCorrelationInsight(entries)).toEqual({
      label: 'Strong',
      direction: 'Higher sleep, better mood',
    })
  })
})
