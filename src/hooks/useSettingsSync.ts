import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  getStoredDateFormat,
  getStoredProfileName,
  getStoredPersonalSleepTarget,
  getStoredTheme,
  normalizeSleepTarget,
  setStoredDateFormat,
  setStoredProfileName,
  setStoredPersonalSleepTarget,
  setStoredTheme,
  type DateFormatPreference,
  type ThemePreference,
} from '../lib/settings'

export function useSettingsSync(session: Session | null) {
  const [dateFormat, setDateFormat] = useState<DateFormatPreference>(() =>
    getStoredDateFormat(),
  )
  const [theme, setTheme] = useState<ThemePreference>(() => getStoredTheme())
  const [profileName, setProfileName] = useState('')
  const [sleepTarget, setSleepTarget] = useState(() =>
    getStoredPersonalSleepTarget(),
  )

  // Hydrate from storage on mount
  useEffect(() => {
    setDateFormat(getStoredDateFormat())
    setProfileName(getStoredProfileName())
    setSleepTarget(getStoredPersonalSleepTarget())
  }, [])

  // Apply theme to DOM and persist
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    setStoredTheme(theme)
  }, [theme])

  // Sync profile name from storage or session
  useEffect(() => {
    const storedName = getStoredProfileName()
    if (storedName) {
      setProfileName(storedName)
      return
    }
    const fallbackName =
      session?.user?.user_metadata?.full_name ??
      session?.user?.user_metadata?.name ??
      ''
    setProfileName(fallbackName)
  }, [
    session?.user?.id,
    session?.user?.user_metadata?.full_name,
    session?.user?.user_metadata?.name,
  ])

  const handleDateFormatChange = (value: DateFormatPreference) => {
    setDateFormat(value)
    setStoredDateFormat(value)
  }

  const handleThemeChange = (value: ThemePreference) => {
    setTheme(value)
  }

  const handleProfileNameChange = (value: string) => {
    setProfileName(value)
    setStoredProfileName(value)
  }

  const handleSleepTargetChange = (value: number) => {
    const normalized = normalizeSleepTarget(value)
    setSleepTarget(normalized)
    setStoredPersonalSleepTarget(normalized)
  }

  return {
    dateFormat,
    setDateFormat,
    theme,
    setTheme,
    profileName,
    setProfileName,
    sleepTarget,
    setSleepTarget,
    handleDateFormatChange,
    handleThemeChange,
    handleProfileNameChange,
    handleSleepTargetChange,
  }
}
