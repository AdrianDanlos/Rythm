import { STORAGE_KEYS } from './storageKeys'

export type DateFormatPreference = 'mdy' | 'dmy' | 'ymd'
export type ThemePreference = 'light' | 'dark'

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
  const value = readStorage(STORAGE_KEYS.DATE_FORMAT)
  if (value === 'dmy' || value === 'ymd' || value === 'mdy') {
    return value
  }
  return 'dmy'
}

export const setStoredDateFormat = (value: DateFormatPreference) => {
  writeStorage(STORAGE_KEYS.DATE_FORMAT, value)
}

export const getStoredTheme = (): ThemePreference => {
  const value = readStorage(STORAGE_KEYS.THEME)
  if (value === 'dark' || value === 'light') {
    return value
  }
  return 'dark'
}

export const setStoredTheme = (value: ThemePreference) => {
  writeStorage(STORAGE_KEYS.THEME, value)
}

export const getStoredProfileName = () => {
  return readStorage(STORAGE_KEYS.PROFILE_NAME) ?? ''
}

export const setStoredProfileName = (value: string) => {
  writeStorage(STORAGE_KEYS.PROFILE_NAME, value)
}

export const normalizeSleepTarget = (value: number) => {
  if (!Number.isFinite(value)) return DEFAULT_SLEEP_TARGET
  const rounded = Math.round(value * 2) / 2
  return Math.min(MAX_SLEEP_TARGET, Math.max(MIN_SLEEP_TARGET, rounded))
}

export const getStoredPersonalSleepTarget = () => {
  const value = readStorage(STORAGE_KEYS.PERSONAL_SLEEP_TARGET)
  if (value === null || value.trim() === '') {
    return DEFAULT_SLEEP_TARGET
  }
  return normalizeSleepTarget(Number(value))
}

export const setStoredPersonalSleepTarget = (value: number) => {
  writeStorage(STORAGE_KEYS.PERSONAL_SLEEP_TARGET, String(normalizeSleepTarget(value)))
}
