import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { fetchEntries, type Entry, upsertEntry } from './lib/entries'
import { buildStats } from './lib/stats'
import { exportMonthlyReport } from './lib/reports'
import { exportEntriesCsv } from './lib/utils/csvExport'
import { formatLocalDate } from './lib/utils/dateFormatters'
import { calculateAverages } from './lib/utils/averages'
import { parseTags } from './lib/utils/stringUtils'
import { AuthForm } from './components/AuthForm'
import { LogForm } from './components/LogForm'
import { Insights } from './components/Insights'
import { PaywallModal } from './components/PaywallModal'
import { FeedbackModal } from './components/FeedbackModal.tsx'
import { Tooltip } from './components/Tooltip'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './hooks/useAuth'
import { CreditCard, LogOut, Mail } from 'lucide-react'
import logo from './assets/rythm-logo.png'
import { StripeLanding } from './components/StripeLanding.tsx'
import { ROUTES, isStripeLanding, isStripeReturn } from './lib/routes'
import './App.css'

enum Tabs {
  Insights = 'insights',
  Log = 'log',
}

type TabKey = typeof Tabs[keyof typeof Tabs]

function App() {
  const showStripeLanding = isStripeLanding()
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authMessage, setAuthMessage] = useState<string | null>(null)
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

  const [entries, setEntries] = useState<Entry[]>([])
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [entriesError, setEntriesError] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  const todayDate = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])
  const today = useMemo(() => formatLocalDate(todayDate), [todayDate])
  const [entryDate, setEntryDate] = useState(today)
  const [sleepHours, setSleepHours] = useState('')
  const [mood, setMood] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>(Tabs.Insights)
  const [isPaywallOpen, setIsPaywallOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [isPortalLoading, setIsPortalLoading] = useState(false)

  const moodColors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e']
  const sleepThreshold = 8
  const isPro = Boolean(session?.user?.app_metadata?.is_pro)
  const canManageSubscription = isPro
    && Boolean(session?.user?.app_metadata?.stripe_customer_id)
  const upgradeUrl = import.meta.env.VITE_UPGRADE_URL as string | undefined
  const trimmedUpgradeUrl = upgradeUrl?.trim()
  const priceLabel = import.meta.env.VITE_PRO_PRICE_LABEL as string | undefined
  const trimmedPriceLabel = priceLabel?.trim()

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
    const path = window.location.pathname
    if (!isStripeReturn(path)) return

    if (path === ROUTES.stripeSuccess) {
      void refreshSession()
    }

    window.history.replaceState({}, '', '/')
  }, [refreshSession])

  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) {
      setEntries([])
      return
    }

    const loadEntries = async () => {
      setEntriesLoading(true)
      setEntriesError(null)
      try {
        const data = await fetchEntries(userId)
        setEntries(data)
      }
      catch {
        setEntriesError('Unable to load entries.')
      }
      finally {
        setEntriesLoading(false)
      }
    }

    loadEntries()
  }, [session?.user?.id])

  useEffect(() => {
    const existing = entries.find(item => item.entry_date === entryDate)
    if (existing) {
      setSleepHours(String(existing.sleep_hours))
      setMood(existing.mood)
      setNote(existing.note ?? '')
      setTags(existing.tags?.join(', ') ?? '')
      return
    }

    setSleepHours('')
    setMood(null)
    setNote('')
    setTags('')
  }, [entryDate, entries])

  useEffect(() => {
    if (entries.length && exportError) {
      setExportError(null)
    }
  }, [entries.length, exportError])

  const chartData = useMemo(
    () =>
      entries.map(entry => ({
        ...entry,
        sleep_hours: Number(entry.sleep_hours),
        mood: Number(entry.mood),
      })),
    [entries],
  )

  const averages = useMemo(() => calculateAverages(entries), [entries])

  const highlightedDates = useMemo(() => {
    const uniqueDates = new Map<string, Date>()
    entries.forEach((entry) => {
      const date = new Date(`${entry.entry_date}T00:00:00`)
      date.setHours(0, 0, 0, 0)
      uniqueDates.set(entry.entry_date, date)
    })
    return Array.from(uniqueDates.values())
  }, [entries])

  const selectedDate = useMemo(
    () => new Date(`${entryDate}T00:00:00`),
    [entryDate],
  )

  const stats = useMemo(
    () => buildStats(entries, sleepThreshold, formatLocalDate),
    [entries, sleepThreshold],
  )

  const handleAuth = async (event: FormEvent) => {
    event.preventDefault()
    setAuthError(null)
    setAuthMessage(null)

    try {
      if (authMode === 'signup') {
        const { error } = await signUp(authEmail, authPassword)
        if (error) throw error
        setAuthMessage('Check your email to confirm your account.')
      }
      else {
        const { error } = await signIn(authEmail, authPassword)
        if (error) throw error
      }
    }
    catch {
      setAuthError('Unable to authenticate. Check your details.')
    }
  }

  const handleGoogleSignIn = async () => {
    setAuthError(null)
    setAuthMessage(null)
    const redirectTo = Capacitor.isNativePlatform()
      ? 'capacitor://localhost'
      : window.location.origin
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    })
    if (error) {
      setAuthError('Unable to start Google sign-in.')
    }
  }

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()
    if (!session?.user?.id) return

    if (entryDate > today) {
      setEntriesError('You cannot log entries in the future.')
      setSaved(false)
      return
    }

    const parsedSleep = Number(sleepHours)
    if (!Number.isFinite(parsedSleep) || parsedSleep < 0 || parsedSleep > 12) {
      setEntriesError('Sleep hours must be between 0 and 12.')
      setSaved(false)
      return
    }
    if (!mood) {
      setEntriesError('Select a mood rating.')
      setSaved(false)
      return
    }

    setSaving(true)
    setEntriesError(null)
    try {
      const tagList = isPro ? parseTags(tags) : []
      const saved = await upsertEntry({
        user_id: session.user.id,
        entry_date: entryDate,
        sleep_hours: parsedSleep,
        mood,
        note: note.trim() ? note.trim() : null,
        ...(isPro ? { tags: tagList.length ? tagList : null } : {}),
      })

      setEntries((prev) => {
        const filtered = prev.filter(item => item.entry_date !== entryDate)
        return [...filtered, saved].sort((a, b) =>
          a.entry_date.localeCompare(b.entry_date),
        )
      })
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2000)
    }
    catch {
      setEntriesError('Unable to save entry.')
      setSaved(false)
    }
    finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
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
      setExportError('Add at least one entry to export.')
      return
    }
    if (!isPro) return
    setExportError(null)
    try {
      await exportMonthlyReport(entries, stats, { title: 'Rythm Report' })
    }
    catch {
      setExportError('Unable to export report.')
    }
  }

  const handleOpenPaywall = () => {
    setIsPaywallOpen(true)
  }

  const handleClosePaywall = () => {
    setIsPaywallOpen(false)
  }

  const handleOpenFeedback = () => {
    setIsFeedbackOpen(true)
  }

  const handleCloseFeedback = () => {
    setIsFeedbackOpen(false)
  }

  const handleStartCheckout = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        'create-checkout-session',
        { body: {} },
      )
      if (error) {
        throw error
      }
      const checkoutUrl = data?.url as string | undefined
      if (checkoutUrl) {
        window.location.href = checkoutUrl
        return
      }
    }
    catch {
      // Fall back to static upgrade URL if configured.
    }

    if (trimmedUpgradeUrl) {
      window.open(trimmedUpgradeUrl, '_blank', 'noreferrer')
    }
  }

  const handleManageSubscription = async () => {
    if (isPortalLoading) return
    setIsPortalLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke(
        'create-portal-session',
        { body: {} },
      )
      if (error) {
        throw error
      }
      const portalUrl = data?.url as string | undefined
      if (portalUrl) {
        window.location.href = portalUrl
        return
      }
      throw new Error('Missing portal URL.')
    }
    catch {
      window.alert('Unable to open subscription management.')
    }
    finally {
      setIsPortalLoading(false)
    }
  }

  if (showStripeLanding) {
    return <StripeLanding logo={logo} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <img className="app-logo" src={logo} alt="Rythm logo" />
          <div>
            <p className="eyebrow">Sleep &amp; Mood</p>
            <h1>Rythm</h1>
          </div>
        </div>
        <div className="header-actions">

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

          {session
            ? (
                <>
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
                      aria-label="Sign out"
                    >
                      <LogOut className="icon" aria-hidden="true" />
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
        priceLabel={trimmedPriceLabel}
      />
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={handleCloseFeedback}
        userEmail={session?.user?.email ?? null}
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
                  authMessage={authMessage}
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
                  <div className="tabs">
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
                        <LogForm
                          selectedDate={selectedDate}
                          todayDate={todayDate}
                          highlightedDates={highlightedDates}
                          sleepHours={sleepHours}
                          mood={mood}
                          note={note}
                          tags={tags}
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
                          streak={stats.streak}
                          sleepConsistencyLabel={stats.sleepConsistencyLabel}
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
                          tagInsights={stats.tagInsights}
                          isPro={isPro}
                          exportError={exportError}
                          onExportCsv={handleExportCsv}
                          onExportMonthlyReport={handleExportMonthlyReport}
                          onOpenPaywall={handleOpenPaywall}
                        />
                      )}
                </>
              )}
    </div>
  )
}

export default App
