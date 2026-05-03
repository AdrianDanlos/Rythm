import React, { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import type { FormEvent } from 'react'
import type { Entry } from '../../lib/entries'
import type { StatsResult } from '../../lib/stats'
import { DEFAULT_LOG_SLEEP_HOURS, formatSleepHoursOption } from '../../lib/utils/sleepHours'
import { useLogForm } from '../useLogForm'
import { upsertEntry } from '../../lib/entries'

vi.mock('i18next', () => ({
  t: (key: string) => key,
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('../../lib/stats', () => ({
  buildStats: vi.fn(() => ({ streak: 0, sleepConsistencyBadges: [] as const })),
}))

vi.mock('../../lib/supportMessage', () => ({
  getSupportMessage: vi.fn(() => 'support-message'),
}))

vi.mock('../../lib/entries', () => ({
  upsertEntry: vi.fn(),
}))

const upsertEntryMock = vi.mocked(upsertEntry)
const toastErrorMock = vi.mocked(toast.error)
const toastInfoMock = vi.mocked(toast.info)
;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type HookValue = ReturnType<typeof useLogForm>

const baseStats = { streak: 0, sleepConsistencyBadges: [] } as unknown as StatsResult

const TEST_TODAY = '2026-03-31'
const TEST_YESTERDAY = '2026-03-30'

function stubFormEvent(): FormEvent {
  return { preventDefault: vi.fn() } as unknown as FormEvent
}

const makeEntry = (overrides: Partial<Entry>): Entry => ({
  id: 'entry-id',
  user_id: 'user-1',
  entry_date: '2026-03-31',
  sleep_hours: DEFAULT_LOG_SLEEP_HOURS,
  mood: null,
  note: null,
  tags: null,
  is_complete: false,
  completed_at: null,
  created_at: '2026-03-31T00:00:00.000Z',
  ...overrides,
})

describe('useLogForm', () => {
  let container: HTMLDivElement
  let root: Root
  let latest: HookValue | null

  const setEntries = vi.fn<(entries: Entry[]) => void>()

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    latest = null
    setEntries.mockReset()
    upsertEntryMock.mockReset()
    toastErrorMock.mockReset()
    toastInfoMock.mockReset()
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
  })

  const renderHook = async (entries: Entry[]) => {
    function Harness() {
      const form = useLogForm({
        userId: 'user-1',
        entries,
        setEntries,
        stats: baseStats,
        today: TEST_TODAY,
        yesterday: TEST_YESTERDAY,
        formatLocalDate: date => date.toISOString().slice(0, 10),
        sleepThreshold: 8,
        isPro: false,
        maxTagsPerEntry: 10,
      })

      useEffect(() => {
        latest = form
      }, [form])

      return null
    }

    await act(async () => {
      root.render(<Harness />)
    })
  }

  it('starts with default sleep on first-ever log', async () => {
    await renderHook([])

    expect(latest?.sleepHours).toBe(formatSleepHoursOption(DEFAULT_LOG_SLEEP_HOURS))
  })

  it('uses default sleep when existing entry has null sleep_hours', async () => {
    await renderHook([
      makeEntry({
        sleep_hours: null,
      }),
    ])

    expect(latest?.sleepHours).toBe(formatSleepHoursOption(DEFAULT_LOG_SLEEP_HOURS))
  })

  it('shows post-save mood nudge when saving sleep-only after the first entry', async () => {
    upsertEntryMock.mockResolvedValue(
      makeEntry({
        entry_date: TEST_TODAY,
        mood: null,
        is_complete: false,
      }),
    )
    await renderHook([
      makeEntry({
        entry_date: TEST_YESTERDAY,
        mood: 4,
        is_complete: true,
      }),
    ])

    await act(async () => {
      await latest?.handleSave(stubFormEvent())
    })

    expect(upsertEntryMock).toHaveBeenCalled()
    expect(toastInfoMock).toHaveBeenCalledWith('log.postSaveNeedMood')
  })

  it('blocks first day save without mood', async () => {
    await renderHook([])

    await act(async () => {
      await latest?.handleSave(stubFormEvent())
    })

    expect(upsertEntryMock).not.toHaveBeenCalled()
    expect(toastErrorMock).toHaveBeenCalledWith('log.firstDayNeedMood')
  })

  it('saves first day with default sleep when mood is set without touching sleep', async () => {
    const savedEntry = makeEntry({ mood: 4 })
    upsertEntryMock.mockResolvedValue(savedEntry)
    await renderHook([])

    await act(async () => {
      latest?.setMood(4)
    })

    await act(async () => {
      await latest?.handleSave(stubFormEvent())
    })

    expect(upsertEntryMock).toHaveBeenCalledTimes(1)
    expect(upsertEntryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        entry_date: TEST_TODAY,
        sleep_hours: DEFAULT_LOG_SLEEP_HOURS,
        mood: 4,
      }),
    )
  })

  it('resets selected date to today when user changes', async () => {
    let currentUserId: string | undefined = 'user-1'

    function UserSwitchHarness() {
      const form = useLogForm({
        userId: currentUserId,
        entries: [],
        setEntries,
        stats: baseStats,
        today: TEST_TODAY,
        yesterday: TEST_YESTERDAY,
        formatLocalDate: date => date.toISOString().slice(0, 10),
        sleepThreshold: 8,
        isPro: false,
        maxTagsPerEntry: 10,
      })

      useEffect(() => {
        latest = form
      }, [form])

      return null
    }

    await act(async () => {
      root.render(<UserSwitchHarness />)
    })

    await act(async () => {
      latest?.setEntryDate(TEST_YESTERDAY)
    })

    expect(latest?.selectedDate.getDate()).toBe(30)

    currentUserId = 'user-2'
    await act(async () => {
      root.render(<UserSwitchHarness />)
    })

    expect(latest?.selectedDate.getDate()).toBe(31)
  })

  it('defaults to yesterday when yesterday has an incomplete entry', async () => {
    await renderHook([
      makeEntry({
        entry_date: TEST_YESTERDAY,
        is_complete: false,
      }),
    ])

    expect(latest?.selectedDate.getDate()).toBe(30)
  })

  it('after user switch, follows incomplete yesterday for the new account', async () => {
    let currentUserId: string | undefined = 'user-1'
    let switchEntries: Entry[] = []

    function UserSwitchHarness() {
      const form = useLogForm({
        userId: currentUserId,
        entries: switchEntries,
        setEntries,
        stats: baseStats,
        today: TEST_TODAY,
        yesterday: TEST_YESTERDAY,
        formatLocalDate: date => date.toISOString().slice(0, 10),
        sleepThreshold: 8,
        isPro: false,
        maxTagsPerEntry: 10,
      })

      useEffect(() => {
        latest = form
      }, [form])

      return null
    }

    await act(async () => {
      root.render(<UserSwitchHarness />)
    })

    currentUserId = 'user-2'
    switchEntries = [
      makeEntry({
        entry_date: TEST_YESTERDAY,
        is_complete: false,
      }),
    ]
    await act(async () => {
      root.render(<UserSwitchHarness />)
    })

    expect(latest?.selectedDate.getDate()).toBe(30)
  })
})
