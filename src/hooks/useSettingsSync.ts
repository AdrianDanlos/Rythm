import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { NavigationBar } from '@capgo/capacitor-navigation-bar'
import type { Session } from '@supabase/supabase-js'
import i18n from '../i18n'
import {
  getStoredDateFormat,
  getStoredLanguage,
  getStoredProfileName,
  getStoredPersonalSleepTarget,
  getStoredTheme,
  normalizeSleepTarget,
  setStoredDateFormat,
  setStoredLanguage,
  setStoredProfileName,
  setStoredPersonalSleepTarget,
  setStoredTheme,
  type DateFormatPreference,
  type LanguagePreference,
  type ThemePreference,
} from '../lib/settings'

export function useSettingsSync(session: Session | null) {
  const [dateFormat, setDateFormat] = useState<DateFormatPreference>(() =>
    getStoredDateFormat(),
  )
  const [language, setLanguage] = useState<LanguagePreference>(() => getStoredLanguage())
  const [theme, setTheme] = useState<ThemePreference>(() => getStoredTheme())
  const [profileName, setProfileName] = useState(() => getStoredProfileName())
  const [sleepTarget, setSleepTarget] = useState(() =>
    getStoredPersonalSleepTarget(),
  )

  // Apply theme to DOM and persist
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    setStoredTheme(theme)
  }, [theme])

  useEffect(() => {
    setStoredLanguage(language)
    if (i18n.language !== language) {
      void i18n.changeLanguage(language)
    }
  }, [language])

  // Keep Android status bar colors/icons aligned with the selected app theme.
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return
    const backgroundColor = theme === 'dark' ? '#0B1220' : '#F8FAFC'
    const style = theme === 'dark' ? Style.Dark : Style.Light
    const darkButtons = theme !== 'dark'

    void (async () => {
      await StatusBar.setOverlaysWebView({ overlay: true })
      await StatusBar.setBackgroundColor({ color: backgroundColor })
      await StatusBar.setStyle({ style })
      await NavigationBar.setNavigationBarColor({
        color: backgroundColor,
        darkButtons,
      })
    })()
  }, [theme])

  const sessionFallbackName
    = session?.user?.user_metadata?.full_name
      ?? session?.user?.user_metadata?.name
      ?? ''
  const resolvedProfileName = profileName || sessionFallbackName

  const handleDateFormatChange = (value: DateFormatPreference) => {
    setDateFormat(value)
    setStoredDateFormat(value)
  }

  const handleThemeChange = (value: ThemePreference) => {
    setTheme(value)
  }

  const handleLanguageChange = (value: LanguagePreference) => {
    setLanguage(value)
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
    language,
    setLanguage,
    theme,
    setTheme,
    profileName: resolvedProfileName,
    setProfileName,
    sleepTarget,
    setSleepTarget,
    handleDateFormatChange,
    handleLanguageChange,
    handleThemeChange,
    handleProfileNameChange,
    handleSleepTargetChange,
  }
}
