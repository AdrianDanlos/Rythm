import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { Entry } from '../lib/entries'
import type { StatCounts } from '../lib/stats'
import type {
  RollingPoint,
  RollingSummary,
  SleepMoodAverages,
  Badge,
  TagDriver,
  TagSleepDriver,
  TrendPoint,
  WeekdayAveragePoint,
  WindowStats,
} from '../lib/types/stats'
import { InsightsDailyHistory } from './insights/InsightsDailyHistory'
import { InsightsExport } from './insights/InsightsExport'
import { InsightsFirstFiveCard } from './insights/InsightsFirstFiveCard'
import { InsightsFirstTwoCard } from './insights/InsightsFirstTwoCard'
import { InsightsSummaryIntro } from './InsightsSummaryIntro'
import { InsightsCalendarHeatmap } from './insights/InsightsCalendarHeatmap'
import { InsightsMonthlyCalendar } from './insights/InsightsMonthlyCalendar'
import { IdeaSleepTarget } from './insights/IdeaSleepTarget'
import { InsightsScatter } from './insights/InsightsScatter'
import { InsightsSmoothedTrends } from './insights/InsightsSmoothedTrends'
import { InsightsStats } from './insights/InsightsStats'
import { InsightsTagInsights } from './insights/InsightsTagInsights'
import { InsightsMoodDistribution } from './insights/InsightsMoodDistribution'
import { InsightsWeekdayAverages } from './insights/InsightsWeekdayAverages'
import rankingBadge1 from '../assets/badges/ranking-badge_1.png'
import rankingBadge2 from '../assets/badges/ranking-badge_2.png'
import rankingBadge3 from '../assets/badges/ranking-badge_3.png'
import rankingBadge4 from '../assets/badges/ranking-badge_4.png'
import rankingBadge5 from '../assets/badges/ranking-badge_5.png'
import rankingBadgeLast from '../assets/badges/ranking-badge_last.png'
import googleLogo from '../assets/playstore.png?inline'
import { PLAY_STORE_APP_URL } from '../lib/constants'
import { buildMockScatterPlottedData } from '../lib/insightsMock'
import { getMotivationMessage } from '../lib/utils/motivationMessage'
import { STORAGE_KEYS } from '../lib/storageKeys'
import { motionTransition } from '../lib/motion'

type InsightsTab = 'summary' | 'charts' | 'data'
type ScatterRange = 'all' | 'last30' | 'last90'
const SCATTER_RANGE_DAYS: Record<Exclude<ScatterRange, 'all'>, number> = {
  last30: 30,
  last90: 90,
}
type BestSleepBand = {
  x1: number
  x2: number
  samples: number
  avgMood: number
}

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
  moodColors: string[]
  trendSeries: { last30: TrendPoint[], last90: TrendPoint[], last365: TrendPoint[] }
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
  activeTab: InsightsTab
  goToLog: () => void
}

