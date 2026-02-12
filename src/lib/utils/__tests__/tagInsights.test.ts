import { describe, expect, it } from 'vitest'
import type { Entry } from '../../entries'
import { buildTagDrivers, buildTagInsights, buildTagSleepDrivers } from '../tagInsights'

const makeEntry = (overrides: Partial<Entry>): Entry => ({
  id: 'entry',
  user_id: 'user',
  entry_date: '2026-01-01',
  sleep_hours: 8,
  mood: 6,
  note: null,
  tags: null,
  is_complete: true,
  completed_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('buildTagInsights', () => {
  it('returns empty array when no entries', () => {
    expect(buildTagInsights([])).toEqual([])
  })

  it('aggregates averages per tag and trims values', () => {
    const entries = [
      makeEntry({ sleep_hours: 7, mood: 4, tags: [' focus ', 'rest'] }),
      makeEntry({ sleep_hours: 9, mood: 6, tags: ['focus', ''] }),
    ]

    const insights = buildTagInsights(entries)
    expect(insights).toEqual([
      { tag: 'focus', sleep: 8, mood: 5, count: 2 },
      { tag: 'rest', sleep: 7, mood: 4, count: 1 },
    ])
  })

  it('respects the limit argument', () => {
    const entries = [
      makeEntry({ tags: ['one'] }),
      makeEntry({ tags: ['two'] }),
    ]

    expect(buildTagInsights(entries, 1)).toHaveLength(1)
  })

  it('handles missing mood or sleep without NaN', () => {
    const entries = [
      makeEntry({ sleep_hours: 7, mood: null, tags: ['focus'], is_complete: false, completed_at: null }),
      makeEntry({ sleep_hours: null, mood: 4, tags: ['focus'], is_complete: false, completed_at: null }),
    ]

    expect(buildTagInsights(entries)).toEqual([
      { tag: 'focus', sleep: 7, mood: 4, count: 2 },
    ])
  })
})

describe('buildTagDrivers', () => {
  it('computes mood deltas per tag with minimum count', () => {
    const entries = [
      makeEntry({ mood: 8, tags: ['coffee', 'focus', 'focus'] }),
      makeEntry({ mood: 4, tags: ['coffee'] }),
      makeEntry({ mood: 9, tags: ['focus'] }),
      makeEntry({ mood: 5, tags: ['rest'] }),
    ]

    const drivers = buildTagDrivers(entries, 2)
    expect(drivers).toEqual([
      {
        tag: 'focus',
        count: 2,
        moodWith: 8.5,
        moodWithout: 4.5,
        delta: 4,
      },
      {
        tag: 'coffee',
        count: 2,
        moodWith: 6,
        moodWithout: 7,
        delta: -1,
      },
    ])
  })

  it('filters out tags that do not meet the minimum count', () => {
    const entries = [
      makeEntry({ mood: 8, tags: ['solo'] }),
      makeEntry({ mood: 6, tags: ['other'] }),
    ]

    expect(buildTagDrivers(entries, 2)).toEqual([])
  })

  it('ignores entries without mood for mood drivers', () => {
    const entries = [
      makeEntry({ mood: null, tags: ['coffee'], is_complete: false, completed_at: null }),
      makeEntry({ mood: 5, tags: ['coffee'] }),
      makeEntry({ mood: 4, tags: ['rest'] }),
    ]

    expect(buildTagDrivers(entries, 1)).toEqual([
      {
        tag: 'coffee',
        count: 1,
        moodWith: 5,
        moodWithout: 4,
        delta: 1,
      },
      {
        tag: 'rest',
        count: 1,
        moodWith: 4,
        moodWithout: 5,
        delta: -1,
      },
    ])
  })
})

describe('buildTagSleepDrivers', () => {
  it('ignores entries without sleep for sleep drivers', () => {
    const entries = [
      makeEntry({ entry_date: '2026-01-01', tags: ['caffeine'] }),
      makeEntry({ entry_date: '2026-01-02', sleep_hours: 6 }),
      makeEntry({ entry_date: '2026-01-03', sleep_hours: null, is_complete: false, completed_at: null }),
      makeEntry({ entry_date: '2026-01-04', sleep_hours: 8, tags: ['walk'] }),
      makeEntry({ entry_date: '2026-01-05', sleep_hours: 9 }),
    ]

    expect(buildTagSleepDrivers(entries, 1)).toEqual([
      {
        tag: 'walk',
        count: 1,
        sleepWith: 9,
        sleepWithout: 6,
        delta: 3,
      },
      {
        tag: 'caffeine',
        count: 1,
        sleepWith: 6,
        sleepWithout: 9,
        delta: -3,
      },
    ])
  })
})
