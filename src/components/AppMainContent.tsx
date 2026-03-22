import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
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
import { SettingsPage } from './SettingsPage'
import { AppPage, Tabs, type TabKey, type InsightsSection } from '../lib/appTabs'
import type {
  DateFormatPreference,
  LanguagePreference,
  ThemePreference,
} from '../lib/settings'
import { motionTransition } from '../lib/motion'
import logo from '../assets/rythm-logo.png'

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
  activePage: AppPage
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
  tagColors: Record<string, string>
  isPro: boolean
  onOpenPaywall: () => void
  onOpenFeedback: () => void
  settingsName: string
  settingsEmail: string
  settingsDateFormat: DateFormatPreference
  settingsLanguage: LanguagePreference
  settingsTheme: ThemePreference
  settingsPersonalSleepTarget: number
  onSettingsNameChange: (value: string) => void
  onSettingsDateFormatChange: (value: DateFormatPreference) => void
  onSettingsLanguageChange: (value: LanguagePreference) => void
  onSettingsThemeChange: (value: ThemePreference) => void
  onSettingsPersonalSleepTargetChange: (value: number) => void
  onRenameTag: (fromTag: string, toTag: string) => void
  onTagColorChange: (tag: string, color: string) => void
  onEnsureTagColor: (tag: string) => void
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
  activePage,
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
  tagColors,
  isPro,
  onOpenPaywall,
  onOpenFeedback,
  settingsName,
  settingsEmail,
  settingsDateFormat,
  settingsLanguage,
  settingsTheme,
  settingsPersonalSleepTarget,
  onSettingsNameChange,
  onSettingsDateFormatChange,
  onSettingsLanguageChange,
  onSettingsThemeChange,
  onSettingsPersonalSleepTargetChange,
  onRenameTag,
  onTagColorChange,
  onEnsureTagColor,
}: AppMainContentProps) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const tabTransition = reduceMotion ? { duration: 0 } : motionTransition

  // On native apps (Android/iOS), rely on the native splash screen (R logo)
  // and avoid showing the intermediate "loading account" screen.
  if (!authInitialized) {
    if (isNativeApp) {
      return null
    }

    return (
      <div className="app-loading-splash" aria-live="polite">
        <img
          className="app-loading-splash__logo"
          src={logo}
          alt=""
          aria-hidden
        />
        <h2 className="app-loading-splash__title">{t('auth.loadingAccount')}</h2>
        <div className="app-loading-splash__row">
          <span className="app-loading-splash__spinner" aria-hidden="true" />
          <span className="app-loading-splash__muted">{t('auth.checkingSession')}</span>
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
          {t('nav.insights')}
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === Tabs.Log ? 'active' : ''}`}
          onClick={() => onNavigateToPage(AppPage.Log)}
        >
          {t('nav.log')}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activePage === AppPage.Settings
          ? (
              <motion.div
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={tabTransition}
              >
                <SettingsPage
                  name={settingsName}
                  email={settingsEmail}
                  dateFormat={settingsDateFormat}
                  language={settingsLanguage}
                  theme={settingsTheme}
                  personalSleepTarget={settingsPersonalSleepTarget}
                  onNameChange={onSettingsNameChange}
                  onDateFormatChange={onSettingsDateFormatChange}
                  onLanguageChange={onSettingsLanguageChange}
                  onThemeChange={onSettingsThemeChange}
                  onPersonalSleepTargetChange={onSettingsPersonalSleepTargetChange}
                />
              </motion.div>
            )
          : activeTab === Tabs.Log
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
                        <div
                          className="log-entries-loading-overlay"
                          aria-live="polite"
                          aria-busy="true"
                        >
                          <div className="log-entries-loading-overlay__content">
                            <span
                              className="log-entries-loading-overlay__spinner"
                              aria-hidden="true"
                            />
                            <span className="log-entries-loading-overlay__label">
                              {t('log.loading')}
                            </span>
                          </div>
                        </div>
                      )
                    : (
                        <>
                          <InsightsQuickStart
                            hasNoEntries={entries.length === 0}
                            goToLog={() =>
                              document
                                .querySelector('.sleep-duration-picker__quick-grid')
                                ?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                          />
                          <p className="log-form-tip" role="status">
                            {t('log.tip')}
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
                            moodColors={moodColors}
                            isMobile={isMobile}
                            formatLocalDate={formatLocalDate}
                            tagColors={tagColors}
                            onEnsureTagColor={onEnsureTagColor}
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
                    tagColors={tagColors}
                    isPro={isPro}
                    onOpenPaywall={onOpenPaywall}
                    onOpenFeedback={onOpenFeedback}
                    goToLog={() => onNavigateToPage(AppPage.Log)}
                    activeTab={activeInsightsTab}
                    onRenameTag={onRenameTag}
                    onTagColorChange={onTagColorChange}
                  />
                </motion.div>
              )}
      </AnimatePresence>
    </>
  )
}
