import type { WeekdayAveragePoint } from '../types/stats'

/**
 * Synthetic weekday averages used to populate the weekday-pattern card as a
 * preview when the user does not yet have enough real entries.
 *
 * Values are deliberately varied so that the four highlight cards
 * (best/worst mood, most/least sleep) all render with distinct day labels.
 * Axis labels use `dayKey` + i18n (`insights.weekdayMonShort`, etc.); `label`
 * is unused for rendering but kept for the `WeekdayAveragePoint` shape.
 */
export const WEEKDAY_PREVIEW_AVERAGES: WeekdayAveragePoint[] = [
  { dayKey: 'mon', label: '', avgSleep: 6.4, avgMood: 3.1, observationCount: 4 },
  { dayKey: 'tue', label: '', avgSleep: 7.1, avgMood: 3.6, observationCount: 5 },
  { dayKey: 'wed', label: '', avgSleep: 6.8, avgMood: 3.4, observationCount: 5 },
  { dayKey: 'thu', label: '', avgSleep: 7.3, avgMood: 3.7, observationCount: 4 },
  { dayKey: 'fri', label: '', avgSleep: 6.0, avgMood: 4.5, observationCount: 6 },
  { dayKey: 'sat', label: '', avgSleep: 8.7, avgMood: 4.2, observationCount: 5 },
  { dayKey: 'sun', label: '', avgSleep: 8.1, avgMood: 2.7, observationCount: 4 },
]
