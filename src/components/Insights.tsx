import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Info, Pencil } from 'lucide-react'
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
import { InsightsFirstFiveCard } from './insights/InsightsFirstFiveCard'
import { InsightsFirstTwoCard } from './insights/InsightsFirstTwoCard'
import { InsightsSummaryIntro } from './InsightsSummaryIntro'
import { InsightsCalendarHeatmap } from './insights/InsightsCalendarHeatmap'
import { NoDailyEventsLoggedHint } from './insights/NoDailyEventsLoggedHint'
import { IdeaSleepTarget } from './insights/IdeaSleepTarget'
import { InsightsScatter } from './insights/InsightsScatter'
import { InsightsSmoothedTrends } from './insights/InsightsSmoothedTrends'
import { InsightsStats } from './insights/InsightsStats'
import { InsightsTagInsights } from './insights/InsightsTagInsights'
import { InsightsMoodDistribution } from './insights/InsightsMoodDistribution'
import { InsightsWeekdayAverages } from './insights/InsightsWeekdayAverages'
import { useIsMobile } from '../hooks/useIsMobile'
import { tagColorPalette } from '../lib/colors'
import { TagColorPicker } from './TagColorPicker'
import { Tooltip } from './Tooltip'
import rankingBadge1 from '../assets/badges/ranking-badge_1.png'
import rankingBadge2 from '../assets/badges/ranking-badge_2.png'
import rankingBadge3 from '../assets/badges/ranking-badge_3.png'
import rankingBadge4 from '../assets/badges/ranking-badge_4.png'
import rankingBadge5 from '../assets/badges/ranking-badge_5.png'
import rankingBadgeLast from '../assets/badges/ranking-badge_last.png'
import { buildMockScatterPlottedData } from '../lib/insightsMock'
import { getMotivationMessage } from '../lib/utils/motivationMessage'
import { motionTransition } from '../lib/motion'
import { MAX_TAG_LENGTH } from '../lib/utils/stringUtils'

