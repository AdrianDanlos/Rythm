/**
 * Single source of truth for all localStorage keys used by the app.
 * Use these constants instead of string literals to avoid typos and make keys easy to find.
 */
export const STORAGE_KEYS = {
  DATE_FORMAT: 'preferredDateFormat',
  THEME: 'themePreference',
  PROFILE_NAME: 'profileName',
  PERSONAL_SLEEP_TARGET: 'personalSleepTarget',
  RETURNING_USER: 'rythm_returning_user',
  RATED_GOOGLE_PLAY: 'rythm_rated_google_play',
  DAILY_REMINDER_ENABLED: 'dailyReminderEnabled',
  DAILY_REMINDER_TIME: 'dailyReminderTime',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]
