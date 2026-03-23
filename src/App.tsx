import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { LocalNotifications } from '@capacitor/local-notifications'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { exportEntriesCsv } from './lib/utils/csvExport'
import { formatLocalDate } from './lib/utils/dateFormatters'
import { AppHeader } from './components/AppHeader'
import { AppMainContent } from './components/AppMainContent'
import { AppBottomNav } from './components/AppBottomNav'
import { PaywallPage } from './billing/shared/PaywallPage'
import { FeedbackModal } from './components/FeedbackModal'
import { StreakModal } from './components/StreakModal'
import { AppSidePanel } from './components/AppSidePanel'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './hooks/useAuth'
import { useAuthActions } from './hooks/useAuthActions'
import { useBillingActions } from './billing/shared/useBillingActions'
import { useBillingState } from './hooks/useBillingState'
import { useSettingsSync } from './hooks/useSettingsSync'
import { useAppShell } from './hooks/useAppShell'
import { useEntries } from './hooks/useEntries'
import { useLogForm } from './hooks/useLogForm'
import { Privacy } from './billing/stripe/Privacy'
import { DeleteAccountPage } from './billing/stripe/DeleteAccountPage'
import { checkForAndroidUpdate } from './lib/appUpdate'
import {
  ROUTES,
  isPrivacyPage,
  isDeleteAccountPage,
  isStripeReturn,
} from './billing/stripe/routes'
import {
  AppPage,
  getInsightsSectionForPage,
  getPageFromPathname,
  getPathForPage,
  getTabForPage,
} from './lib/appTabs'
import { moodColors, tagColorPalette } from './lib/colors'
import { PLAY_STORE_APP_URL } from './lib/constants'
import { STORAGE_KEYS } from './lib/storageKeys'
import { DAILY_REMINDER_ID } from './lib/notifications'
import { Toaster } from 'sonner'
import './App.css'
import { upsertEntry } from './lib/entries'
import { MAX_TAG_LENGTH } from './lib/utils/stringUtils'

function getReturningUserStorageKey(userId: string): string {
  return `${STORAGE_KEYS.RETURNING_USER}:${userId}`
}

function isReturningUser(userId?: string): boolean {
  if (!userId) {
    return false
  }

  try {
    return window.localStorage.getItem(getReturningUserStorageKey(userId)) === 'true'
  }
  catch {
    return false
  }
}

function getDefaultPageForUser(userId?: string): AppPage {
  return isReturningUser(userId) ? AppPage.Summary : AppPage.Log
}

/** True while the URL still carries tokens from an OAuth redirect (must not navigate away before Supabase reads them). */
function hasSupabaseAuthCallbackPayload(search: string, hash: string): boolean {
  try {
    const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
    if (q.has('code') || q.has('error')) {
      return true
    }
    const fragment = hash.startsWith('#') ? hash.slice(1) : hash
    if (!fragment) {
      return false
    }
    if (fragment.includes('access_token') || fragment.includes('error=')) {
      return true
    }
    const hp = new URLSearchParams(fragment)
    return hp.has('access_token') || hp.has('error')
  }
  catch {
    return false
  }
}

