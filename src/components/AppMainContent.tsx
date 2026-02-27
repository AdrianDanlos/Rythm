import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { Session } from '@supabase/supabase-js'
import type { Entry } from '../lib/entries'
import type { SleepMoodAverages } from '../lib/types/stats'
import type { StatCounts } from '../lib/stats'
import type {
  RollingPoint,
  RollingSummary,
  Badge,
  TagDriver,
  TagSleepDriver,
  TrendPoint,
  WeekdayAveragePoint,
  WindowStats,
} from '../lib/types/stats'
import { AuthForm } from './AuthForm'
import { InsightsQuickStart } from './InsightsQuickStart'
import { LogForm } from './LogForm'
import { Insights } from './Insights'
import { AppPage, Tabs, type TabKey, type InsightsSection } from '../lib/appTabs'
import { motionTransition } from '../lib/motion'

type AppMainContentProps = {
  authInitialized: boolean
  session: Session | null
  isNativeApp: boolean
  authMode: 'signin' | 'signup'
  setAuthMode: (mode: 'signin' | 'signup') => void
  authEmail: string
  authPassword: string
  authLoading: boolean
  onAuth: (e: React.FormEvent) => void
  onGoogleSignIn: () => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  activeTab: TabKey
  onNavigateToPage: (page: AppPage) => void
  activeInsightsTab: InsightsSection
  saveLogWhenLeaving: (cb: () => void) => void
  entriesSettled: boolean
  entries: Entry[]
  // Log form
  selectedDate: Date
  todayDate: Date
  highlightedDates: Date[]
  incompleteHighlightedDates: Date[]
  sleepHours: string
  mood: number | null
  note: string
  tags: string
  tagSuggestions: string[]
  maxTagsPerEntry: number
  saving: boolean
  saved: boolean
  entriesError: string | null
  moodColors: string[]
  isMobile: boolean
  formatLocalDate: (date: Date) => string
  onEntryDateChange: (value: string) => void
  onSleepHoursChange: (value: string) => void
  onMoodChange: (value: number) => void
  onNoteChange: (value: string) => void
  onTagsChange: (value: string) => void
  onSave: (
    event: React.FormEvent<HTMLFormElement>,
    options?: { silent?: boolean },
  ) => void
  // Insights
  entriesLoading: boolean
  chartData: Entry[]
  averages: SleepMoodAverages
  windowAverages: {
    last7: WindowStats
    last30: WindowStats
    last90: WindowStats
    last365: WindowStats
  }
  statCounts: StatCounts
  rhythmScore: number | null
  streak: number
  sleepConsistencyLabel: string | null
  sleepConsistencyBadges: Badge[]
  correlationLabel: string | null
  correlationDirection: string | null
  moodBySleepThreshold: { high: number | null, low: number | null }
  moodBySleepBucketCounts: { high: number, low: number }
  sleepThreshold: number
  trendSeries: {
    last30: TrendPoint[]
    last90: TrendPoint[]
    last365: TrendPoint[]
  }
  rollingSeries: RollingPoint[]
  rollingSummaries: RollingSummary[]
  weekdayAverages: WeekdayAveragePoint[]
  personalSleepThreshold: number | null
  moodByPersonalThreshold: { high: number | null, low: number | null }
  tagDrivers: TagDriver[]
  tagSleepDrivers: TagSleepDriver[]
  isPro: boolean
  exportError: string | null
  onExportCsv: () => void
  onExportMonthlyReport: () => void
  onOpenPaywall: () => void
  onOpenFeedback: () => void
}

