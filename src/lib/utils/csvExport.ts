import type { Entry } from '../entries'
import { escapeCsv } from './stringUtils'

export const exportEntriesCsv = (entries: Entry[]) => {
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
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'rythm-entries.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
