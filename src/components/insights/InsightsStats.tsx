import type { SleepMoodAverages, WindowStats } from '../../lib/types/stats'
import { formatSleepHours } from '../../lib/utils/sleepHours'
import { Tooltip } from '../Tooltip'

type InsightsStatsProps = {
  isLoading: boolean
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
  correlationLabel: string | null
  correlationDirection: string | null
  moodBySleepThreshold: { high: number | null, low: number | null }
  sleepThreshold: number
}

export const InsightsStats = ({
  isLoading,
  averages,
  windowAverages,
  rhythmScore,
  streak,
  sleepConsistencyLabel,
  correlationLabel,
  correlationDirection,
  moodBySleepThreshold,
  sleepThreshold,
}: InsightsStatsProps) => {
  const renderTopStat = (label: string, value: string) => (
    <div className={isLoading ? 'stat-block' : undefined}>
      <p className="label">{label}</p>
      {isLoading ? <div className="skeleton-line" /> : <p className="value">{value}</p>}
    </div>
  )

  return (
    <>
      <section className="card stats">
        {renderTopStat(
          'Average sleep',
          averages.sleep !== null ? formatSleepHours(averages.sleep) : '—',
        )}
        {renderTopStat(
          'Average mood',
          `${averages.mood !== null ? averages.mood.toFixed(1) : '—'} / 5`,
        )}
      </section>

      <section className="card stats-stack">
        {isLoading
          ? (
              <>
                {[1, 2, 3, 4, 5, 6, 7].map(item => (
                  <div className="stat-block" key={item}>
                    <div className="skeleton-line" />
                    <div className="skeleton-line short" />
                  </div>
                ))}
              </>
            )
          : (
              <>
                <div className="stat-block">
                  <p className="label">Last 7 days</p>
                  <p className="value">
                    {windowAverages.last7.sleep !== null
                      && windowAverages.last7.mood !== null
                      ? `${formatSleepHours(windowAverages.last7.sleep)} / ${windowAverages.last7.mood.toFixed(1)}`
                      : '—'}
                  </p>
                  <p className="helper">
                    Sleep avg / Mood avg · {windowAverages.last7.count} entries
                  </p>
                </div>
                <div className="stat-divider" aria-hidden />
                <div className="stat-block">
                  <p className="label">Last 30 days</p>
                  <p className="value">
                    {windowAverages.last30.sleep !== null
                      && windowAverages.last30.mood !== null
                      ? `${formatSleepHours(windowAverages.last30.sleep)} / ${windowAverages.last30.mood.toFixed(1)}`
                      : '—'}
                  </p>
                  <p className="helper">
                    Sleep avg / Mood avg · {windowAverages.last30.count} entries
                  </p>
                </div>
                <div className="stat-divider" aria-hidden />
                <div className="stat-block">
                  <p className="label">Streak</p>
                  <p className="value">
                    {streak} days
                  </p>
                  <p className="helper">Consecutive days logged</p>
                </div>
                <div className="stat-divider" aria-hidden />
                <div className="stat-block">
                  <p className="label">
                    Rhythm score
                    <Tooltip label="What is this? Based on how steady your sleep hours are in the last 30 days. Higher = more consistent.">
                      <span className="tooltip-trigger">
                        <span className="tooltip-icon" aria-hidden="true">i</span>
                      </span>
                    </Tooltip>
                  </p>
                  <p className="value">
                    {rhythmScore !== null ? `${rhythmScore} / 100` : '—'}
                  </p>
                  <p className="helper">Sleep stability over the last 30 days</p>
                </div>
                <div className="stat-divider" aria-hidden />
                <div className="stat-block">
                  <p className="label">Sleep consistency</p>
                  <p className="value">{sleepConsistencyLabel ?? '—'}</p>
                  <p className="helper">How steady your sleep hours are</p>
                </div>
                <div className="stat-divider" aria-hidden />
                <div className="stat-block">
                  <p className="label">Sleep–mood link</p>
                  <p className="value">{correlationLabel ?? '—'}</p>
                  {correlationDirection
                    ? (
                        <p className="helper">{correlationDirection}</p>
                      )
                    : null}
                </div>
                <div className="stat-divider" aria-hidden />
                <div className="stat-block">
                  <p className="label">Mood by sleep</p>
                  <p className="value">
                    {moodBySleepThreshold.high !== null
                      || moodBySleepThreshold.low !== null
                      ? `≥${formatSleepHours(sleepThreshold)} ${moodBySleepThreshold.high?.toFixed(1) ?? '—'} / <${formatSleepHours(sleepThreshold)} ${moodBySleepThreshold.low?.toFixed(1) ?? '—'}`
                      : '—'}
                  </p>
                  <p className="helper">
                    Avg mood split at {formatSleepHours(sleepThreshold)}
                  </p>
                </div>
              </>
            )}
      </section>
    </>
  )
}
