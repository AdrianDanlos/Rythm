import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import type { Entry } from './lib/entries'
import { exportMonthlyReport } from './lib/reports'
import { exportEntriesCsv } from './lib/utils/csvExport'
import { formatLocalDate } from './lib/utils/dateFormatters'
import { AuthForm } from './components/AuthForm'
import { LogForm } from './components/LogForm'
import { Insights } from './components/Insights'
import { PaywallModal } from './billing/shared/PaywallModal'
import { FeedbackModal } from './components/FeedbackModal.tsx'
import { StreakModal } from './components/StreakModal'
import { Tooltip } from './components/Tooltip'
import { SettingsModal } from './components/SettingsModal'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './hooks/useAuth'
import { useAuthActions } from './hooks/useAuthActions'
import { useBillingActions } from './billing/shared/useBillingActions'
import { useEntries } from './hooks/useEntries'
import { useLogForm } from './hooks/useLogForm'
import { CreditCard, LogOut, Mail, Settings } from 'lucide-react'
import logo from './assets/rythm-logo.png'
import { StripeLanding } from './billing/stripe/StripeLanding'
import { ROUTES, isStripeLanding, isStripeReturn } from './billing/stripe/routes'
import { PRICING } from './billing/shared/pricing'
import { moodColors } from './lib/colors'
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
} from './lib/settings'
import { Toaster } from 'sonner'
import './App.css'

enum Tabs {
  Insights = 'insights',
  Log = 'log',
  Summary = 'summary',
  Charts = 'charts',
  Data = 'data',
}

type TabKey = Tabs.Insights | Tabs.Log
type InsightsSection = Tabs.Summary | Tabs.Charts | Tabs.Data

