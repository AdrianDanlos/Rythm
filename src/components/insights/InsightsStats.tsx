import type { StatCounts } from '../../lib/stats'
import { useTranslation } from 'react-i18next'
import type { SleepMoodAverages, WindowStats } from '../../lib/types/stats'
import { formatSleepHours } from '../../lib/utils/sleepHours'
import { Tooltip } from '../Tooltip'
import { Equal, Flame, Info, TrendingDown, TrendingUp } from 'lucide-react'

const RHYTHM_NEED = 5
const SLEEP_CONSISTENCY_NEED = 2
const CORRELATION_NEED = 5

type InsightsStatsProps = {
  isLoading: boolean
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
  correlationLabel: string | null
  correlationDirection: string | null
  moodBySleepThreshold: { high: number | null, low: number | null }
  sleepThreshold: number
  isPro: boolean
  motivationMessage: string
}

export const InsightsStats = ({
  isLoading,
  averages,
  windowAverages,
  statCounts,
  rhythmScore,
  streak,
  sleepConsistencyLabel,
  correlationLabel,
  correlationDirection,
  moodBySleepThreshold,
  sleepThreshold,
  isPro,
  motivationMessage,
}: InsightsStatsProps) => {
  const { t } = useTranslation()
  const rhythmMore = Math.max(0, RHYTHM_NEED - statCounts.last30WithSleep)
  const sleepConsistencyMore = Math.max(0, SLEEP_CONSISTENCY_NEED - statCounts.sleepEntries)
  const correlationMore = Math.max(0, CORRELATION_NEED - statCounts.completeEntries)
  const moodBySleepHigh = moodBySleepThreshold.high
  const moodBySleepLow = moodBySleepThreshold.low
  const moodBySleepDeltaPercent = moodBySleepHigh !== null && moodBySleepLow !== null
    ? (moodBySleepLow > 0
        ? ((moodBySleepHigh - moodBySleepLow) / moodBySleepLow) * 100
        : 0)
    : null
  const isMoodBySleepPositive = moodBySleepDeltaPercent !== null && moodBySleepDeltaPercent >= 0

  const renderTopStat = (
    label: string,
    value: string,
    progress: number | null,
    toneClass: string,
  ) => {
    const ringStyle = progress === null
      ? undefined
      : { ['--stat-progress' as string]: `${Math.min(100, Math.max(0, progress))}%` }

    return (
      <div className={`stat-block stat-block--ring ${toneClass}`}>
        <div className="stat-ring" style={ringStyle}>
          <div className="stat-ring__inner">
            <p className="label">{label}</p>
            {isLoading ? <div className="skeleton-line" /> : <p className="value">{value}</p>}
          </div>
        </div>
      </div>
    )
  }

  const renderWindowTile = (
    label: string,
    window: WindowStats,
  ) => {
    const canShowEqualsVsAverage = statCounts.totalEntries >= 30
    const buildDeltaPercent = (value: number | null, avg: number | null) => {
      if (value === null || avg === null || avg <= 0) {
        return null
      }
      return ((value - avg) / avg) * 100
    }

    const sleepDeltaMinutes
      = window.sleep !== null && averages.sleep !== null
        ? Math.round((window.sleep - averages.sleep) * 60)
        : null
    const showSleepDelta
      = sleepDeltaMinutes !== null
        && (sleepDeltaMinutes !== 0 || canShowEqualsVsAverage)
    const moodDeltaPercent = buildDeltaPercent(window.mood, averages.mood)
    const moodDeltaRounded = moodDeltaPercent !== null ? Math.round(Math.abs(moodDeltaPercent)) : null
    const showMoodDelta
      = moodDeltaPercent !== null
        && moodDeltaRounded !== null
        && (moodDeltaRounded !== 0 || canShowEqualsVsAverage)

    return (
      <div className="stat-tile">
        <p className="label">{label}</p>
        <div className="window-averages">
          <div className="window-average-row">
            <p className="helper">{t('insights.averageSleep')}</p>
            <p className="value window-average-value">
              {window.sleep !== null
                ? (
                    <>
                      <span>{formatSleepHours(window.sleep)}</span>
                      {showSleepDelta && (
                        <span
                          className={
                            sleepDeltaMinutes === 0
                              ? 'window-average-delta window-average-delta--flat'
                              : `window-average-delta ${sleepDeltaMinutes > 0 ? 'window-average-delta--up' : 'window-average-delta--down'}`
                          }
                          aria-label={sleepDeltaMinutes === 0 ? t('insights.sameAsOverallAverage') : undefined}
                        >
                          {sleepDeltaMinutes === 0
                            ? (
                                <Equal className="window-average-delta__eq" size={16} aria-hidden="true" />
                              )
                            : sleepDeltaMinutes > 0
                              ? <TrendingUp size={16} aria-hidden="true" />
                              : <TrendingDown size={16} aria-hidden="true" />}
                          {sleepDeltaMinutes !== 0 && (
                            <span>{t('insights.sleepDeltaMinutes', { count: Math.abs(sleepDeltaMinutes) })}</span>
                          )}
                        </span>
                      )}
                    </>
                  )
                : '—'}
            </p>
          </div>
          <div className="window-average-row">
            <p className="helper">{t('insights.averageMood')}</p>
            <p className="value window-average-value">
              {window.mood !== null
                ? (
                    <>
                      <span>{window.mood.toFixed(1)} / 5</span>
                      {showMoodDelta && (
                        <span
                          className={
                            moodDeltaRounded === 0
                              ? 'window-average-delta window-average-delta--flat'
                              : `window-average-delta ${moodDeltaPercent > 0 ? 'window-average-delta--up' : 'window-average-delta--down'}`
                          }
                          aria-label={moodDeltaRounded === 0 ? t('insights.sameAsOverallAverage') : undefined}
                        >
                          {moodDeltaRounded === 0
                            ? (
                                <Equal className="window-average-delta__eq" size={16} aria-hidden="true" />
                              )
                            : moodDeltaPercent > 0
                              ? <TrendingUp size={16} aria-hidden="true" />
                              : <TrendingDown size={16} aria-hidden="true" />}
                          {moodDeltaRounded !== 0 && <span>{moodDeltaRounded}%</span>}
                        </span>
                      )}
                    </>
                  )
                : '—'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const shouldShowIdealSleepTooltip = !isLoading
    && !isPro
    && moodBySleepDeltaPercent !== null

  return (
    <>
      <section className="card streak-card">
        <div className="streak-card__image">
          <Flame className="streak-card__icon" size={48} aria-hidden />
        </div>
        <div className="streak-card__content">
          <p className="label">{t('insights.streak')}</p>
          {isLoading
            ? <div className="skeleton-line" />
            : <p className="value">{streak} {streak === 1 ? t('common.day') : t('common.days')}</p>}
        </div>
        {(isLoading || motivationMessage)
          ? (
              <div className="streak-card__motivation" aria-live="polite">
                {isLoading ? <div className="skeleton-line" /> : motivationMessage}
              </div>
            )
          : null}
      </section>
      <section className="card stats">
        {renderTopStat(
          t('insights.averageSleep'),
          averages.sleep !== null ? formatSleepHours(averages.sleep) : '—',
          averages.sleep !== null ? (averages.sleep / sleepThreshold) * 100 : null,
          'stat-block--sleep',
        )}
        {renderTopStat(
          t('insights.averageMood'),
          `${averages.mood !== null ? averages.mood.toFixed(1) : '—'} / 5`,
          averages.mood !== null ? (averages.mood / 5) * 100 : null,
          'stat-block--mood',
        )}
      </section>

      <div className="stats-stack-grid">
        {isLoading
          ? (
              <>
                {[1, 2, 3, 4, 5, 6, 7].map(item => (
                  <div className="stat-tile stat-tile--skeleton" key={item}>
                    <div className="skeleton-line" />
                    <div className="skeleton-line short" />
                    <div className="skeleton-line" />
                  </div>
                ))}
              </>
            )
          : (
              <>
                {renderWindowTile(t('insights.last7Days'), windowAverages.last7)}
                {renderWindowTile(t('insights.last30Days'), windowAverages.last30)}
                <div className="stat-tile">
                  <p className="label">{t('insights.rhythmScore')}</p>
                  <p className="value">{rhythmScore !== null ? `${rhythmScore} / 100` : '—'}</p>
                  <p className="helper">
                    {rhythmScore !== null
                      ? t('insights.sleepStability30')
                      : t('insights.needsMoreDays', { count: rhythmMore, unit: rhythmMore === 1 ? t('common.day') : t('common.days') })}
                  </p>
                </div>
                <div className="stat-tile">
                  <p className="label">{t('insights.consistency')}</p>
                  <p className="value">{sleepConsistencyLabel ? t(`insights.sleepConsistencyLevels.${sleepConsistencyLabel}`) : '—'}</p>
                  <p className="helper">
                    {sleepConsistencyLabel
                      ? t('insights.sleepConsistencyHelper')
                      : t('insights.needsMoreDays', { count: sleepConsistencyMore, unit: sleepConsistencyMore === 1 ? t('common.day') : t('common.days') })}
                  </p>
                </div>
                <div className="stat-tile">
                  <p className="label label--pre-line">{t('insights.sleepMoodLink')}</p>
                  <p className="value">{correlationLabel ? t(`insights.correlationLevels.${correlationLabel}`) : '—'}</p>
                  {correlationDirection
                    ? (
                        <p className="helper">{t(`insights.correlationDirections.${correlationDirection}`)}</p>
                      )
                    : correlationLabel
                      ? (
                          <p className="helper">{t('insights.correlationStrength')}</p>
                        )
                      : correlationMore > 0
                        ? (
                            <p className="helper">
                              {t('insights.needsMoreDays', { count: correlationMore, unit: correlationMore === 1 ? t('common.day') : t('common.days') })}
                            </p>
                          )
                        : null}
                </div>
                <div className="stat-tile">
                  <p className="label label--with-tooltip">
                    <span className="label-nowrap">{t('insights.moodBySleepTitle', { threshold: formatSleepHours(sleepThreshold) })}</span>
                    {shouldShowIdealSleepTooltip && (
                      <Tooltip
                        label={t('insights.moodBySleepTooltip', { threshold: formatSleepHours(sleepThreshold) })}
                      >
                        <span className="tooltip-trigger">
                          <span className="tooltip-icon" aria-hidden="true">
                            <Info size={14} />
                          </span>
                        </span>
                      </Tooltip>
                    )}
                  </p>
                  {moodBySleepDeltaPercent !== null
                    ? (
                        <p className="value mood-by-sleep-value">
                          <span className={isMoodBySleepPositive ? 'mood-by-sleep-percent mood-by-sleep-percent--up' : 'mood-by-sleep-percent mood-by-sleep-percent--down'}>
                            {Math.abs(moodBySleepDeltaPercent).toFixed(0)}%
                          </span>
                          <span
                            className={`mood-by-sleep-trend ${isMoodBySleepPositive ? 'mood-by-sleep-trend--up' : 'mood-by-sleep-trend--down'}`}
                            aria-label={isMoodBySleepPositive ? t('insights.moodTrendUp') : t('insights.moodTrendDown')}
                            role="img"
                          >
                            {isMoodBySleepPositive
                              ? <TrendingUp size={20} aria-hidden="true" />
                              : <TrendingDown size={20} aria-hidden="true" />}
                          </span>
                        </p>
                      )
                    : <p className="value">—</p>}
                  {moodBySleepDeltaPercent !== null
                    ? (
                        <p className="helper">
                          {t(isMoodBySleepPositive ? 'insights.moodBySleepSubtitleUp' : 'insights.moodBySleepSubtitleDown')}
                        </p>
                      )
                    : null}
                  {moodBySleepDeltaPercent === null
                    ? <p className="helper">{t('insights.logMoreDays')}</p>
                    : null}
                </div>
              </>
            )}
      </div>
    </>
  )
}