export function AppMainContent({
  authInitialized,
  session,
  isNativeApp,
  authMode,
  setAuthMode,
  authEmail,
  authPassword,
  authLoading,
  onAuth,
  onGoogleSignIn,
  onEmailChange,
  onPasswordChange,
  activeTab,
  onNavigateToPage,
  activeInsightsTab,
  saveLogWhenLeaving,
  entriesSettled,
  entries,
  selectedDate,
  todayDate,
  highlightedDates,
  incompleteHighlightedDates,
  sleepHours,
  mood,
  note,
  tags,
  tagSuggestions,
  maxTagsPerEntry,
  saving,
  saved,
  entriesError,
  moodColors,
  isMobile,
  formatLocalDate,
  onEntryDateChange,
  onSleepHoursChange,
  onMoodChange,
  onNoteChange,
  onTagsChange,
  onSave,
  entriesLoading,
  chartData,
  averages,
  windowAverages,
  statCounts,
  rhythmScore,
  streak,
  sleepConsistencyLabel,
  sleepConsistencyBadges,
  correlationLabel,
  correlationDirection,
  moodBySleepThreshold,
  moodBySleepBucketCounts,
  sleepThreshold,
  trendSeries,
  rollingSeries,
  rollingSummaries,
  weekdayAverages,
  personalSleepThreshold,
  moodByPersonalThreshold,
  tagDrivers,
  tagSleepDrivers,
  isPro,
  exportError,
  onExportCsv,
  onExportMonthlyReport,
  onOpenPaywall,
  onOpenFeedback,
}: AppMainContentProps) {
  const reduceMotion = useReducedMotion()
  const tabTransition = reduceMotion ? { duration: 0 } : motionTransition

  if (!authInitialized) {
    return (
      <div className="card auth-loading" aria-live="polite">
        <h2 className="auth-title">Loading your account</h2>
        <div className="loading-row">
          <span className="loading-spinner" aria-hidden="true" />
          <span className="muted">Checking your session...</span>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <AuthForm
        authMode={authMode}
        authEmail={authEmail}
        authPassword={authPassword}
        authLoading={authLoading}
        showEmailPassword={!isNativeApp}
        onEmailChange={onEmailChange}
        onPasswordChange={onPasswordChange}
        onSubmit={onAuth}
        onGoogleSignIn={onGoogleSignIn}
        onToggleMode={() =>
          setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
      />
    )
  }

  return (
    <>
      <div className="tabs primary-tabs">
        <button
          type="button"
          className={`tab-button ${activeTab === Tabs.Insights ? 'active' : ''}`}
          onClick={() => {
            saveLogWhenLeaving(() =>
              void onSave(
                { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>,
                { silent: true },
              ),
            )
            onNavigateToPage(AppPage.Summary)
          }}
        >
          Insights
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === Tabs.Log ? 'active' : ''}`}
          onClick={() => onNavigateToPage(AppPage.Log)}
        >
          Log
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === Tabs.Log
          ? (
              <motion.div
                key="log"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={tabTransition}
              >
                {!entriesSettled
                  ? (
                      <div className="card auth-loading" aria-live="polite">
                        <div className="loading-row">
                          <span className="loading-spinner" aria-hidden="true" />
                          <span className="muted">Loading your log...</span>
                        </div>
                      </div>
                    )
                  : (
                      <>
                        <InsightsQuickStart
                          hasNoEntries={entries.length === 0}
                          goToLog={() =>
                            document
                              .getElementById('log-calendar')
                              ?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                        />
                        <p className="log-form-tip" role="status">
                          Tip: Best time to log is in the <strong>evening or before bed</strong> so you can log your daily events. The more you log, the clearer the picture of what helps you feel better.
                        </p>
                        <LogForm
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
                          onEntryDateChange={onEntryDateChange}
                          onSleepHoursChange={onSleepHoursChange}
                          onMoodChange={onMoodChange}
                          onNoteChange={onNoteChange}
                          onTagsChange={onTagsChange}
                          onSave={onSave}
                        />
                      </>
                    )}
              </motion.div>
            )
          : (
              <motion.div
                key="insights"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={tabTransition}
              >
                <Insights
                  entries={entries}
                  entriesLoading={entriesLoading}
                  chartData={chartData}
                  averages={averages}
                  windowAverages={windowAverages}
                  statCounts={statCounts}
                  rhythmScore={rhythmScore}
                  streak={streak}
                  sleepConsistencyLabel={sleepConsistencyLabel}
                  sleepConsistencyBadges={sleepConsistencyBadges}
                  correlationLabel={correlationLabel}
                  correlationDirection={correlationDirection}
                  moodBySleepThreshold={moodBySleepThreshold}
                  moodBySleepBucketCounts={moodBySleepBucketCounts}
                  sleepThreshold={sleepThreshold}
                  moodColors={moodColors}
                  trendSeries={trendSeries}
                  rollingSeries={rollingSeries}
                  rollingSummaries={rollingSummaries}
                  weekdayAverages={weekdayAverages}
                  personalSleepThreshold={personalSleepThreshold}
                  moodByPersonalThreshold={moodByPersonalThreshold}
                  tagDrivers={tagDrivers}
                  tagSleepDrivers={tagSleepDrivers}
                  isPro={isPro}
                  exportError={exportError}
                  onExportCsv={onExportCsv}
                  onExportMonthlyReport={onExportMonthlyReport}
                  onOpenPaywall={onOpenPaywall}
                  onOpenFeedback={onOpenFeedback}
                  goToLog={() => onNavigateToPage(AppPage.Log)}
                  activeTab={activeInsightsTab}
                />
              </motion.div>
            )}
      </AnimatePresence>
    </>
  )
}
