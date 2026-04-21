import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { NavigationBar } from '@capgo/capacitor-navigation-bar'
import type { Session } from '@supabase/supabase-js'
import {
  NATIVE_LOGIN_SCREEN_BG_DARK,
  NATIVE_LOGIN_SCREEN_BG_LIGHT,
} from '../lib/nativeLoginChrome'
import i18n from '../i18n'
import {
  detectSystemTheme,
  getStoredDateFormat,
  getStoredLanguage,
  getStoredProfileName,
  getStoredPersonalSleepTarget,
  getStoredThemePreference,
  normalizeSleepTarget,
  setStoredDateFormat,
  setStoredLanguage,
  setStoredProfileName,
  setStoredPersonalSleepTarget,
  setStoredTheme,
  type DateFormatPreference,
  type LanguagePreference,
  type ThemeAppearance,
  type ThemePreference,
} from '../lib/settings'

export type UseSettingsSyncOptions = {
  /**
   * True while the native login / password-recovery chrome is shown (`.app-native-login`),
   * not intro. Android status / nav bars use the same colors as the login background.
   */
  nativeLoginChromeActive: boolean
}

export function useSettingsSync(
  session: Session | null,
  options: UseSettingsSyncOptions,
) {
  const [dateFormat, setDateFormat] = useState<DateFormatPreference>(() =>
    getStoredDateFormat(),
  )
  const [language, setLanguage] = useState<LanguagePreference>(() => getStoredLanguage())
  const [themePreference, setThemePreference] = useState<ThemePreference>(() =>
    getStoredThemePreference(),
  )
  const [systemAppearance, setSystemAppearance] = useState<ThemeAppearance>(() =>
    detectSystemTheme(),
  )

  const resolvedTheme: ThemeAppearance
    = themePreference === 'system' ? systemAppearance : themePreference
  const [profileName, setProfileName] = useState(() => getStoredProfileName())
  const [sleepTarget, setSleepTarget] = useState(() =>
    getStoredPersonalSleepTarget(),
  )

  const { nativeLoginChromeActive } = options

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
  }, [resolvedTheme])

  useEffect(() => {
    if (themePreference !== 'system' || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => setSystemAppearance(mediaQuery.matches ? 'dark' : 'light')
    sync()
    mediaQuery.addEventListener('change', sync)
    return () => mediaQuery.removeEventListener('change', sync)
  }, [themePreference])

  useEffect(() => {
    setStoredLanguage(language)
    if (i18n.language !== language) {
      void i18n.changeLanguage(language)
    }
  }, [language])

  // Android: status / nav bar color matches current shell — login bg vs main app bg.
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return

    const backgroundColor = nativeLoginChromeActive
      ? (resolvedTheme === 'dark' ? NATIVE_LOGIN_SCREEN_BG_DARK : NATIVE_LOGIN_SCREEN_BG_LIGHT)
      : (resolvedTheme === 'dark' ? '#0B1220' : '#F8FAFC')
    const style = resolvedTheme === 'dark' ? Style.Dark : Style.Light
    const darkButtons = resolvedTheme !== 'dark'

    void (async () => {
      await StatusBar.setOverlaysWebView({ overlay: true })
      await StatusBar.setBackgroundColor({ color: backgroundColor })
      await StatusBar.setStyle({ style })
      await NavigationBar.setNavigationBarColor({
        color: backgroundColor,
        darkButtons,
      })
    })()
  }, [resolvedTheme, nativeLoginChromeActive])

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
    setThemePreference(value)
    setStoredTheme(value)
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
    theme: themePreference,
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
