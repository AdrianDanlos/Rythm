import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import classNames from 'classnames'
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
import { StreakCelebration } from './components/StreakCelebration'
import { BadgeCelebration } from './components/BadgeCelebration'
import { AppSidePanel } from './components/AppSidePanel'
import { applySupabaseSessionFromAuthUrl } from './lib/authDeepLink'
import { hasSupabaseAuthCallbackPayload } from './lib/authCallbackUrl'
import { useAuth } from './hooks/useAuth'
import { useAuthActions } from './hooks/useAuthActions'
import { useBillingActions } from './billing/shared/useBillingActions'
import { useBillingState } from './hooks/useBillingState'
import { useSettingsSync } from './hooks/useSettingsSync'
import { useAppShell } from './hooks/useAppShell'
import { useEntries } from './hooks/useEntries'
import { useLogForm } from './hooks/useLogForm'
import { Privacy } from './billing/legal/Privacy'
import { DeleteAccountPage } from './billing/legal/DeleteAccountPage'
import { checkForAndroidUpdate } from './lib/appUpdate'
import { isPrivacyPage, isDeleteAccountPage } from './billing/legal/routes'
import {
  AppPage,
  getInsightsSectionForPage,
  getPageFromPathname,
  getPathForPage,
  getTabForPage,
} from './lib/appTabs'
import { moodColors } from './lib/colors'
import { KO_FI_URL, PLAY_STORE_APP_URL } from './lib/constants'
import { openExternalUrl } from './lib/openExternalUrl'
import { DAILY_REMINDER_ID } from './lib/notifications'
import { Toaster } from 'sonner'
import './App.css'
import { needsEmailVerification } from './lib/authEmailVerification'
import { getDefaultPageForUser, getReturningUserStorageKey, isReturningUser } from './lib/returningUser'
import { CLOSE_TRANSIENT_PANELS_EVENT } from './lib/appEvents'
import { useDailyReminderPostSave } from './hooks/useDailyReminderPostSave'
import { useAndroidBackButton } from './hooks/useAndroidBackButton'
import { requestOpenLogCarouselAtMood } from './hooks/useScrollToLogDailyEventsOnMount'
import { useTagColors } from './hooks/useTagColors'
import { useAppMenuPanelGestures } from './hooks/useAppMenuPanelGestures'
import type { Badge } from './lib/types/stats'

