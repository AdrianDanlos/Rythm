import { describe, expect, it, vi } from 'vitest'
import { Encoding } from '@capacitor/filesystem'
import type { Entry } from '../../entries'
import { exportEntriesCsv } from '../csvExport'

const exportFileMock = vi.hoisted(() => vi.fn())

vi.mock('../fileExport', () => ({
  exportFile: (...args: Parameters<typeof exportFileMock>) => exportFileMock(...args),
}))

vi.mock('../dateFormatters', () => ({
  formatLongDate: () => '01/31/2026',
}))

const makeEntry = (overrides: Partial<Entry>): Entry => ({
  id: 'entry',
  user_id: 'user',
  entry_date: '2026-01-31',
  sleep_hours: 8,
  mood: 5,
  note: null,
  tags: null,
  created_at: '2026-01-31T00:00:00Z',
  ...overrides,
})

describe('exportEntriesCsv', () => {
  it('does nothing when entries are empty', async () => {
    await exportEntriesCsv([])
    expect(exportFileMock).not.toHaveBeenCalled()
  })

  it('exports a CSV with escaped values', async () => {
    const entries = [
      makeEntry({ note: 'Note, with "quotes"' }),
    ]

    await exportEntriesCsv(entries)

    expect(exportFileMock).toHaveBeenCalledWith({
      filename: 'rythm-entries.csv',
      mimeType: 'text/csv;charset=utf-8;',
      data: [
        'date,sleep_hours,mood,note',
        '01/31/2026,8h,5,"Note, with ""quotes"""',
      ].join('\n'),
      encoding: Encoding.UTF8,
    })
  })
})
