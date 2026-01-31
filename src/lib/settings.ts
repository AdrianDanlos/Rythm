export type DateFormatPreference = 'mdy' | 'dmy' | 'ymd'
export type ThemePreference = 'light' | 'dark'

const DATE_FORMAT_STORAGE_KEY = 'preferredDateFormat'
const THEME_STORAGE_KEY = 'themePreference'
const PROFILE_NAME_STORAGE_KEY = 'profileName'

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
  return 'light'
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