function App() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname
  const showPrivacyPage = isPrivacyPage(pathname)
  const showDeleteAccountPage = isDeleteAccountPage(pathname)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [authEmailFlow, setAuthEmailFlow] = useState<'credentials' | 'forgot' | 'verifyPending'>('credentials')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const isNativeApp = Capacitor.isNativePlatform()
  const {
    session,
    authLoading,
    authInitialized,
    passwordRecoveryPending,
    signIn,
    signUp,
    resetPasswordForEmail,
    completePasswordRecovery,
    signInAnonymously,
    signOut,
    refreshSession,
    resendVerificationEmail,
    setAuthError,
  } = useAuth()

  const handleResendVerificationEmail = useCallback(() => {
    void resendVerificationEmail(authEmail.trim())
  }, [authEmail, resendVerificationEmail])

  const handleResendSessionVerificationEmail = useCallback(() => {
    const email = session?.user?.email?.trim()
    if (email) {
      void resendVerificationEmail(email)
    }
  }, [session?.user?.email, resendVerificationEmail])

  const handleBackFromVerifyPending = useCallback(() => {
    setAuthEmailFlow('credentials')
    setAuthMode('signin')
  }, [])

  useEffect(() => {
    if (session) {
      return
    }
    setAuthEmailFlow('credentials')
    setAuthMode('signin')
  }, [session])

  const sessionBlocksForUnverifiedEmail = needsEmailVerification(session)

  const toggleAuthMode = useCallback(() => {
    setAuthEmailFlow('credentials')
    setAuthMode(mode => (mode === 'signin' ? 'signup' : 'signin'))
  }, [])

  const [exportError, setExportError] = useState<string | null>(null)
  const [isPortalLoading, setIsPortalLoading] = useState(false)
  const [isSignOutLoading, setIsSignOutLoading] = useState(false)
  const [isIntroVisible, setIsIntroVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== 'undefined'
      && !window.matchMedia('(min-width: 768px)').matches,
  )
  const [isMenuPanelOpen, setIsMenuPanelOpen] = useState(false)
  const [isStreakCelebrationOpen, setIsStreakCelebrationOpen] = useState(false)
  const [streakCelebrationDays, setStreakCelebrationDays] = useState<number>(3)
  const [isBadgeCelebrationOpen, setIsBadgeCelebrationOpen] = useState(false)
  const [badgeCelebration, setBadgeCelebration] = useState<Badge | null>(null)

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

  const { handleEntrySavedForToday, shouldSuppressPostSaveToast } = useDailyReminderPostSave(
    navigateToPage,
    goToInsightsSummary,
  )

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
  /** Previous path for "scroll to top on navigation" (skip /events <-> /events/edit). */
  const prevPathnameForScrollToTopRef = useRef<string | null>(null)
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
    playIntroOfferConsumed,
  } = billing

  const nativeLoginChromeActive = passwordRecoveryPending
    || sessionBlocksForUnverifiedEmail
    || (!session && !isIntroVisible)

  const settings = useSettingsSync(session, { nativeLoginChromeActive })
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

  const {
    tagColors,
    ensureTagColorForTag,
    handleTagColorChange,
    handleTagColorReset,
    handleRenameTag,
  } = useTagColors(session?.user?.id, entries, setEntries)

  const [firstEntrySaveSignal, setFirstEntrySaveSignal] = useState(0)
  const [isFirstEntryTipActive, setIsFirstEntryTipActive] = useState(false)
  const handleFirstEntryCreated = useCallback(() => {
    setIsFirstEntryTipActive(true)
    setFirstEntrySaveSignal((n) => {
      return n + 1
    })
  }, [])
  const handleFirstEntryTipSignalConsumed = useCallback(() => {
    setFirstEntrySaveSignal(0)
  }, [])
  const handleFirstEntryTipContinueToSummary = useCallback(() => {
    setIsFirstEntryTipActive(false)
    goToInsightsSummary()
  }, [goToInsightsSummary])

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
    onStreakReached: (streakDays) => {
      setStreakCelebrationDays(streakDays)
      setIsStreakCelebrationOpen(true)
    },
    onBadgeMilestoneReached: (badge) => {
      if (isStreakCelebrationOpen) return
      setBadgeCelebration(badge)
      setIsBadgeCelebrationOpen(true)
    },
    shouldSuppressPostSaveToast,
    onEntrySavedForToday: handleEntrySavedForToday,
    onFirstEntryCreated: handleFirstEntryCreated,
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

  const goToLogForToday = useCallback(
    (options?: { openAtMood?: boolean }) => {
      if (options?.openAtMood) {
        requestOpenLogCarouselAtMood()
      }
      if (formatLocalDate(selectedDate) === today) {
        navigateToPage(AppPage.Log)
        return
      }
      void handleSave(
        { preventDefault: () => {} } as FormEvent<HTMLFormElement>,
        { silent: true },
      ).then(() => {
        setEntryDate(today)
        navigateToPage(AppPage.Log)
      })
    },
    [formatLocalDate, handleSave, navigateToPage, selectedDate, setEntryDate, today],
  )

  useAndroidBackButton({
    isNativeApp,
    isFeedbackOpen,
    closeFeedback,
    activePage,
    closePaywall,
    isStreakOpen,
    closeStreak,
    canGoBackInApp,
    runSaveBeforeLeavingTab,
    goBackInApp,
  })

  const {
    handleAuth,
    handleGoogleSignIn,
    handleTryWithoutAccount,
    handleForgotPassword,
    handleSetNewPassword,
  } = useAuthActions({
    session,
    authMode,
    authEmail,
    authPassword,
    signIn,
    signUp,
    resetPasswordForEmail,
    completePasswordRecovery,
    signInAnonymously,
    setAuthError,
    onSignupAwaitingEmailConfirmation: () => {
      setAuthEmailFlow('verifyPending')
    },
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
    currentUserId: session?.user?.id,
  })

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)')
    const handler = () => setIsMobile(!mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Capacitor: set session when app is opened from auth link (recovery, magic link, OAuth)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    void CapacitorApp.getLaunchUrl().then((result) => {
      if (result?.url) {
        applySupabaseSessionFromAuthUrl(result.url)
      }
    })

    const listenerPromise = CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      if (url) {
        applySupabaseSessionFromAuthUrl(url)
      }
    })
    return () => {
      void listenerPromise.then(listener => listener.remove())
    }
  }, [])

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
    if (showPrivacyPage || showDeleteAccountPage) return

    if (hasSupabaseAuthCallbackPayload(location.search, location.hash)) {
      return
    }

    if (passwordRecoveryPending) {
      return
    }

    // Avoid navigating from `/` before Supabase has restored the session: with no userId,
    // getDefaultPageForUser always picks Log, and we never re-run for `/` once stuck on /log.
    if (!authInitialized) return

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
    pathname,
    location.search,
    location.hash,
    navigate,
    userId,
    authInitialized,
    passwordRecoveryPending,
  ])

  useEffect(() => {
    if (passwordRecoveryPending) {
      return
    }
    if (!userId || showPrivacyPage || showDeleteAccountPage) {
      return
    }

    const routedPage = getPageFromPathname(pathname)
    if (!routedPage || routedPage === AppPage.Log || routedPage === AppPage.Pro) {
      return
    }

    if (!isReturningUser(userId)) {
      navigate(getPathForPage(AppPage.Log), { replace: true })
    }
  }, [userId, showPrivacyPage, showDeleteAccountPage, pathname, navigate, passwordRecoveryPending])

  useEffect(() => {
    if (showPrivacyPage || showDeleteAccountPage) return
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

  useEffect(() => {
    // Keep tab/page navigation predictable: start each page at top — except
    // Events <-> daily events edit: same sub-flow; scrolling here runs after
    // commit and yanks the document to top while the exiting view still animates.
    if (!getPageFromPathname(pathname)) {
      prevPathnameForScrollToTopRef.current = pathname
      return
    }
    const prev = prevPathnameForScrollToTopRef.current
    const eventsPath = getPathForPage(AppPage.Events)
    const editPath = getPathForPage(AppPage.EditDailyEvents)
    const isEventsToEdit
      = prev === eventsPath && pathname === editPath
    const isEditToEvents
      = prev === editPath && pathname === eventsPath
    const skipScrollToTop = isEventsToEdit || isEditToEvents
    prevPathnameForScrollToTopRef.current = pathname
    if (skipScrollToTop) {
      return
    }
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  const restoredForUserIdRef = useRef<string | null>(null)
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId || !isNativeApp || Capacitor.getPlatform() !== 'android') return
    if (restoredForUserIdRef.current === userId) return
    restoredForUserIdRef.current = userId
    void handleRestorePurchases()
  }, [session?.user?.id, isNativeApp, handleRestorePurchases])

  const refreshedBillingMetadataForUserIdRef = useRef<string | null>(null)
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) {
      refreshedBillingMetadataForUserIdRef.current = null
      return
    }
    if (activePage !== AppPage.Pro) return
    if (refreshedBillingMetadataForUserIdRef.current === userId) return

    // Billing copy (for example "Start free trial") depends on auth app_metadata.
    // Refresh once when opening Pro so CTA text reflects latest backend eligibility.
    refreshedBillingMetadataForUserIdRef.current = userId
    void refreshSession()
  }, [activePage, session?.user?.id, refreshSession])

  useEffect(() => {
    if (entries.length && exportError) {
      setExportError(null)
    }
  }, [entries.length, exportError])

  useEffect(() => {
    if (entriesLoading || entries.length === 0 || !userId) return
    try {
      window.localStorage.setItem(getReturningUserStorageKey(userId), 'true')
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

  const lockNonLogTabs = entriesSettled && entries.length === 0

  useEffect(() => {
    if (!isIntroVisible) return
    setIsMenuPanelOpen(false)
  }, [isIntroVisible])

  useEffect(() => {
    if (!lockNonLogTabs) return
    setIsMenuPanelOpen(false)
  }, [lockNonLogTabs])

  const { handleSwipeStart, handleSwipeMove, handleSwipeEnd, handleAppClick } = useAppMenuPanelGestures({
    lockNonLogTabs,
    isMenuPanelOpen,
    setIsMenuPanelOpen,
  })

  if (showDeleteAccountPage) {
    return <DeleteAccountPage />
  }
  if (showPrivacyPage) {
    return <Privacy />
  }

  return (
    <div
      className={classNames(
        'app',
        session && !passwordRecoveryPending && !sessionBlocksForUnverifiedEmail
          ? 'app-authenticated'
          : 'app-unauthenticated',
        {
          'app-native-login':
            passwordRecoveryPending
            || sessionBlocksForUnverifiedEmail
            || (!session && (!isIntroVisible || (isNativeApp && authInitialized && isIntroVisible))),
          'app-pro-page': session && activePage === AppPage.Pro,
          'app-intro': isIntroVisible,
          'app-password-recovery': passwordRecoveryPending,
        },
      )}
      onClick={handleAppClick}
      onTouchStart={handleSwipeStart}
      onTouchMove={handleSwipeMove}
      onTouchEnd={handleSwipeEnd}
    >
      {!isIntroVisible && !passwordRecoveryPending && !sessionBlocksForUnverifiedEmail
        ? (
            <AppHeader
              onOpenMenu={() =>
                setIsMenuPanelOpen((prev) => {
                  const next = !prev
                  if (next && typeof window !== 'undefined') {
                    window.dispatchEvent(new Event(CLOSE_TRANSIENT_PANELS_EVENT))
                  }
                  return next
                })}
              isMenuOpen={isMenuPanelOpen}
              isAuthenticated={!!session}
              isMenuDisabled={!!session && lockNonLogTabs}
            />
          )
        : null}

      <AppSidePanel
        isOpen={isMenuPanelOpen && !lockNonLogTabs && !passwordRecoveryPending && !sessionBlocksForUnverifiedEmail}
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
        onOpenKoFi={() => { void openExternalUrl(KO_FI_URL) }}
        onSignOut={handleSignOut}
        onSaveAccountWithGoogle={handleGoogleSignIn}
      />

      <StreakCelebration
        isVisible={isStreakCelebrationOpen}
        streakDays={streakCelebrationDays}
        onComplete={() => setIsStreakCelebrationOpen(false)}
        onDismiss={() => setIsStreakCelebrationOpen(false)}
      />
      <BadgeCelebration
        isVisible={isBadgeCelebrationOpen}
        badge={badgeCelebration}
        onComplete={() => setIsBadgeCelebrationOpen(false)}
        onDismiss={() => setIsBadgeCelebrationOpen(false)}
      />
      <StreakModal isOpen={isStreakOpen} onClose={closeStreak} />
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={closeFeedback}
        userId={session?.user?.id ?? null}
      />

      {authInitialized && session && !passwordRecoveryPending && !sessionBlocksForUnverifiedEmail && activePage === AppPage.Pro
        ? (
            <PaywallPage
              onClose={closePaywall}
              upgradeUrl={trimmedUpgradeUrl}
              onUpgrade={basePlanId => handleStartCheckout(basePlanId)}
              onRestore={handleRestorePurchases}
              showRestore={false}
              playIntroOfferConsumed={playIntroOfferConsumed}
            />
          )
        : (
            <AppMainContent
              activePage={activePage}
              authInitialized={authInitialized}
              session={session}
              isNativeApp={isNativeApp}
              passwordRecoveryPending={passwordRecoveryPending}
              onPasswordRecoverySubmit={handleSetNewPassword}
              authMode={authMode}
              toggleAuthMode={toggleAuthMode}
              authEmailFlow={authEmailFlow}
              setAuthEmailFlow={setAuthEmailFlow}
              onResendVerificationEmail={handleResendVerificationEmail}
              onResendSessionVerificationEmail={handleResendSessionVerificationEmail}
              onBackFromVerifyPending={handleBackFromVerifyPending}
              onVerificationSignOut={handleSignOut}
              authEmail={authEmail}
              authPassword={authPassword}
              authLoading={authLoading}
              onAuth={handleAuth}
              onGoogleSignIn={handleGoogleSignIn}
              onTryWithoutAccount={handleTryWithoutAccount}
              onForgotSubmit={handleForgotPassword}
              onEmailChange={setAuthEmail}
              onPasswordChange={setAuthPassword}
              activeTab={activeTab}
              onNavigateToPage={navigateToPage}
              activeInsightsTab={activeInsightsTab}
              onGoToTimeline={() => navigateToPage(AppPage.Timeline)}
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
              formatLocalDate={formatLocalDate}
              onEntryDateChange={handleEntryDateChange}
              onGoToLogForToday={goToLogForToday}
              onSleepHoursChange={setSleepHours}
              onMoodChange={setMood}
              onNoteChange={setNote}
              onTagsChange={setTags}
              onSave={handleSave}
              firstEntrySaveSignal={firstEntrySaveSignal}
              isFirstEntryTipActive={isFirstEntryTipActive}
              onFirstEntryTipSignalConsumed={handleFirstEntryTipSignalConsumed}
              onFirstEntryTipContinueToSummary={handleFirstEntryTipContinueToSummary}
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
              onTagColorReset={handleTagColorReset}
              onEnsureTagColor={ensureTagColorForTag}
              onIntroVisibilityChange={setIsIntroVisible}
              lockNonLogTabs={lockNonLogTabs}
              today={today}
            />
          )}

      {authInitialized && session && !passwordRecoveryPending && !sessionBlocksForUnverifiedEmail && activePage !== AppPage.Pro
        ? (
            <AppBottomNav
              session={session}
              activePage={activePage}
              activeTab={activeTab}
              activeInsightsTab={activeInsightsTab}
              lockNonLogTabs={lockNonLogTabs}
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
