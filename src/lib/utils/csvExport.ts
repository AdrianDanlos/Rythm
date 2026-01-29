import { Encoding } from '@capacitor/filesystem'
import type { Entry } from '../entries'
import { exportFile } from './fileExport'
import { escapeCsv } from './stringUtils'

export const exportEntriesCsv = async (entries: Entry[]) => {
  if (!entries.length) return

  const rows = [
    ['date', 'sleep_hours', 'mood', 'note'],
    ...entries.map(entry => [
      entry.entry_date,
      entry.sleep_hours,
      entry.mood,
      entry.note ?? '',
    ]),
  ]

  const csv = rows.map(row => row.map(escapeCsv).join(',')).join('\n')
  await exportFile({
    filename: 'rythm-entries.csv',
    mimeType: 'text/csv;charset=utf-8;',
    data: csv,
    encoding: Encoding.UTF8,
  })
}
