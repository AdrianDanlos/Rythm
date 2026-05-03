import type { Entry } from '../entries'

/**
 * Default log calendar day: local today, unless yesterday has an incomplete row.
 * Incomplete rows older than yesterday are ignored.
 */
export function getDefaultLogDate(
  today: string,
  yesterday: string,
  entries: Entry[],
): string {
  const row = entries.find(e => e.entry_date === yesterday)
  if (row && !row.is_complete) {
    return yesterday
  }
  return today
}