function App() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname
  const showPrivacyPage = isPrivacyPage(pathname)
  const showDeleteAccountPage = isDeleteAccountPage(pathname)
  const showStripeReturnPage = isStripeReturn(pathname)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const isNativeApp = Capacitor.isNativePlatform()
  const {
    session,
    authLoading,
    authInitialized,
    signIn,
    signUp,
    signOut,
    refreshSession,
    setAuthError,
  } = useAuth()

  const [exportError, setExportError] = useState<string | null>(null)
  const [isPortalLoading, setIsPortalLoading] = useState(false)
  const [isSignOutLoading, setIsSignOutLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== 'undefined'
      && !window.matchMedia('(min-width: 768px)').matches,
  )
  const [isMenuPanelOpen, setIsMenuPanelOpen] = useState(false)
  const swipeStartXRef = useRef<number | null>(null)

  // Must not memoize with [] — SPA stays mounted across midnight; stale "today" breaks Log.
  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)
  const today = formatLocalDate(todayDate)

  const userId = session?.user?.id
  const activePage = getPageFromPathname(pathname) ?? getDefaultPageForUser(userId)
  const activeTab = getTabForPage(activePage)
  const activeInsightsTab = getInsightsSectionForPage(activePage)
  const navigateToPage = useCallback(
    (page: AppPage, options?: { replace?: boolean }) => {
      const targetPath = getPathForPage(page)
      if (pathname === targetPath) {
        return
      }
      navigate(targetPath, { replace: options?.replace ?? false })
    },
    [pathname, navigate],
  )
  const shell = useAppShell({ activeTab, onNavigateToPage: navigateToPage })
  const {
    isStreakOpen,
    isFeedbackOpen,
    saveLogWhenLeaving,
    closeStreak,
    openFeedback,
    closeFeedback,
    goToInsightsSummary,
  } = shell

  const openPaywall = useCallback(() => {
    navigate(getPathForPage(AppPage.Pro), { state: { paywallFrom: pathname } })
  }, [navigate, pathname])

  const closePaywall = useCallback(() => {
    const from = (location.state as { paywallFrom?: string } | null)?.paywallFrom
    if (typeof from === 'string' && from.startsWith('/')) {
      navigate(from, { replace: true })
      return
    }
    navigate(getPathForPage(AppPage.Summary), { replace: true })
  }, [navigate, location.state])
  const pageHistoryRef = useRef<AppPage[]>([activePage])
  const suppressNextHistoryEntryRef = useRef(false)
  const [canGoBackInApp, setCanGoBackInApp] = useState(false)

  const goBackInApp = useCallback(() => {
    const history = pageHistoryRef.current
    if (history.length <= 1) {
      return false
    }

    const nextHistory = history.slice(0, -1)
    const targetPage = nextHistory[nextHistory.length - 1]
    if (!targetPage) {
      return false
    }

    pageHistoryRef.current = nextHistory
    setCanGoBackInApp(nextHistory.length > 1)
    suppressNextHistoryEntryRef.current = true
    navigateToPage(targetPage, { replace: true })
    return true
  }, [navigateToPage])

  const billing = useBillingState(session)
  const {
    isPro,
    canManageSubscription,
    trimmedUpgradeUrl,
  } = billing

  const settings = useSettingsSync(session)
  const {
    dateFormat,
    language,
    theme,
    profileName,
    sleepTarget,
    handleDateFormatChange,
    handleLanguageChange,
    handleThemeChange,
    handleProfileNameChange,
    handleSleepTargetChange,
  } = settings

  const sleepThreshold = sleepTarget
  const maxTagsPerEntry = 8

  const {
    entries,
    setEntries,
    entriesLoading,
    entriesSettled,
    chartData,
    averages,
    highlightedDates,
    incompleteHighlightedDates,
    stats,
  } = useEntries({
    userId: session?.user?.id,
    sleepThreshold,
    formatLocalDate,
  })

  const [tagColors, setTagColors] = useState<Record<string, string>>({})

  useEffect(() => {
    const uid = session?.user?.id
    if (!uid) {
      setTagColors({})
      return
    }
    try {
      const stored = window.localStorage.getItem(`rythm:tagColors:${uid}`)
      if (stored) {
        setTagColors(JSON.parse(stored))
      }
    }
    catch {
      setTagColors({})
    }
  }, [session?.user?.id])

  const ensureTagColorForTag = (tag: string) => {
    const key = tag.trim().toLowerCase()
    if (!key) return
    setTagColors((prev) => {
      if (prev[key]) return prev

      const existingColors = new Set(Object.values(prev))
      const available = tagColorPalette.filter(color => !existingColors.has(color))
      const pool = available.length > 0 ? available : tagColorPalette
      const randomIndex = Math.floor(Math.random() * pool.length)
      const color = pool[randomIndex]

      const next = { ...prev, [key]: color }
      const uid = session?.user?.id
      if (uid) {
        try {
          window.localStorage.setItem(`rythm:tagColors:${uid}`, JSON.stringify(next))
        }
        catch {
          // ignore storage errors
        }
      }
      return next
    })
  }

  const handleTagColorChange = (tag: string, color: string) => {
    const key = tag.trim().toLowerCase()
    if (!key) return
    setTagColors((prev) => {
      const next = { ...prev, [key]: color }
      const uid = session?.user?.id
      if (uid) {
        try {
          window.localStorage.setItem(`rythm:tagColors:${uid}`, JSON.stringify(next))
        }
        catch {
          // ignore storage errors
        }
      }
      return next
    })
  }

  const {
    setEntryDate,
    selectedDate,
    sleepHours,
    setSleepHours,
    mood,
    setMood,
    note,
    setNote,
    tags,
    setTags,
    tagSuggestions,
    saving,
    saved,
    handleSave,
  } = useLogForm({
    userId: session?.user?.id,
    entries,
    setEntries,
    stats,
    today,
    formatLocalDate,
    sleepThreshold,
    isPro,
    maxTagsPerEntry,
    onStreakReached: () => shell.setIsStreakOpen(true),
    onEntrySavedForToday: goToInsightsSummary,
  })

  const runSaveBeforeLeavingTab = useCallback(
    () =>
      saveLogWhenLeaving(() =>
        void handleSave(
          { preventDefault: () => {} } as FormEvent<HTMLFormElement>,
          { silent: true },
        ),
      ),
    [saveLogWhenLeaving, handleSave],
  )

  const handleEntryDateChange = (newDateStr: string) => {
    if (newDateStr !== formatLocalDate(selectedDate)) {
      void handleSave(
        { preventDefault: () => {} } as FormEvent<HTMLFormElement>,
        { silent: true },
      ).then(() => setEntryDate(newDateStr))
    }
    else {
      setEntryDate(newDateStr)
    }
  }

  const { handleAuth, handleGoogleSignIn } = useAuthActions({
    authMode,
    authEmail,
    authPassword,
    signIn,
    signUp,
    setAuthError,
  })

  const {
    handleStartCheckout,
    handleManageSubscription,
    handleRestorePurchases,
  } = useBillingActions({
    trimmedUpgradeUrl,
    isPortalLoading,
    setIsPortalLoading,
    subscriptionSource:
      billing.subscriptionSource,
    refreshSession,
  })

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)')
    const handler = () => setIsMobile(!mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Capacitor: set session when app is opened from auth link
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const listenerPromise = CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      const fragment = url?.split('#')[1] ?? ''
      const params = new URLSearchParams(fragment)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      if (accessToken && refreshToken) {
        void supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
      }
    })
    return () => {
      void listenerPromise.then(listener => listener.remove())
    }
  }, [])

  useEffect(() => {
    if (!isNativeApp || Capacitor.getPlatform() !== 'android') return

    const listenerPromise = CapacitorApp.addListener('backButton', () => {
      if (isFeedbackOpen) {
        closeFeedback()
        return
      }
      if (activePage === AppPage.Pro) {
        closePaywall()
        return
      }
      if (isStreakOpen) {
        closeStreak()
        return
      }

      if (canGoBackInApp) {
        runSaveBeforeLeavingTab()
        if (goBackInApp()) {
          return
        }
      }

      CapacitorApp.exitApp()
    })

    return () => {
      void listenerPromise.then(listener => listener.remove())
    }
  }, [
    isNativeApp,
    isFeedbackOpen,
    isStreakOpen,
    activePage,
    closeFeedback,
    closePaywall,
    closeStreak,
    canGoBackInApp,
    runSaveBeforeLeavingTab,
    goBackInApp,
  ])

  useEffect(() => {
    void checkForAndroidUpdate()
    if (!isNativeApp || Capacitor.getPlatform() !== 'android') return

    const listenerPromise = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        void checkForAndroidUpdate()
      }
    })

    return () => {
      void listenerPromise.then(listener => listener.remove())
    }
  }, [isNativeApp])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const { overflow } = document.body.style

    if (isMenuPanelOpen) {
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = overflow
    }
  }, [isMenuPanelOpen])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [activePage])

  useEffect(() => {
    if (!showStripeReturnPage) return
    if (pathname === ROUTES.stripeSuccess) {
      void refreshSession()
    }
    navigate(getPathForPage(getDefaultPageForUser(userId)), { replace: true })
  }, [showStripeReturnPage, pathname, refreshSession, navigate, userId])

  useEffect(() => {
    if (showPrivacyPage || showDeleteAccountPage || showStripeReturnPage) return

    if (hasSupabaseAuthCallbackPayload(location.search, location.hash)) {
      return
    }

    if (pathname === '/') {
      navigate(getPathForPage(getDefaultPageForUser(userId)), { replace: true })
      return
    }

    if (!getPageFromPathname(pathname)) {
      navigate(getPathForPage(getDefaultPageForUser(userId)), { replace: true })
    }
  }, [
    showPrivacyPage,
    showDeleteAccountPage,
    showStripeReturnPage,
    pathname,
    location.search,
    location.hash,
    navigate,
    userId,
  ])

  useEffect(() => {
    if (!userId || showPrivacyPage || showDeleteAccountPage || showStripeReturnPage) {
      return
    }

    const routedPage = getPageFromPathname(pathname)
    if (!routedPage || routedPage === AppPage.Log || routedPage === AppPage.Pro) {
      return
    }

    if (!isReturningUser(userId)) {
      navigate(getPathForPage(AppPage.Log), { replace: true })
    }
  }, [userId, showPrivacyPage, showDeleteAccountPage, showStripeReturnPage, pathname, navigate])

  useEffect(() => {
    if (showPrivacyPage || showDeleteAccountPage || showStripeReturnPage) return
    if (pathname !== getPathForPage(AppPage.Pro)) return
    if (!authInitialized) return
    if (hasSupabaseAuthCallbackPayload(location.search, location.hash)) return
    if (isPro) {
      navigate(getPathForPage(AppPage.Summary), { replace: true })
      return
    }
    if (!session) {
      navigate(getPathForPage(AppPage.Log), { replace: true })
    }
  }, [
    showPrivacyPage,
    showDeleteAccountPage,
    showStripeReturnPage,
    pathname,
    location.search,
    location.hash,
    authInitialized,
    isPro,
    session,
    navigate,
  ])

  useEffect(() => {
    if (!getPageFromPathname(pathname)) {
      return
    }

    if (suppressNextHistoryEntryRef.current) {
      suppressNextHistoryEntryRef.current = false
      return
    }

    const history = pageHistoryRef.current
    if (history[history.length - 1] === activePage) {
      return
    }

    pageHistoryRef.current = [...history, activePage]
    setCanGoBackInApp(pageHistoryRef.current.length > 1)
  }, [pathname, activePage])

  const restoredForUserIdRef = useRef<string | null>(null)
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId || !isNativeApp || Capacitor.getPlatform() !== 'android') return
    if (restoredForUserIdRef.current === userId) return
    restoredForUserIdRef.current = userId
    void handleRestorePurchases()
  }, [session?.user?.id, isNativeApp, handleRestorePurchases])

  useEffect(() => {
    if (entries.length && exportError) {
      setExportError(null)
    }
  }, [entries.length, exportError])

  useEffect(() => {
    if (entriesLoading || entries.length === 0 || !userId) return
    try {
      window.localStorage.setItem(`${STORAGE_KEYS.RETURNING_USER}:${userId}`, 'true')
    }
    catch {
      // Ignore storage write failures.
    }
  }, [entriesLoading, entries.length, userId])

  const handleSignOut = async () => {
    if (isSignOutLoading) return
    setIsSignOutLoading(true)
    try {
      await signOut()
    }
    finally {
      setIsSignOutLoading(false)
    }
  }

  const handleExportCsv = async () => {
    if (!entries.length) {
      setExportError(t('errors.addOneEntryToExport'))
      return
    }
    setExportError(null)
    try {
      await exportEntriesCsv(entries)
    }
    catch {
      setExportError(t('errors.unableToExportCsv'))
    }
  }

  const handleExportMonthlyReport = async () => {
    if (!entries.length) {
      setExportError(null)
      if (!isPro) {
        openPaywall()
        return
      }
      setExportError(t('errors.addOneEntryToExport'))
      return
    }
    if (!isPro) {
      openPaywall()
      return
    }
    setExportError(null)
    try {
      const { exportMonthlyReport } = await import('./lib/reports')
      await exportMonthlyReport(entries, stats, {
        title: '',
        profileName,
      })
    }
    catch {
      setExportError(t('errors.unableToExportReport'))
    }
  }

  const handleRenameTag = (fromTag: string, toTag: string) => {
    const fromKey = fromTag.trim().toLowerCase()
    const toKey = toTag.trim().slice(0, MAX_TAG_LENGTH).toLowerCase()
    if (!fromKey || !toKey) return
    if (fromKey === toKey) return

    // Preserve any custom color when renaming.
    setTagColors((prev) => {
      const fromColor = prev[fromKey]
      if (!fromColor) return prev
      if (toKey === fromKey) return prev
      const next: Record<string, string> = { ...prev }
      // Only move color if new key doesn't already have one.
      if (!next[toKey]) {
        next[toKey] = fromColor
      }
      delete next[fromKey]
      const uid = session?.user?.id
      if (uid) {
        try {
          window.localStorage.setItem(`rythm:tagColors:${uid}`, JSON.stringify(next))
        }
        catch {
          // ignore storage errors
        }
      }
      return next
    })

    // Optimistic UI update: change tags in local state immediately.
    const nextEntries = entries.map((entry) => {
      if (!entry.tags?.length) return entry
      let changed = false
      const updatedTags = entry.tags.map((tag) => {
        const normalized = tag.trim().toLowerCase()
        if (!normalized) return tag
        if (normalized === fromKey) {
          changed = true
          return toKey
        }
        return tag
      })
      return changed ? { ...entry, tags: updatedTags } : entry
    })
    setEntries(nextEntries)

    // Persist in background; keep UI responsive.
    if (!userId) return

    const affectedEntries = entries.filter(entry =>
      (entry.tags ?? []).some(tag => tag.trim().toLowerCase() === fromKey),
    )
    if (!affectedEntries.length) return

    void (async () => {
      try {
        const updatedEntries = await Promise.all(
          affectedEntries.map(async (entry) => {
            const nextTags = (entry.tags ?? []).map((tag) => {
              const normalized = tag.trim().toLowerCase()
              if (!normalized) return tag
              return normalized === fromKey ? toKey : tag
            })

            const saved = await upsertEntry({
              user_id: userId,
              entry_date: entry.entry_date,
              tags: nextTags,
            })

            return saved
          }),
        )

        const updatedByKey = new Map(
          updatedEntries.map(e => [`${e.user_id}:${e.entry_date}`, e]),
        )

        setEntries(prev =>
          prev.map((entry) => {
            const key = `${entry.user_id}:${entry.entry_date}`
            return updatedByKey.get(key) ?? entry
          }),
        )
      }
      catch {
        // If rename fails, keep optimistic UI; next reload will refetch from server.
      }
    })()
  }

  useEffect(() => {
    if (!isNativeApp) return

    const listenerPromise = LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (event) => {
        const notificationId = event?.notification?.id
        if (notificationId === DAILY_REMINDER_ID) {
          navigateToPage(AppPage.Log)
        }
      },
    )

    return () => {
      void listenerPromise.then(listener => listener.remove())
    }
  }, [isNativeApp, navigateToPage])

  if (showDeleteAccountPage) {
    return <DeleteAccountPage />
  }
  if (showPrivacyPage) {
    return <Privacy />
  }

  const handleSwipeStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    // Only start a swipe if it begins near the left edge to avoid conflicts
    swipeStartXRef.current = touch.clientX <= 32 ? touch.clientX : null
  }

  const handleSwipeMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (swipeStartXRef.current == null || isMenuPanelOpen) return
    const touch = event.touches[0]
    const deltaX = touch.clientX - swipeStartXRef.current
    // Simple threshold: a rightward swipe of at least 40px from the edge opens the menu
    if (deltaX > 40) {
      swipeStartXRef.current = null
      setIsMenuPanelOpen(true)
    }
  }

  const handleSwipeEnd = () => {
    swipeStartXRef.current = null
  }

  const handleAppClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isMenuPanelOpen) return

    const target = event.target as HTMLElement | null
    if (!target) return

    if (target.closest('.side-panel') || target.closest('.app-header-menu-btn')) {
      return
    }

    setIsMenuPanelOpen(false)
  }

  return (
    <div
      className={`app ${session ? 'app-authenticated' : 'app-unauthenticated'}${!session && isNativeApp && Capacitor.getPlatform() === 'android' ? ' app-native-login' : ''}${session && activePage === AppPage.Pro ? ' app-pro-page' : ''}`}
      onClick={handleAppClick}
      onTouchStart={handleSwipeStart}
      onTouchMove={handleSwipeMove}
      onTouchEnd={handleSwipeEnd}
    >
      <AppHeader
        onOpenMenu={() => setIsMenuPanelOpen(prev => !prev)}
        isMenuOpen={isMenuPanelOpen}
        isAuthenticated={!!session}
      />

      <AppSidePanel
        isOpen={isMenuPanelOpen}
        onClose={() => setIsMenuPanelOpen(false)}
        session={session}
        isPro={isPro}
        canManageSubscription={canManageSubscription}
        isSignOutLoading={isSignOutLoading}
        onExportCsv={handleExportCsv}
        onExportReport={handleExportMonthlyReport}
        onOpenSettings={() => navigateToPage(AppPage.Settings)}
        onOpenPaywall={openPaywall}
        onManageSubscription={handleManageSubscription}
        onReviewApp={() => window.open(PLAY_STORE_APP_URL, '_blank', 'noreferrer')}
        onOpenFeedback={openFeedback}
        onSignOut={handleSignOut}
      />

      <StreakModal isOpen={isStreakOpen} onClose={closeStreak} />
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={closeFeedback}
        userEmail={session?.user?.email ?? null}
      />

      {authInitialized && session && activePage === AppPage.Pro
        ? (
            <PaywallPage
              onClose={closePaywall}
              upgradeUrl={trimmedUpgradeUrl}
              onUpgrade={handleStartCheckout}
              onRestore={handleRestorePurchases}
              showRestore={false}
            />
          )
        : (
            <AppMainContent
              activePage={activePage}
              authInitialized={authInitialized}
              session={session}
              isNativeApp={isNativeApp}
              authMode={authMode}
              setAuthMode={setAuthMode}
              authEmail={authEmail}
              authPassword={authPassword}
              authLoading={authLoading}
              onAuth={handleAuth}
              onGoogleSignIn={handleGoogleSignIn}
              onEmailChange={setAuthEmail}
              onPasswordChange={setAuthPassword}
              activeTab={activeTab}
              onNavigateToPage={navigateToPage}
              activeInsightsTab={activeInsightsTab}
              saveLogWhenLeaving={saveLogWhenLeaving}
              entriesSettled={entriesSettled}
              entries={entries}
              selectedDate={selectedDate}
              todayDate={todayDate}
              highlightedDates={highlightedDates}
              incompleteHighlightedDates={incompleteHighlightedDates}
              sleepHours={sleepHours}
              mood={mood}
              note={note}
              tags={tags}
              tagSuggestions={tagSuggestions}
              maxTagsPerEntry={maxTagsPerEntry}
              saving={saving}
              saved={saved}
              moodColors={moodColors}
              isMobile={isMobile}
              formatLocalDate={formatLocalDate}
              onEntryDateChange={handleEntryDateChange}
              onSleepHoursChange={setSleepHours}
              onMoodChange={setMood}
              onNoteChange={setNote}
              onTagsChange={setTags}
              onSave={handleSave}
              entriesLoading={entriesLoading}
              chartData={chartData}
              averages={averages}
              windowAverages={stats.windowAverages}
              statCounts={stats.statCounts}
              rhythmScore={stats.rhythmScore}
              streak={stats.streak}
              sleepConsistencyLabel={stats.sleepConsistencyLabel}
              sleepConsistencyBadges={stats.sleepConsistencyBadges}
              correlationLabel={stats.correlationLabel}
              correlationDirection={stats.correlationDirection}
              moodBySleepThreshold={stats.moodBySleepThreshold}
              moodBySleepBucketCounts={stats.moodBySleepBucketCounts}
              sleepThreshold={sleepThreshold}
              trendSeries={stats.trendSeries}
              rollingSeries={stats.rollingSeries}
              rollingSummaries={stats.rollingSummaries}
              weekdayAverages={stats.weekdayAverages}
              personalSleepThreshold={stats.personalSleepThreshold}
              moodByPersonalThreshold={stats.moodByPersonalThreshold}
              tagDrivers={stats.tagDrivers}
              tagSleepDrivers={stats.tagSleepDrivers}
              tagColors={tagColors}
              isPro={isPro}
              onOpenPaywall={openPaywall}
              onOpenFeedback={openFeedback}
              settingsName={profileName}
              settingsEmail={session?.user?.email ?? ''}
              settingsDateFormat={dateFormat}
              settingsLanguage={language}
              settingsTheme={theme}
              settingsPersonalSleepTarget={sleepTarget}
              onSettingsNameChange={handleProfileNameChange}
              onSettingsDateFormatChange={handleDateFormatChange}
              onSettingsLanguageChange={handleLanguageChange}
              onSettingsThemeChange={handleThemeChange}
              onSettingsPersonalSleepTargetChange={handleSleepTargetChange}
              onRenameTag={handleRenameTag}
              onTagColorChange={handleTagColorChange}
              onEnsureTagColor={ensureTagColorForTag}
            />
          )}

      {authInitialized && session && activePage !== AppPage.Pro
        ? (
            <AppBottomNav
              session={session}
              activePage={activePage}
              activeTab={activeTab}
              activeInsightsTab={activeInsightsTab}
              onNavigateToPage={navigateToPage}
              onBeforeLeaveTab={runSaveBeforeLeavingTab}
              canManageSubscription={canManageSubscription}
              isPortalLoading={isPortalLoading}
              isSignOutLoading={isSignOutLoading}
              onOpenSettings={() => navigateToPage(AppPage.Settings)}
              onManageSubscription={handleManageSubscription}
              onSignOut={handleSignOut}
            />
          )
        : null}

      <Toaster
        className="sonner-close-top-right app-toaster-theme"
        position={isMobile ? 'bottom-center' : 'top-right'}
        toastOptions={{
          classNames: {
            toast: 'app-toast',
            title: 'app-toast-title',
            description: 'app-toast-description',
            actionButton: 'app-toast-action-button',
            closeButton: 'app-toast-close-button',
          },
        }}
        closeButton
      />
    </div>
  )
}

export default App
