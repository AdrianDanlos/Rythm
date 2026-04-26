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
  buildStats: vi.fn(() => ({ streak: 0 })),
}))

vi.mock('../../lib/supportMessage', () => ({
  getSupportMessage: vi.fn(() => 'support-message'),
}))

vi.mock('../../lib/entries', () => ({
  upsertEntry: vi.fn(),
}))

const upsertEntryMock = vi.mocked(upsertEntry)
const toastErrorMock = vi.mocked(toast.error)
;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type HookValue = ReturnType<typeof useLogForm>

const baseStats = { streak: 0 } as StatsResult

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
        today: '2026-03-31',
        formatLocalDate: date => date.toISOString().slice(0, 10),
        sleepThreshold: 8,
        isPro: false,
        maxTagsPerEntry: 8,
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

  it('blocks first day save without mood', async () => {
    await renderHook([])

    await act(async () => {
      await latest?.handleSave({
        preventDefault: vi.fn(),
      } as FormEvent)
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
      await latest?.handleSave({
        preventDefault: vi.fn(),
      } as FormEvent)
    })

    expect(upsertEntryMock).toHaveBeenCalledTimes(1)
    expect(upsertEntryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        entry_date: '2026-03-31',
        sleep_hours: DEFAULT_LOG_SLEEP_HOURS,
        mood: 4,
      }),
    )
  })

  it('does not persist silently when the user has not edited the form', async () => {
    await renderHook([])

    await act(async () => {
      await latest?.handleSave(
        {
          preventDefault: vi.fn(),
        } as FormEvent,
        { silent: true },
      )
    })

    expect(upsertEntryMock).not.toHaveBeenCalled()
  })

  it('still persists silently after an edit when first-day requirements are met', async () => {
    const savedEntry = makeEntry({ mood: 4 })
    upsertEntryMock.mockResolvedValue(savedEntry)
    await renderHook([])

    await act(async () => {
      latest?.setSleepHours(formatSleepHoursOption(DEFAULT_LOG_SLEEP_HOURS))
      latest?.setMood(4)
    })

    await act(async () => {
      await latest?.handleSave(
        {
          preventDefault: vi.fn(),
        } as FormEvent,
        { silent: true },
      )
    })

    expect(upsertEntryMock).toHaveBeenCalledTimes(1)
  })
})
