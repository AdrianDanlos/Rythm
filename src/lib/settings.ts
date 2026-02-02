export type DateFormatPreference = 'mdy' | 'dmy' | 'ymd'
export type ThemePreference = 'light' | 'dark'

const DATE_FORMAT_STORAGE_KEY = 'preferredDateFormat'
const THEME_STORAGE_KEY = 'themePreference'
const PROFILE_NAME_STORAGE_KEY = 'profileName'
const PERSONAL_SLEEP_TARGET_KEY = 'personalSleepTarget'

const DEFAULT_SLEEP_TARGET = 8
const MIN_SLEEP_TARGET = 4
const MAX_SLEEP_TARGET = 12

const canUseStorage = () => typeof window !== 'undefined'

const readStorage = (key: string) => {
  if (!canUseStorage()) return null
  try {
    return window.localStorage.getItem(key)
  }
  catch {
    return null
  }
}

const writeStorage = (key: string, value: string) => {
  if (!canUseStorage()) return
  try {
    window.localStorage.setItem(key, value)
  }
  catch {
    // Ignore storage write failures.
  }
}

export const getStoredDateFormat = (): DateFormatPreference => {
  const value = readStorage(DATE_FORMAT_STORAGE_KEY)
  if (value === 'dmy' || value === 'ymd' || value === 'mdy') {
    return value
  }
  return 'mdy'
}

export const setStoredDateFormat = (value: DateFormatPreference) => {
  writeStorage(DATE_FORMAT_STORAGE_KEY, value)
}

export const getStoredTheme = (): ThemePreference => {
  const value = readStorage(THEME_STORAGE_KEY)
  if (value === 'dark' || value === 'light') {
    return value
  }
  return 'dark'
}

export const setStoredTheme = (value: ThemePreference) => {
  writeStorage(THEME_STORAGE_KEY, value)
}

export const getStoredProfileName = () => {
  return readStorage(PROFILE_NAME_STORAGE_KEY) ?? ''
}

export const setStoredProfileName = (value: string) => {
  writeStorage(PROFILE_NAME_STORAGE_KEY, value)
}

export const normalizeSleepTarget = (value: number) => {
  if (!Number.isFinite(value)) return DEFAULT_SLEEP_TARGET
  const rounded = Math.round(value * 2) / 2
  return Math.min(MAX_SLEEP_TARGET, Math.max(MIN_SLEEP_TARGET, rounded))
}

export const getStoredPersonalSleepTarget = () => {
  const value = readStorage(PERSONAL_SLEEP_TARGET_KEY)
  if (value === null || value.trim() === '') {
    return DEFAULT_SLEEP_TARGET
  }
  return normalizeSleepTarget(Number(value))
}

export const setStoredPersonalSleepTarget = (value: number) => {
  writeStorage(PERSONAL_SLEEP_TARGET_KEY, String(normalizeSleepTarget(value)))
}
