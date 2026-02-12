import { useEffect, useMemo, useState } from 'react'
import type { Entry } from '../lib/entries'
import type {
  RollingPoint,
  RollingSummary,
  SleepMoodAverages,
  SleepConsistencyBadge,
  TagDriver,
  TagSleepDriver,
  TrendPoint,
  WindowStats,
} from '../lib/types/stats'
import { InsightsDailyHistory } from './insights/InsightsDailyHistory'
import { InsightsExport } from './insights/InsightsExport'
import { InsightsSummaryIntro } from './InsightsSummaryIntro'
import { InsightsCalendarHeatmap } from './insights/InsightsCalendarHeatmap'
import { IdeaSleepTarget } from './insights/IdeaSleepTarget'
import { InsightsScatter } from './insights/InsightsScatter'
import { InsightsSmoothedTrends } from './insights/InsightsSmoothedTrends'
import { InsightsStats } from './insights/InsightsStats'
import { InsightsTagInsights } from './insights/InsightsTagInsights'
import { InsightsMoodDistribution } from './insights/InsightsMoodDistribution'
import badgeIcon from '../assets/badge.png'
import googleLogo from '../assets/playstore.png'
import { PLAY_STORE_APP_URL } from '../lib/constants'
import { STORAGE_KEYS } from '../lib/storageKeys'

type InsightsTab = 'summary' | 'charts' | 'data'

type InsightsProps = {
  entries: Entry[]
  entriesLoading: boolean
  chartData: Entry[]
  averages: SleepMoodAverages
  windowAverages: {
    last7: WindowStats
    last30: WindowStats
    last90: WindowStats
    last365: WindowStats
  }
  rhythmScore: number | null
  streak: number
  sleepConsistencyLabel: string | null
  sleepConsistencyBadges: SleepConsistencyBadge[]
  correlationLabel: string | null
  correlationDirection: string | null
  moodBySleepThreshold: { high: number | null, low: number | null }
  sleepThreshold: number
  moodColors: string[]
  trendSeries: { last30: TrendPoint[], last90: TrendPoint[], last365: TrendPoint[] }
  rollingSeries: RollingPoint[]
  rollingSummaries: RollingSummary[]
  personalSleepThreshold: number | null
  moodByPersonalThreshold: { high: number | null, low: number | null }
  tagDrivers: TagDriver[]
  tagSleepDrivers: TagSleepDriver[]
  isPro: boolean
  exportError: string | null
  onExportCsv: () => void
  onExportMonthlyReport: () => void
  onOpenPaywall: () => void
  activeTab: InsightsTab
  goToLog: () => void
}

