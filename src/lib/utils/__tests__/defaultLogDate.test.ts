import { describe, expect, it } from 'vitest'
import type { Entry } from '../../entries'
import { DEFAULT_LOG_SLEEP_HOURS } from '../sleepHours'
import { getDefaultLogDate } from '../defaultLogDate'

const baseEntry = (overrides: Partial<Entry>): Entry => ({
  id: 'id',
  user_id: 'u',
  entry_date: '2026-03-30',
  sleep_hours: DEFAULT_LOG_SLEEP_HOURS,
  mood: null,
  note: null,
  tags: null,
  is_complete: false,
  completed_at: null,
  created_at: '2026-03-30T00:00:00.000Z',
  ...overrides,
})

describe('getDefaultLogDate', () => {
  const today = '2026-03-31'
  const yesterday = '2026-03-30'

  it('returns today when there is no yesterday row', () => {
    expect(getDefaultLogDate(today, yesterday, [])).toBe(today)
  })

  it('returns today when yesterday is complete', () => {
    expect(
      getDefaultLogDate(today, yesterday, [
        baseEntry({
          entry_date: yesterday,
          is_complete: true,
          completed_at: '2026-03-30T12:00:00.000Z',
        }),
      ]),
    ).toBe(today)
  })

  it('returns yesterday when yesterday exists and is incomplete', () => {
    expect(
      getDefaultLogDate(today, yesterday, [
        baseEntry({ entry_date: yesterday, is_complete: false }),
      ]),
    ).toBe(yesterday)
  })

  it('ignores incomplete rows before yesterday', () => {
    expect(
      getDefaultLogDate(today, yesterday, [
        baseEntry({
          entry_date: '2026-03-28',
          is_complete: false,
        }),
      ]),
    ).toBe(today)
  })

  it('ignores incomplete rows when both yesterday and older are incomplete', () => {
    expect(
      getDefaultLogDate(today, yesterday, [
        baseEntry({
          entry_date: '2026-03-28',
          is_complete: false,
        }),
        baseEntry({
          entry_date: yesterday,
          is_complete: false,
        }),
      ]),
    ).toBe(yesterday)
  })
})