export const Insights = ({
  entries,
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
  moodColors,
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
  const hasEnoughEntries = entries.length >= 3
  const [scatterRange, setScatterRange] = useState<ScatterRange>('last30')
  const showScatter90 = entries.length >= 30
  const showScatterAll = entries.length >= 90
  const jitterFromId = (id: string, scale = 0.18) => {
    let hash = 0
    for (let i = 0; i < id.length; i += 1) {
      hash = (hash << 5) - hash + id.charCodeAt(i)
      hash |= 0
    }
    const normalized = (hash % 1000) / 1000
    return (normalized - 0.5) * scale
  }

  const effectiveScatterRange = useMemo((): ScatterRange => {
    if (scatterRange === 'all' && !showScatterAll) return showScatter90 ? 'last90' : 'last30'
    if (scatterRange === 'last90' && !showScatter90) return 'last30'
    return scatterRange
  }, [scatterRange, showScatter90, showScatterAll])

  const hasMissingStats = rhythmScore === null
    || sleepConsistencyLabel === null
    || correlationLabel === null
    || (moodBySleepThreshold.high === null && moodBySleepThreshold.low === null)
  const moodBySleepDeltaPercent = useMemo(() => {
    const high = moodBySleepThreshold.high
    const low = moodBySleepThreshold.low
    if (high === null || low === null) return null
    if (low > 0) return ((high - low) / low) * 100
    return 0
  }, [moodBySleepThreshold.high, moodBySleepThreshold.low])

  const motivationMessage = useMemo(
    () =>
      getMotivationMessage({
        entries,
        statCounts,
        streak,
        windowAverages: { last7: windowAverages.last7, last30: windowAverages.last30 },
        rollingSummaries,
        rhythmScore,
        moodBySleepDeltaPercent,
        hasMissingStats,
        weekdayAverages,
        correlationLabel,
      }),
    [
      entries,
      statCounts,
      streak,
      windowAverages.last7,
      windowAverages.last30,
      rollingSummaries,
      rhythmScore,
      moodBySleepDeltaPercent,
      hasMissingStats,
      weekdayAverages,
      correlationLabel,
    ],
  )

  const sortedBadges = useMemo(() => {
    const isCompleted = (b: Badge) =>
      b.unlocked && (b.tierCount === 1 || b.currentTierIndex === b.tierCount - 1)
    const progressRatio = (b: Badge) =>
      b.progressTotal > 0 ? b.progressValue / b.progressTotal : 0
    return [...sleepConsistencyBadges].sort((a, b) => {
      const aDone = isCompleted(a)
      const bDone = isCompleted(b)
      if (aDone !== bDone) return aDone ? -1 : 1
      return progressRatio(b) - progressRatio(a)
    })
  }, [sleepConsistencyBadges])

  const scatterEntries = useMemo(() => {
    if (!isPro) return []
    if (effectiveScatterRange === 'all') return chartData
    const n = SCATTER_RANGE_DAYS[effectiveScatterRange]
    return chartData.slice(-n)
  }, [chartData, effectiveScatterRange, isPro])

  const plottedData = useMemo(() => {
    return scatterEntries.flatMap((entry) => {
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
  }, [scatterEntries])

  const bestSleepBand = useMemo<BestSleepBand | null>(() => {
    const buckets = new Map<number, { moodSum: number, count: number }>()
    scatterEntries.forEach((entry) => {
      const sleepRaw = Number(entry.sleep_hours)
      const mood = Number(entry.mood)
      if (!Number.isFinite(sleepRaw) || !Number.isFinite(mood)) return
      const sleep = Math.min(10, Math.max(4, sleepRaw))
      const bucketStart = sleep >= 10 ? 9 : Math.floor(sleep)
      const bucket = buckets.get(bucketStart) ?? { moodSum: 0, count: 0 }
      bucket.moodSum += mood
      bucket.count += 1
      buckets.set(bucketStart, bucket)
    })
    let best: BestSleepBand | null = null
    buckets.forEach((bucket, start) => {
      if (bucket.count < 2) return
      const avgMood = bucket.moodSum / bucket.count
      if (
        !best
        || avgMood > best.avgMood
        || (avgMood === best.avgMood && bucket.count > best.samples)
      ) {
        best = {
          x1: start,
          x2: start + 1,
          samples: bucket.count,
          avgMood,
        }
      }
    })
    return best
  }, [scatterEntries])

  const scatterPlottedData = useMemo(() => {
    if (isPro) return plottedData
    return buildMockScatterPlottedData()
  }, [isPro, plottedData])

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
  const reduceMotion = useReducedMotion()
  const panelTransition = reduceMotion ? { duration: 0 } : motionTransition

  return (
    <>
      {activeTab === 'summary'
        ? (
            <motion.div
              className="insights-panel"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={panelTransition}
            >
              {!entriesLoading && entries.length === 1 && (
                <InsightsFirstTwoCard entries={entries} goToLog={goToLog} />
              )}
              {!entriesLoading && entries.length >= 2 && entries.length <= 4 && (
                <InsightsFirstFiveCard entries={entries} goToLog={goToLog} />
              )}
              {!entriesLoading && entries.length === 0 && (
                <InsightsSummaryIntro
                  entryCount={entries.length}
                  entriesLoading={entriesLoading}
                  goToLog={goToLog}
                />
              )}
              <InsightsStats
                isLoading={isLoading}
                averages={averages}
                windowAverages={windowAverages}
                statCounts={statCounts}
                rhythmScore={rhythmScore}
                streak={streak}
                sleepConsistencyLabel={sleepConsistencyLabel}
                correlationLabel={correlationLabel}
                correlationDirection={correlationDirection}
                moodBySleepThreshold={moodBySleepThreshold}
                moodBySleepBucketCounts={moodBySleepBucketCounts}
                sleepThreshold={sleepThreshold}
                isPro={isPro}
                goToLog={goToLog}
                motivationMessage={motivationMessage.text}
              />
              {hasEnoughEntries && (
                <IdeaSleepTarget
                  isPro={isPro}
                  entryCount={entries.length}
                  personalSleepThreshold={personalSleepThreshold}
                  moodByPersonalThreshold={moodByPersonalThreshold}
                  onOpenPaywall={onOpenPaywall}
                  goToLog={goToLog}
                />
              )}
              {hasEnoughEntries && (
                <InsightsTagInsights
                  isPro={isPro}
                  tagDrivers={tagDrivers}
                  tagSleepDrivers={tagSleepDrivers}
                  onOpenPaywall={onOpenPaywall}
                  goToLog={goToLog}
                />
              )}
              {sleepConsistencyBadges.length > 0 && (
                <section className="card">
                  <div className="card-header">
                    <div>
                      <h2>Badges</h2>
                      <p className="muted">Level up as you log</p>
                    </div>
                  </div>
                  <>
                    <div className="badge-list">
                      {sortedBadges.map(badge => {
                        const isMaxTier = badge.unlocked && (badge.tierCount === 1 || badge.currentTierIndex === badge.tierCount - 1)
                        const step = badge.unlocked ? (isMaxTier ? 'last' : badge.currentTierIndex + 2) : 1
                        const badgeSrc = step === 'last'
                          ? rankingBadgeLast
                          : [rankingBadge1, rankingBadge2, rankingBadge3, rankingBadge4, rankingBadge5][step - 1]
                        return (
                        <div
                          className={`badge-row ${badge.unlocked ? 'unlocked' : 'locked'}`}
                          key={badge.id}
                        >
                          <div className="badge-row-header">
                            <div className="badge-title-row">
                              <p className="badge-title">{badge.title}</p>
                              <img
                                className="badge-status-icon badge-status-icon--ranking"
                                src={badgeSrc}
                                alt=""
                                aria-hidden
                              />
                            </div>
                            <p className="badge-helper">{badge.description}</p>
                          </div>
                          {badge.progressTotal > 0 && (
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
                          )}
                          {badge.progressText
                            ? (
                                <p className="badge-progress-text">{badge.progressText}</p>
                              )
                            : null}
                        </div>
                      )})}
                    </div>
                  </>
                </section>
              )}
            </motion.div>
          )
        : null}
      {activeTab === 'charts'
        ? (
            <motion.div
              className="insights-panel"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={panelTransition}
            >
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
              <InsightsMonthlyCalendar
                entries={entries}
                moodColors={moodColors}
                isMobile={isMobile}
                entriesLoading={entriesLoading}
              />
              <InsightsWeekdayAverages
                weekdayAverages={weekdayAverages}
                isMobile={isMobile}
                goToLog={goToLog}
              />
              {hasEnoughEntries && (
                <InsightsScatter
                  isLoading={isLoading}
                  hasAnyEntries={isPro ? !isEmpty : true}
                  isRangeEmpty={isPro ? !isLoading && plottedData.length === 0 : false}
                  isMobile={isMobile}
                  plottedData={scatterPlottedData}
                  moodColors={moodColors}
                  scatterRange={effectiveScatterRange}
                  onScatterRangeChange={setScatterRange}
                  show90Range={isPro ? showScatter90 : true}
                  showAllRange={isPro ? showScatterAll : true}
                  bestSleepBand={bestSleepBand}
                  goToLog={goToLog}
                  isPro={isPro}
                  onOpenPaywall={onOpenPaywall}
                />
              )}
              {hasEnoughEntries && (
                <InsightsSmoothedTrends
                  isPro={isPro}
                  isMobile={isMobile}
                  entryCount={entries.length}
                  rollingSeries={rollingSeries}
                  rollingSummaries={rollingSummaries}
                  onOpenPaywall={onOpenPaywall}
                  goToLog={goToLog}
                />
              )}
              {hasEnoughEntries && (
                <InsightsDailyHistory
                  isPro={isPro}
                  isMobile={isMobile}
                  entryCount={entries.length}
                  trendSeries={trendSeries}
                  onOpenPaywall={onOpenPaywall}
                  goToLog={goToLog}
                />
              )}
            </motion.div>
          )
        : null}
      {activeTab === 'data'
        ? (
            <motion.div
              className="insights-panel"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={panelTransition}
            >
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
                      <img className="review-cta__icon" src={googleLogo} alt="" width={24} height={24} />
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
              <div className="card review-cta review-cta--standalone feedback-cta">
                <div className="review-cta__content">
                  <div className="review-cta__text">
                    <p className="label">Send feedback</p>
                    <p className="muted">Suggestions, bugs, or ideas—we’d love to hear from you.</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="review-cta__link"
                  onClick={onOpenFeedback}
                  aria-label="Send feedback"
                >
                  Send feedback
                </button>
              </div>
            </motion.div>
          )
        : null}
    </>
  )
}