export const Insights = ({
  entries,
  entriesLoading,
  chartData,
  averages,
  windowAverages,
  rhythmScore,
  streak,
  sleepConsistencyLabel,
  sleepConsistencyBadges,
  correlationLabel,
  correlationDirection,
  moodBySleepThreshold,
  sleepThreshold,
  moodColors,
  trendSeries,
  rollingSeries,
  rollingSummaries,
  personalSleepThreshold,
  moodByPersonalThreshold,
  tagDrivers,
  tagSleepDrivers,
  isPro,
  exportError,
  onExportCsv,
  onExportMonthlyReport,
  onOpenPaywall,
  activeTab,
  goToLog,
}: InsightsProps) => {
  const [hasRatedOnPlay, setHasRatedOnPlay] = useState(
    () => typeof window !== 'undefined'
      && localStorage.getItem(STORAGE_KEYS.RATED_GOOGLE_PLAY) === 'true',
  )
  const reviewUrl = PLAY_STORE_APP_URL
  const onRateClick = () => {
    try {
      localStorage.setItem(STORAGE_KEYS.RATED_GOOGLE_PLAY, 'true')
    }
    catch {
      // ignore
    }
    setHasRatedOnPlay(true)
  }
  const isLoading = entriesLoading
  const isEmpty = !entriesLoading && entries.length === 0
  const showGatedInsights = isPro || entries.length >= 3
  const jitterFromId = (id: string, scale = 0.18) => {
    let hash = 0
    for (let i = 0; i < id.length; i += 1) {
      hash = (hash << 5) - hash + id.charCodeAt(i)
      hash |= 0
    }
    const normalized = (hash % 1000) / 1000
    return (normalized - 0.5) * scale
  }

  const plottedData = useMemo(() => {
    return chartData.flatMap((entry) => {
      const sleep = Number(entry.sleep_hours)
      const mood = Number(entry.mood)
      if (!Number.isFinite(sleep) || !Number.isFinite(mood)) {
        return []
      }
      const sleepClamped = Math.min(10, Math.max(4, sleep))
      const moodClamped = Math.min(5, Math.max(1, mood))
      const jitter = jitterFromId(entry.id)
      return [{
        ...entry,
        sleep_hours_clamped: sleepClamped,
        sleep_hours_jittered: Math.min(10, Math.max(4, sleepClamped + jitter)),
        mood_jittered: Math.min(5, Math.max(1, moodClamped + jitter / 2)),
      }]
    })
  }, [chartData])
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const media = window.matchMedia('(max-width: 540px)')
    const handleChange = () => setIsMobile(media.matches)
    handleChange()

    if (media.addEventListener) {
      media.addEventListener('change', handleChange)
      return () => media.removeEventListener('change', handleChange)
    }

    media.addListener(handleChange)
    return () => media.removeListener(handleChange)
  }, [])
  return (
    <>
      {activeTab === 'summary'
        ? (
            <div className="insights-panel">
              <InsightsSummaryIntro
                entryCount={entries.length}
                entriesLoading={entriesLoading}
              />
              <InsightsStats
                isLoading={isLoading}
                averages={averages}
                windowAverages={windowAverages}
                rhythmScore={rhythmScore}
                streak={streak}
                sleepConsistencyLabel={sleepConsistencyLabel}
                correlationLabel={correlationLabel}
                correlationDirection={correlationDirection}
                moodBySleepThreshold={moodBySleepThreshold}
                sleepThreshold={sleepThreshold}
                goToLog={goToLog}
              />
              {showGatedInsights && (
                <>
                  <IdeaSleepTarget
                    isPro={isPro}
                    personalSleepThreshold={personalSleepThreshold}
                    moodByPersonalThreshold={moodByPersonalThreshold}
                    onOpenPaywall={onOpenPaywall}
                    goToLog={goToLog}
                  />
                  <InsightsTagInsights
                    isPro={isPro}
                    tagDrivers={tagDrivers}
                    tagSleepDrivers={tagSleepDrivers}
                    onOpenPaywall={onOpenPaywall}
                    goToLog={goToLog}
                  />
                </>
              )}
              <section className="card">
                <div className="card-header">
                  <div>
                    <h2>Sleep badges</h2>
                    <p className="muted">Consistency rewards based on your logs</p>
                  </div>
                </div>
                {sleepConsistencyBadges.length
                  ? (
                      <div className="badge-list">
                        {sleepConsistencyBadges.map(badge => (
                          <div
                            className={`badge-row ${badge.unlocked ? 'unlocked' : 'locked'}`}
                            key={badge.id}
                          >
                            <div className="badge-row-header">
                              <div className="badge-title-row">
                                <p className="badge-title">{badge.title}</p>
                                {badge.unlocked
                                  ? (
                                      <img
                                        className="badge-status-icon"
                                        src={badgeIcon}
                                        alt=""
                                        aria-hidden
                                      />
                                    )
                                  : (
                                      <span className="badge-status-icon badge-status-icon--lock" aria-hidden>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                      </span>
                                    )}
                              </div>
                              <p className="badge-helper">{badge.description}</p>
                            </div>
                            {!badge.unlocked
                              ? (
                                  <div className="badge-progress-track" aria-hidden="true">
                                    <span
                                      className="badge-progress-fill"
                                      style={{
                                        width: `${Math.min(
                                          100,
                                          Math.max(0, (badge.progressValue / (badge.progressTotal || 1)) * 100),
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                )
                              : null}
                            {badge.progressText
                              ? (
                                  <p className="badge-progress-text">{badge.progressText}</p>
                                )
                              : null}
                          </div>
                        ))}
                      </div>
                    )
                  : (
                      <p className="muted">
                        <button type="button" className="link-button link-button--text" onClick={goToLog}>
                          Log more days
                        </button>
                        {' '}to unlock badges.
                      </p>
                    )}
              </section>
            </div>
          )
        : null}
      {activeTab === 'charts'
        ? (
            <div className="insights-panel">
              <InsightsScatter
                isLoading={isLoading}
                isEmpty={isEmpty || plottedData.length === 0}
                isMobile={isMobile}
                plottedData={plottedData}
                moodColors={moodColors}
                goToLog={goToLog}
              />
              <InsightsMoodDistribution
                entries={entries}
                moodColors={moodColors}
                goToLog={goToLog}
              />
              <InsightsCalendarHeatmap
                entries={entries}
                moodColors={moodColors}
                isMobile={isMobile}
              />
              {showGatedInsights && (
                <>
                  <InsightsSmoothedTrends
                    isPro={isPro}
                    isMobile={isMobile}
                    entryCount={entries.length}
                    rollingSeries={rollingSeries}
                    rollingSummaries={rollingSummaries}
                    onOpenPaywall={onOpenPaywall}
                    goToLog={goToLog}
                  />
                  <InsightsDailyHistory
                    isPro={isPro}
                    isMobile={isMobile}
                    entryCount={entries.length}
                    trendSeries={trendSeries}
                    onOpenPaywall={onOpenPaywall}
                    goToLog={goToLog}
                  />
                </>
              )}
            </div>
          )
        : null}
      {activeTab === 'data'
        ? (
            <div className="insights-panel">
              <InsightsExport
                hasEntries={entries.length > 0}
                isPro={isPro}
                exportError={exportError}
                onExportCsv={onExportCsv}
                onExportMonthlyReport={onExportMonthlyReport}
                onOpenPaywall={onOpenPaywall}
              />
              {!hasRatedOnPlay && (
                <div className="review-cta review-cta--standalone">
                  <div className="review-cta__content">
                    <div className="review-cta__icon-wrap" aria-hidden="true">
                      <img className="review-cta__icon" src={googleLogo} alt="" />
                    </div>
                    <div className="review-cta__text">
                      <p className="label">Enjoying Rythm?</p>
                      <p className="muted">A quick review helps a ton.</p>
                    </div>
                  </div>
                  <a className="review-cta__link" href={reviewUrl} target="_blank" rel="noreferrer" onClick={onRateClick}>
                    Rate on Google Play
                  </a>
                </div>
              )}
            </div>
          )
        : null}
    </>
  )
}
