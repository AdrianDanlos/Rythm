import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { exportMonthlyReport } from './lib/reports'
import { exportEntriesCsv } from './lib/utils/csvExport'
import { formatLocalDate } from './lib/utils/dateFormatters'
import { AppHeader } from './components/AppHeader'
import { AppMainContent } from './components/AppMainContent'
import { AppBottomNav } from './components/AppBottomNav'
import { PaywallModal } from './billing/shared/PaywallModal'
import { FeedbackModal } from './components/FeedbackModal'
import { StreakModal } from './components/StreakModal'
import { SettingsModal } from './components/SettingsModal'
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
import { moodColors } from './lib/colors'
import { STORAGE_KEYS } from './lib/storageKeys'
import { Toaster } from 'sonner'
import './App.css'

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

  const todayDate = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])
  const today = useMemo(() => formatLocalDate(todayDate), [todayDate])

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
    isPaywallOpen,
    isFeedbackOpen,
    isSettingsOpen,
    saveLogWhenLeaving,
    closeStreak,
    closePaywall,
    openFeedback,
    closeFeedback,
    openSettings,
    closeSettings,
    openPaywall,
    goToInsightsSummary,
  } = shell
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
    priceLabel,
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
    entriesError,
    setEntriesError,
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
    setEntriesError,
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
      if (isSettingsOpen) {
        closeSettings()
        return
      }
      if (isFeedbackOpen) {
        closeFeedback()
        return
      }
      if (isPaywallOpen) {
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
    isSettingsOpen,
    isFeedbackOpen,
    isPaywallOpen,
    isStreakOpen,
    closeSettings,
    closeFeedback,
    closePaywall,
    closeStreak,
    canGoBackInApp,
    runSaveBeforeLeavingTab,
    goBackInApp,
  ])

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
    navigate,
    userId,
  ])

  useEffect(() => {
    if (!userId || showPrivacyPage || showDeleteAccountPage || showStripeReturnPage) {
      return
    }

    const routedPage = getPageFromPathname(pathname)
    if (!routedPage || routedPage === AppPage.Log) {
      return
    }

    if (!isReturningUser(userId)) {
      navigate(getPathForPage(AppPage.Log), { replace: true })
    }
  }, [userId, showPrivacyPage, showDeleteAccountPage, showStripeReturnPage, pathname, navigate])

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
    if (!isPro) return
    setExportError(null)
    try {
      await exportMonthlyReport(entries, stats, {
        title: '',
        profileName,
      })
    }
    catch {
      setExportError(t('errors.unableToExportReport'))
    }
  }

  if (showDeleteAccountPage) {
    return <DeleteAccountPage />
  }
  if (showPrivacyPage) {
    return <Privacy />
  }

  return (
    <div
      className={`app ${session ? 'app-authenticated' : 'app-unauthenticated'}`}
    >
      <AppHeader
        session={session}
        canManageSubscription={canManageSubscription}
        isPortalLoading={isPortalLoading}
        isSignOutLoading={isSignOutLoading}
        onOpenSettings={openSettings}
        onManageSubscription={handleManageSubscription}
        onSignOut={handleSignOut}
      />

      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={closePaywall}
        upgradeUrl={trimmedUpgradeUrl}
        onUpgrade={handleStartCheckout}
        priceLabel={priceLabel}
        onRestore={handleRestorePurchases}
        showRestore={isNativeApp && Capacitor.getPlatform() === 'android'}
      />
      <StreakModal isOpen={isStreakOpen} onClose={closeStreak} />
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={closeFeedback}
        userEmail={session?.user?.email ?? null}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        name={profileName}
        email={session?.user?.email ?? ''}
        dateFormat={dateFormat}
        language={language}
        theme={theme}
        personalSleepTarget={sleepTarget}
        onNameChange={handleProfileNameChange}
        onDateFormatChange={handleDateFormatChange}
        onLanguageChange={handleLanguageChange}
        onThemeChange={handleThemeChange}
        onPersonalSleepTargetChange={handleSleepTargetChange}
      />

      <AppMainContent
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
        entriesError={entriesError}
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
        isPro={isPro}
        exportError={exportError}
        onExportCsv={handleExportCsv}
        onExportMonthlyReport={handleExportMonthlyReport}
        onOpenPaywall={openPaywall}
        onOpenFeedback={openFeedback}
      />

      {authInitialized
        ? (
            <AppBottomNav
              session={session}
              activeTab={activeTab}
              activeInsightsTab={activeInsightsTab}
              onNavigateToPage={navigateToPage}
              onBeforeLeaveTab={runSaveBeforeLeavingTab}
              canManageSubscription={canManageSubscription}
              isPortalLoading={isPortalLoading}
              isSignOutLoading={isSignOutLoading}
              onOpenSettings={openSettings}
              onManageSubscription={handleManageSubscription}
              onSignOut={handleSignOut}
            />
          )
        : null}

      <Toaster
        className="sonner-close-top-right"
        position={isMobile ? 'bottom-center' : 'top-right'}
        richColors
        closeButton
      />
    </div>
  )
}

export default App
