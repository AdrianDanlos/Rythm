/**
 * Single source of truth for all localStorage keys used by the app.
 * Use these constants instead of string literals to avoid typos and make keys easy to find.
 */
export const STORAGE_KEYS = {
  DATE_FORMAT: 'preferredDateFormat',
  LANGUAGE: 'languagePreference',
  THEME: 'themePreference',
  PROFILE_NAME: 'profileName',
  PERSONAL_SLEEP_TARGET: 'personalSleepTarget',
  INTRO_COMPLETED: 'rythm_intro_completed',
  RETURNING_USER: 'rythm_returning_user',
  RATED_GOOGLE_PLAY: 'rythm_rated_google_play',
  DAILY_REMINDER_ENABLED: 'dailyReminderEnabled',
  DAILY_REMINDER_TIME: 'dailyReminderTime',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

/** Keys used with sessionStorage for one-shot navigation UX (cleared when consumed). */
export const SESSION_STORAGE_KEYS = {
  SCROLL_TO_LOG_DAILY_EVENTS: 'rythm_scroll_to_log_daily_events',
} as const