type InsightsTab = 'summary' | 'charts' | 'events' | 'timeline'
type ScatterRange = 'all' | 'last30' | 'last90'
const SCATTER_RANGE_DAYS: Record<Exclude<ScatterRange, 'all'>, number> = {
  last30: 30,
  last90: 90,
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
  tagColors: Record<string, string>
  isPro: boolean
  onOpenPaywall: () => void
  onOpenFeedback: () => void
  activeTab: InsightsTab
  goToLog: () => void
  onRenameTag: (fromTag: string, toTag: string) => void
  onTagColorChange: (tag: string, color: string) => void
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
  tagColors,
  isPro,
  onOpenPaywall,
  activeTab,
  goToLog,
  onRenameTag,
  onTagColorChange,
}: InsightsProps) => {
  const { t } = useTranslation()
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

  /** Highlight band on scatter: ideal sleep target ±30 min, clamped to chart domain [4, 10]. */
  const idealSleepRangeBand = useMemo(() => {
    if (personalSleepThreshold == null || !Number.isFinite(personalSleepThreshold)) {
      return null
    }
    const halfHour = 0.5
    const x1 = Math.max(4, personalSleepThreshold - halfHour)
    const x2 = Math.min(10, personalSleepThreshold + halfHour)
    if (x1 >= x2) return null
    return { x1, x2 }
  }, [personalSleepThreshold])

  const scatterPlottedData = useMemo(() => {
    if (isPro) return plottedData
    return buildMockScatterPlottedData()
  }, [isPro, plottedData])

  const topTags = useMemo(() => {
    const countByKey = new Map<string, { count: number, display: string }>()
    entries.forEach((entry) => {
      const tags = entry.tags ?? []
      tags.forEach((tag) => {
        const t = tag.trim()
        if (!t) return
        const key = t.toLowerCase()
        const existing = countByKey.get(key)
        if (existing) {
          existing.count += 1
        }
        else {
          countByKey.set(key, { count: 1, display: t })
        }
      })
    })
    return Array.from(countByKey.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([, { display, count }]) => ({ display, count }))
  }, [entries])
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [showAllTags, setShowAllTags] = useState(false)
  const visibleTags = showAllTags ? topTags : topTags.slice(0, 6)
  const [colorPickerTag, setColorPickerTag] = useState<string | null>(null)

  const startEditingTag = (tag: string) => {
    setEditingTag(tag)
    setEditingValue(tag.slice(0, MAX_TAG_LENGTH))
  }

  const commitEditingTag = () => {
    if (!editingTag) return
    const trimmed = editingValue.trim()
    const limited = trimmed.slice(0, MAX_TAG_LENGTH).toLowerCase()
    if (!limited || limited === editingTag.toLowerCase()) {
      setEditingTag(null)
      setEditingValue('')
      return
    }
    onRenameTag(editingTag, limited)
    setEditingTag(null)
    setEditingValue('')
  }

  const cancelEditingTag = () => {
    setEditingTag(null)
    setEditingValue('')
  }

  const isMobile = useIsMobile()
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
                  averageSleep={averages.sleep}
                  moodByPersonalThreshold={moodByPersonalThreshold}
                  onOpenPaywall={onOpenPaywall}
                  goToLog={goToLog}
                />
              )}
              {sleepConsistencyBadges.length > 0 && (
                <section className="card">
                  <div className="card-header">
                    <div>
                      <h2>{t('insights.badges')}</h2>
                      <p className="muted">{t('insights.levelUp')}</p>
                    </div>
                  </div>
                  <>
                    <div className="badge-list">
                      {sortedBadges.map((badge) => {
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
                            {badge.progressTotal > 0 && !isMaxTier && (
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
                        )
                      })}
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
                  tagColors={tagColors}
                  scatterRange={effectiveScatterRange}
                  onScatterRangeChange={setScatterRange}
                  show90Range={isPro ? showScatter90 : true}
                  showAllRange={isPro ? showScatterAll : true}
                  idealSleepRangeBand={idealSleepRangeBand}
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
      {activeTab === 'events'
        ? (
            <motion.div
              className="insights-panel"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={panelTransition}
            >
              <section className="card">
                <div className="card-header">
                  <div className="your-daily-events-heading">
                    <h2>{t('insights.yourDailyEvents')}</h2>
                    <Tooltip label={t('insights.tagColorRandomTooltip')}>
                      <span
                        className="tooltip-trigger"
                        tabIndex={0}
                        aria-label={t('insights.tagColorRandomTooltip')}
                      >
                        <span className="tooltip-icon" aria-hidden="true">
                          <Info size={14} />
                        </span>
                      </span>
                    </Tooltip>
                  </div>
                </div>
                {topTags.length > 0
                  ? (
                      <>
                        <ul className="your-daily-events-list">
                          {visibleTags.map(({ display, count }) => {
                            const isEditing = editingTag === display
                            const colorKey = display.trim().toLowerCase()
                            const hasExplicitColor = !!tagColors[colorKey]
                            const tagColor = hasExplicitColor ? tagColors[colorKey] : '#ffffff'
                            return (
                              <li
                                key={display}
                                className="your-daily-events-list-item"
                              >
                                {isEditing
                                  ? (
                                      <div className="field your-daily-events-edit-input">
                                        <input
                                          type="text"
                                          value={editingValue}
                                          onChange={e => setEditingValue(e.target.value.slice(0, MAX_TAG_LENGTH))}
                                          onBlur={commitEditingTag}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault()
                                              commitEditingTag()
                                            }
                                            else if (e.key === 'Escape') {
                                              e.preventDefault()
                                              cancelEditingTag()
                                            }
                                          }}
                                          autoFocus
                                        />
                                      </div>
                                    )
                                  : (
                                      <>
                                        <span className="your-daily-events-list-label">
                                          {t('insights.dailyEventCount', { tag: display, count })}
                                        </span>
                                        <button
                                          type="button"
                                          className="tag-color-trigger"
                                          style={{ backgroundColor: tagColor }}
                                          onClick={() => setColorPickerTag(display)}
                                          aria-label={t('insights.changeTagColor', { tag: display })}
                                        >
                                          <span className="tag-color-trigger-inner" />
                                        </button>
                                        <button
                                          type="button"
                                          className="ghost icon-button your-daily-events-edit-button"
                                          onClick={() => startEditingTag(display)}
                                          aria-label={t('common.edit')}
                                        >
                                          <Pencil className="icon" aria-hidden />
                                        </button>
                                      </>
                                    )}
                              </li>
                            )
                          })}
                        </ul>
                        {topTags.length > 6 && (
                          <div className="tag-insights-show-more">
                            <button
                              type="button"
                              className="link-button link-button--text your-daily-events-toggle"
                              onClick={() => {
                                setShowAllTags((prev) => {
                                  const next = !prev
                                  if (prev && typeof window !== 'undefined') {
                                    window.scrollTo({ top: 0, behavior: 'smooth' })
                                  }
                                  return next
                                })
                              }}
                            >
                              {showAllTags
                                ? t('insights.showTopTags')
                                : t('insights.showAllTags')}
                            </button>
                          </div>
                        )}
                      </>
                    )
                  : (
                      <NoDailyEventsLoggedHint onGoToLog={goToLog} />
                    )}
              </section>
              <TagColorPicker
                key={colorPickerTag ?? 'closed'}
                color={(() => {
                  if (!colorPickerTag) return '#ffffff'
                  const key = colorPickerTag.trim().toLowerCase()
                  return tagColors[key] ?? tagColorPalette[0]
                })()}
                isOpen={!!colorPickerTag}
                title={t('insights.changeTagColorTitle')}
                description={t('insights.changeTagColorDescription')}
                confirmLabel={t('common.save')}
                cancelLabel={t('common.cancel')}
                onCancel={() => setColorPickerTag(null)}
                onConfirm={(nextColor) => {
                  if (colorPickerTag) {
                    onTagColorChange(colorPickerTag, nextColor)
                  }
                  setColorPickerTag(null)
                }}
              />
              {hasEnoughEntries && (
                <InsightsTagInsights
                  isPro={isPro}
                  tagDrivers={tagDrivers}
                  tagSleepDrivers={tagSleepDrivers}
                  onOpenPaywall={onOpenPaywall}
                  goToLog={goToLog}
                />
              )}
            </motion.div>
          )
        : null}
      {activeTab === 'timeline'
        ? (
            <motion.div
              className="insights-panel"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={panelTransition}
            >
              <section className="card">
                <div className="card-header">
                  <div>
                    <h2>{t('nav.timeline')}</h2>
                    <p className="muted">{t('insights.timelineComingSoon')}</p>
                  </div>
                </div>
              </section>
            </motion.div>
          )
        : null}
    </>
  )
}
