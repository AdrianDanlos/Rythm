import { STORAGE_KEYS } from './storageKeys'

export type DateFormatPreference = 'mdy' | 'dmy' | 'ymd'
export type ThemePreference = 'light' | 'dark'
export type LanguagePreference = 'en' | 'es'

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

const detectRegionalDateFormat = (): DateFormatPreference => {
  if (typeof navigator === 'undefined') return 'dmy'
  const locale = navigator.languages?.[0] ?? navigator.language
  if (!locale) return 'dmy'

  try {
    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const parts = formatter.formatToParts(new Date(Date.UTC(2001, 10, 23)))
    const dayIndex = parts.findIndex(part => part.type === 'day')
    const monthIndex = parts.findIndex(part => part.type === 'month')
    const yearIndex = parts.findIndex(part => part.type === 'year')

    if (monthIndex >= 0 && dayIndex >= 0 && yearIndex >= 0) {
      if (yearIndex < monthIndex && monthIndex < dayIndex) return 'ymd'
      if (monthIndex < dayIndex && dayIndex < yearIndex) return 'mdy'
      return 'dmy'
    }
  }
  catch {
    // Fall back to dmy when locale detection is unavailable.
  }

  return 'dmy'
}

export const getStoredDateFormat = (): DateFormatPreference => {
  const value = readStorage(STORAGE_KEYS.DATE_FORMAT)
  if (value === 'dmy' || value === 'ymd' || value === 'mdy') {
    return value
  }
  return detectRegionalDateFormat()
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

export const getStoredLanguage = (): LanguagePreference => {
  const value = readStorage(STORAGE_KEYS.LANGUAGE)
  if (value === 'es' || value === 'en') {
    return value
  }
  if (typeof navigator !== 'undefined') {
    const browser = navigator.language.toLowerCase().split('-')[0]
    if (browser === 'es') return 'es'
  }
  return 'en'
}

export const setStoredLanguage = (value: LanguagePreference) => {
  writeStorage(STORAGE_KEYS.LANGUAGE, value)
}

export const getStoredProfileName = () => {
  return readStorage(STORAGE_KEYS.PROFILE_NAME) ?? ''
}

export const setStoredProfileName = (value: string) => {
  writeStorage(STORAGE_KEYS.PROFILE_NAME, value)
}

export const normalizeSleepTarget = (value: number) => {
  if (!Number.isFinite(value)) return DEFAULT_SLEEP_TARGET
  const rounded = Math.round(value * 4) / 4
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