function App() {
  const showStripeLanding = isStripeLanding()
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const isNativeApp = Capacitor.isNativePlatform()
  const {
    session,
    authLoading,
    authError,
    authInitialized,
    signIn,
    signUp,
    signOut,
    refreshSession,
    setAuthError,
  } = useAuth()

  const [exportError, setExportError] = useState<string | null>(null)

  const todayDate = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])
  const today = useMemo(() => formatLocalDate(todayDate), [todayDate])
  const [activeTab, setActiveTab] = useState<TabKey>(Tabs.Insights)
  const [activeInsightsTab, setActiveInsightsTab] = useState<InsightsSection>(Tabs.Summary)
  const [isStreakOpen, setIsStreakOpen] = useState(false)
  const [isPaywallOpen, setIsPaywallOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isPortalLoading, setIsPortalLoading] = useState(false)
  const [isSignOutLoading, setIsSignOutLoading] = useState(false)
  const [dateFormat, setDateFormat] = useState<DateFormatPreference>(
    () => getStoredDateFormat(),
  )
  const [theme, setTheme] = useState<ThemePreference>(() => getStoredTheme())
  const [profileName, setProfileName] = useState('')
  const [sleepTarget, setSleepTarget] = useState(() => getStoredPersonalSleepTarget())
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && !window.matchMedia('(min-width: 768px)').matches,
  )

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)')
    const handler = () => setIsMobile(!mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  const sleepThreshold = sleepTarget
  const maxTagsPerEntry = 10
  const isPro = Boolean(session?.user?.app_metadata?.is_pro)
  const subscriptionSource = session?.user?.app_metadata?.subscription_source === 'play'
    ? 'play'
    : (session?.user?.app_metadata?.subscription_source === 'stripe'
      || session?.user?.app_metadata?.stripe_customer_id
        ? 'stripe'
        : undefined)
  const canManageSubscription = isPro
    && (Boolean(session?.user?.app_metadata?.stripe_customer_id)
      || session?.user?.app_metadata?.subscription_source === 'play'
      || session?.user?.app_metadata?.subscription_source === 'stripe')
  const upgradeUrl = import.meta.env.VITE_UPGRADE_URL as string | undefined
  const trimmedUpgradeUrl = upgradeUrl?.trim()
  const priceLabel = PRICING.pro.priceLabel

  const handleEntriesLoaded = useCallback((data: Entry[]) => {
    if (data.length) {
      setActiveTab(Tabs.Insights)
    }
  }, [])

  const {
    entries,
    setEntries,
    entriesLoading,
    entriesError,
    setEntriesError,
    chartData,
    averages,
    highlightedDates,
    stats,
  } = useEntries({
    userId: session?.user?.id,
    sleepThreshold,
    formatLocalDate,
    onEntriesLoaded: handleEntriesLoaded,
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
    onStreakReached: () => setIsStreakOpen(true),
    onEntrySavedForToday: () => {
      setActiveTab(Tabs.Insights)
      setActiveInsightsTab(Tabs.Summary)
    },
  })

  const { handleAuth, handleGoogleSignIn } = useAuthActions({
    authMode,
    authEmail,
    authPassword,
    signIn,
    signUp,
    setAuthError,
  })

  const { handleStartCheckout, handleManageSubscription, handleRestorePurchases } = useBillingActions({
    trimmedUpgradeUrl,
    isPortalLoading,
    setIsPortalLoading,
    subscriptionSource,
    refreshSession,
  })

  // This is needed for the Android app to work.
  // It is used to set the session token when the app is opened from a link.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const listenerPromise = CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      const fragment = url?.split('#')[1] ?? ''
      const params = new URLSearchParams(fragment)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      if (accessToken && refreshToken) {
        void supabase.auth
          .setSession({ access_token: accessToken, refresh_token: refreshToken })
      }
    })

    return () => {
      void listenerPromise.then(listener => listener.remove())
    }
  }, [])

  useEffect(() => {
    const storedDateFormat = getStoredDateFormat()
    setDateFormat(storedDateFormat)

    const storedName = getStoredProfileName()
    setProfileName(storedName)

    const storedSleepTarget = getStoredPersonalSleepTarget()
    setSleepTarget(storedSleepTarget)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    setStoredTheme(theme)
  }, [theme])

  useEffect(() => {
    const storedName = getStoredProfileName()
    if (storedName) {
      setProfileName(storedName)
      return
    }
    const fallbackName = session?.user?.user_metadata?.full_name
      ?? session?.user?.user_metadata?.name
      ?? ''
    setProfileName(fallbackName)
  }, [
    session?.user?.id,
    session?.user?.user_metadata?.full_name,
    session?.user?.user_metadata?.name,
  ])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [activeTab, activeInsightsTab])

  useEffect(() => {
    const path = window.location.pathname
    if (!isStripeReturn(path)) return

    if (path === ROUTES.stripeSuccess) {
      void refreshSession()
    }

    window.history.replaceState({}, '', '/')
  }, [refreshSession])

  // Restore Play purchases on Android when user is logged in (e.g. after reinstall).
  const restoredForUserIdRef = useRef<string | null>(null)
  useEffect(() => {
    const userId = session?.user?.id
    if (
      !userId
      || !isNativeApp
      || Capacitor.getPlatform() !== 'android'
    ) return
    if (restoredForUserIdRef.current === userId) return
    restoredForUserIdRef.current = userId
    void handleRestorePurchases()
  }, [session?.user?.id, handleRestorePurchases])

  useEffect(() => {
    if (entries.length && exportError) {
      setExportError(null)
    }
  }, [entries.length, exportError])

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
      setExportError('Add at least one entry to export.')
      return
    }
    setExportError(null)
    try {
      await exportEntriesCsv(entries)
    }
    catch {
      setExportError('Unable to export CSV.')
    }
  }

  const handleExportMonthlyReport = async () => {
    if (!entries.length) {
      setExportError(null)
      if (!isPro) {
        setIsPaywallOpen(true)
        return
      }
      setExportError('Add at least one entry to export.')
      return
    }
    if (!isPro) return
    setExportError(null)
    try {
      await exportMonthlyReport(entries, stats, {
        title: 'Rythm Report',
        profileName,
      })
    }
    catch {
      setExportError('Unable to export report.')
    }
  }

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

  const handleOpenPaywall = () => {
    setIsPaywallOpen(true)
  }

  const handleCloseStreak = () => {
    setIsStreakOpen(false)
  }

  const handleClosePaywall = () => {
    setIsPaywallOpen(false)
  }

  const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.rythm.app'
  const handleOpenFeedback = () => {
    setIsFeedbackOpen(true)
  }

  const handleCloseFeedback = () => {
    setIsFeedbackOpen(false)
  }

  const handleOpenSettings = () => {
    setIsSettingsOpen(true)
  }

  const handleCloseSettings = () => {
    setIsSettingsOpen(false)
  }

  if (showStripeLanding) {
    return <StripeLanding logo={logo} />
  }

  return (
    <div className={`app ${session ? 'app-authenticated' : 'app-unauthenticated'}`}>
      <header className="app-header">
        <a className="app-brand" href={playStoreUrl} target="_blank" rel="noreferrer">
          <img className="app-logo" src={logo} alt="Rythm logo" />
          <div>
            <p className="eyebrow">Sleep &amp; Mood</p>
            <h1>Rythm</h1>
          </div>
        </a>
        <div className="header-actions">
          {session
            ? (
                <>
                  <Tooltip label="Settings">
                    <button
                      className="ghost icon-button"
                      type="button"
                      onClick={handleOpenSettings}
                      aria-label="Settings"
                    >
                      <Settings className="icon" aria-hidden="true" />
                    </button>
                  </Tooltip>

                  <Tooltip label="Send feedback">
                    <button
                      className="ghost icon-button"
                      type="button"
                      onClick={handleOpenFeedback}
                      aria-label="Send feedback"
                    >
                      <Mail className="icon" aria-hidden="true" />
                    </button>
                  </Tooltip>

                  {canManageSubscription
                    ? (
                        <Tooltip label="Manage subscription">
                          <button
                            className="ghost icon-button"
                            type="button"
                            onClick={handleManageSubscription}
                            aria-label="Manage subscription"
                            disabled={isPortalLoading}
                          >
                            <CreditCard className="icon" aria-hidden="true" />
                          </button>
                        </Tooltip>
                      )
                    : null}
                  <Tooltip label="Sign out">
                    <button
                      className="ghost icon-button"
                      onClick={handleSignOut}
                      type="button"
                      aria-label={isSignOutLoading ? 'Signing out' : 'Sign out'}
                      aria-busy={isSignOutLoading}
                      disabled={isSignOutLoading}
                    >
                      {isSignOutLoading
                        ? <span className="spinner" aria-hidden="true" />
                        : <LogOut className="icon" aria-hidden="true" />}
                    </button>
                  </Tooltip>
                </>
              )
            : null}
        </div>
      </header>

      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={handleClosePaywall}
        upgradeUrl={trimmedUpgradeUrl}
        onUpgrade={handleStartCheckout}
        priceLabel={priceLabel}
        onRestore={handleRestorePurchases}
        showRestore={isNativeApp && Capacitor.getPlatform() === 'android'}
      />
      <StreakModal
        isOpen={isStreakOpen}
        onClose={handleCloseStreak}
      />
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={handleCloseFeedback}
        userEmail={session?.user?.email ?? null}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
        name={profileName}
        email={session?.user?.email ?? ''}
        dateFormat={dateFormat}
        theme={theme}
        personalSleepTarget={sleepTarget}
        onNameChange={handleProfileNameChange}
        onDateFormatChange={handleDateFormatChange}
        onThemeChange={handleThemeChange}
        onPersonalSleepTargetChange={handleSleepTargetChange}
      />

      {!authInitialized
        ? (
            <div className="card auth-loading" aria-live="polite">
              <h2 className="auth-title">Loading your account</h2>
              <div className="loading-row">
                <span className="loading-spinner" aria-hidden="true" />
                <span className="muted">Checking your session...</span>
              </div>
            </div>
          )
        : !session
            ? (
                <AuthForm
                  authMode={authMode}
                  authEmail={authEmail}
                  authPassword={authPassword}
                  authLoading={authLoading}
                  authError={authError}
                  showEmailPassword={!isNativeApp}
                  onEmailChange={setAuthEmail}
                  onPasswordChange={setAuthPassword}
                  onSubmit={handleAuth}
                  onGoogleSignIn={handleGoogleSignIn}
                  onToggleMode={() =>
                    setAuthMode(mode => (mode === 'signin' ? 'signup' : 'signin'))}
                />
              )
            : (
                <>
                  <div className="tabs primary-tabs">
                    <button
                      type="button"
                      className={`tab-button ${activeTab === Tabs.Insights ? 'active' : ''}`}
                      onClick={() => setActiveTab(Tabs.Insights)}
                    >
                      Insights
                    </button>
                    <button
                      type="button"
                      className={`tab-button ${activeTab === Tabs.Log ? 'active' : ''}`}
                      onClick={() => setActiveTab(Tabs.Log)}
                    >
                      Log
                    </button>
                  </div>

                  {activeTab === Tabs.Log
                    ? (
                        <p className="helper">
                          Log your sleep hours, mood, and other variables in the tags section to spot patterns over time.
                        </p>
                      )
                    : null}

                  {activeTab === Tabs.Log
                    ? (
                        <LogForm
                          selectedDate={selectedDate}
                          todayDate={todayDate}
                          highlightedDates={highlightedDates}
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
                          isPro={isPro}
                          formatLocalDate={formatLocalDate}
                          onEntryDateChange={setEntryDate}
                          onSleepHoursChange={setSleepHours}
                          onMoodChange={setMood}
                          onNoteChange={setNote}
                          onTagsChange={setTags}
                          onSave={handleSave}
                          onOpenPaywall={handleOpenPaywall}
                        />
                      )
                    : (
                        <Insights
                          entries={entries}
                          entriesLoading={entriesLoading}
                          chartData={chartData}
                          averages={averages}
                          windowAverages={stats.windowAverages}
                          rhythmScore={stats.rhythmScore}
                          streak={stats.streak}
                          sleepConsistencyLabel={stats.sleepConsistencyLabel}
                          sleepConsistencyBadges={stats.sleepConsistencyBadges}
                          correlationLabel={stats.correlationLabel}
                          correlationDirection={stats.correlationDirection}
                          moodBySleepThreshold={stats.moodBySleepThreshold}
                          sleepThreshold={sleepThreshold}
                          moodColors={moodColors}
                          trendSeries={stats.trendSeries}
                          rollingSeries={stats.rollingSeries}
                          rollingSummaries={stats.rollingSummaries}
                          personalSleepThreshold={stats.personalSleepThreshold}
                          moodByPersonalThreshold={stats.moodByPersonalThreshold}
                          tagDrivers={stats.tagDrivers}
                          isPro={isPro}
                          exportError={exportError}
                          onExportCsv={handleExportCsv}
                          onExportMonthlyReport={handleExportMonthlyReport}
                          onOpenPaywall={handleOpenPaywall}
                          goToLog={() => setActiveTab(Tabs.Log)}
                          activeTab={activeInsightsTab}
                        />
                      )}

                </>
              )}

      {authInitialized
        ? (
            <div className="insights-bottom-nav">
              <a className="app-brand nav-brand" href={playStoreUrl} target="_blank" rel="noreferrer">
                <img className="app-logo" src={logo} alt="Rythm logo" />
                <div>
                  <p className="eyebrow">Sleep &amp; Mood</p>
                  <h1>Rythm</h1>
                </div>
              </a>
              {session
                ? (
                    <div className="nav-center">
                      <div className="tabs insights-bottom-nav__tabs" role="tablist" aria-label="Insights navigation">
                        <button
                          type="button"
                          className={`tab-button ${activeTab === Tabs.Insights && activeInsightsTab === Tabs.Summary ? 'active' : ''}`}
                          onClick={() => {
                            setActiveTab(Tabs.Insights)
                            setActiveInsightsTab(Tabs.Summary)
                          }}
                        >
                          <span className="tab-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <rect x="3" y="4" width="18" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
                              <path d="M7 9h10M7 13h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </span>
                          <span>Summary</span>
                        </button>
                        <button
                          type="button"
                          className={`tab-button ${activeTab === Tabs.Insights && activeInsightsTab === Tabs.Charts ? 'active' : ''}`}
                          onClick={() => {
                            setActiveTab(Tabs.Insights)
                            setActiveInsightsTab(Tabs.Charts)
                          }}
                        >
                          <span className="tab-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path
                                d="M4 18h16M6 16l4-6 4 3 4-7"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <circle cx="6" cy="16" r="1.5" fill="currentColor" />
                              <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                              <circle cx="14" cy="13" r="1.5" fill="currentColor" />
                              <circle cx="18" cy="6" r="1.5" fill="currentColor" />
                            </svg>
                          </span>
                          <span>Charts</span>
                        </button>
                        <button
                          type="button"
                          className={`tab-button ${activeTab === Tabs.Log ? 'active' : ''}`}
                          onClick={() => setActiveTab(Tabs.Log)}
                        >
                          <span className="tab-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path
                                d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <path d="M8 9h8M8 13h8M8 17h5" fill="none" stroke="currentColor" strokeWidth="2" />
                            </svg>
                          </span>
                          <span>Log</span>
                        </button>
                        <button
                          type="button"
                          className={`tab-button ${activeTab === Tabs.Insights && activeInsightsTab === Tabs.Data ? 'active' : ''}`}
                          onClick={() => {
                            setActiveTab(Tabs.Insights)
                            setActiveInsightsTab(Tabs.Data)
                          }}
                        >
                          <span className="tab-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <ellipse cx="12" cy="5.5" rx="7" ry="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
                              <path
                                d="M5 5.5v6.5c0 1.9 3.1 3.5 7 3.5s7-1.6 7-3.5V5.5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <path
                                d="M5 12v6.5c0 1.9 3.1 3.5 7 3.5s7-1.6 7-3.5V12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                            </svg>
                          </span>
                          <span>Export</span>
                        </button>
                      </div>
                      <div className="nav-actions" aria-label="Account actions">
                        <Tooltip label="Settings">
                          <button
                            className="ghost icon-button"
                            type="button"
                            onClick={handleOpenSettings}
                            aria-label="Settings"
                          >
                            <Settings className="icon" aria-hidden="true" />
                          </button>
                        </Tooltip>

                        <Tooltip label="Send feedback">
                          <button
                            className="ghost icon-button"
                            type="button"
                            onClick={handleOpenFeedback}
                            aria-label="Send feedback"
                          >
                            <Mail className="icon" aria-hidden="true" />
                          </button>
                        </Tooltip>

                        {canManageSubscription
                          ? (
                              <Tooltip label="Manage subscription">
                                <button
                                  className="ghost icon-button"
                                  type="button"
                                  onClick={handleManageSubscription}
                                  aria-label="Manage subscription"
                                  disabled={isPortalLoading}
                                >
                                  <CreditCard className="icon" aria-hidden="true" />
                                </button>
                              </Tooltip>
                            )
                          : null}
                        <Tooltip label="Sign out">
                          <button
                            className="ghost icon-button"
                            onClick={handleSignOut}
                            type="button"
                            aria-label={isSignOutLoading ? 'Signing out' : 'Sign out'}
                            aria-busy={isSignOutLoading}
                            disabled={isSignOutLoading}
                          >
                            {isSignOutLoading
                              ? <span className="spinner" aria-hidden="true" />
                              : <LogOut className="icon" aria-hidden="true" />}
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  )
                : null}
            </div>
          )
        : null}
      <Toaster className="sonner-close-top-right" position={isMobile ? 'bottom-center' : 'top-right'} richColors closeButton />
    </div>
  )
}

export default App
