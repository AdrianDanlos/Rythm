import type { StatCounts } from '../../lib/stats'
import { useTranslation } from 'react-i18next'
import type { SleepMoodAverages, WindowStats } from '../../lib/types/stats'
import { formatSleepHours } from '../../lib/utils/sleepHours'
import { Tooltip } from '../Tooltip'
import { Flame, TrendingDown, TrendingUp } from 'lucide-react'

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
  moodBySleepBucketCounts: { high: number, low: number }
  sleepThreshold: number
  isPro: boolean
  goToLog: () => void
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
  moodBySleepBucketCounts,
  sleepThreshold,
  isPro,
  goToLog,
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
  const moodBySleepDirection = moodBySleepDeltaPercent !== null && moodBySleepDeltaPercent < 0
    ? t('insights.moodLower')
    : t('insights.moodBetter')
  const moodBySleepMessage = moodBySleepDeltaPercent !== null
    ? t('insights.moodWhenSleepMore', {
        threshold: formatSleepHours(sleepThreshold),
        direction: moodBySleepDirection,
        percent: Math.abs(moodBySleepDeltaPercent).toFixed(0),
      })
    : null

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
    const value = window.sleep !== null && window.mood !== null
      ? `${formatSleepHours(window.sleep)} / ${window.mood.toFixed(1)}`
      : '—'

    return (
      <div className="stat-tile">
        <p className="label">{label}</p>
        <p className="value">{value}</p>
        <p className="helper">
          {t('insights.avgSleep')} / {t('insights.avgMood')} · {t('insights.entriesSuffix', { count: window.count })}
        </p>
      </div>
    )
  }

  const hasMissingStats = !isLoading && (
    rhythmScore === null
    || sleepConsistencyLabel === null
    || correlationLabel === null
    || (moodBySleepThreshold.high === null && moodBySleepThreshold.low === null)
  )
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
          <p className="helper">{t('insights.consecutiveDays')}</p>
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

      <section className="card stats-stack">
        {hasMissingStats
          ? (
              <p className="muted">
                <button type="button" className="link-button link-button--text" onClick={goToLog}>
                  {t('insights.logFewMoreDays')}
                </button>
                {' '}{t('insights.unlockAllStats')}
              </p>
            )
          : null}
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
                    <p className="label label--with-tooltip">
                      {t('insights.rhythmScore')}
                      <Tooltip label={t('insights.rhythmTooltip')}>
                        <span className="tooltip-trigger">
                          <span className="tooltip-icon" aria-hidden="true">i</span>
                        </span>
                      </Tooltip>
                    </p>
                    <p className="value">{rhythmScore !== null ? `${rhythmScore} / 100` : '—'}</p>
                    <p className="helper">
                      {rhythmScore !== null
                        ? t('insights.sleepStability30')
                        : t('insights.needsMoreDays', { count: rhythmMore, unit: rhythmMore === 1 ? t('common.day') : t('common.days') })}
                    </p>
                  </div>
                  <div className="stat-tile">
                    <p className="label">{t('insights.sleepConsistency')}</p>
                    <p className="value">{sleepConsistencyLabel ?? '—'}</p>
                    <p className="helper">
                      {sleepConsistencyLabel
                        ? t('insights.sleepConsistencyHelper')
                        : t('insights.needsMoreDays', { count: sleepConsistencyMore, unit: sleepConsistencyMore === 1 ? t('common.day') : t('common.days') })}
                    </p>
                  </div>
                  <div className="stat-tile">
                    <p className="label">{t('insights.sleepMoodLink')}</p>
                    <p className="value">{correlationLabel ?? '—'}</p>
                    {correlationDirection
                      ? <p className="helper">{correlationDirection}</p>
                      : (
                          <p className="helper">
                            {correlationLabel
                              ? t('insights.correlationStrength')
                              : correlationMore > 0
                                ? t('insights.needsMoreDays', { count: correlationMore, unit: correlationMore === 1 ? t('common.day') : t('common.days') })
                                : t('insights.logDifferentDaysForLink')}
                          </p>
                        )}
                  </div>
                  <div className="stat-tile">
                    <p className="label label--with-tooltip">
                      <span className="label-nowrap">{t('insights.moodBySleepTitle', { threshold: formatSleepHours(sleepThreshold) })}</span>
                      {shouldShowIdealSleepTooltip && (
                        <Tooltip
                          label={t('insights.moodBySleepTooltip', { threshold: formatSleepHours(sleepThreshold) })}
                        >
                          <span className="tooltip-trigger">
                            <span className="tooltip-icon" aria-hidden="true">i</span>
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
                              aria-label={isMoodBySleepPositive ? 'Mood trend up' : 'Mood trend down'}
                              role="img"
                            >
                              {isMoodBySleepPositive
                                ? <TrendingUp size={20} aria-hidden="true" />
                                : <TrendingDown size={20} aria-hidden="true" />}
                            </span>
                          </p>
                        )
                      : <p className="value">—</p>}
                    <p className="helper">
                      {moodBySleepMessage ?? (moodBySleepBucketCounts.high === 0
                        ? t('insights.needOneDayMoreThan', { threshold: formatSleepHours(sleepThreshold) })
                        : moodBySleepBucketCounts.low === 0
                          ? t('insights.needOneDayLessThan', { threshold: formatSleepHours(sleepThreshold) })
                          : null)}
                    </p>
                  </div>
                </>
              )}
        </div>
      </section>
    </>
  )
}
