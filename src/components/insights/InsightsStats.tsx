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
          Sleep avg / Mood avg · {window.count} entries
        </p>
      </div>
    )
  }

  return (
    <>
      <section className="card streak-card">
        <div className="streak-card__content">
          <p className="label">Streak</p>
          {isLoading ? <div className="skeleton-line" /> : <p className="value">{streak} days</p>}
          <p className="helper">Consecutive days logged</p>
        </div>
      </section>
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
                  {renderWindowTile('Last 7 days', windowAverages.last7)}
                  {renderWindowTile('Last 30 days', windowAverages.last30)}
                  <div className="stat-tile">
                    <p className="label">
                      Rhythm score
                      <Tooltip label="What is this? Based on how steady your sleep hours are in the last 30 days. Higher = more consistent.">
                        <span className="tooltip-trigger">
                          <span className="tooltip-icon" aria-hidden="true">i</span>
                        </span>
                      </Tooltip>
                    </p>
                    <p className="value">{rhythmScore !== null ? `${rhythmScore} / 100` : '—'}</p>
                    <p className="helper">Sleep stability over the last 30 days</p>
                  </div>
                  <div className="stat-tile">
                    <p className="label">Sleep consistency</p>
                    <p className="value">{sleepConsistencyLabel ?? '—'}</p>
                    <p className="helper">How steady your sleep hours are</p>
                  </div>
                  <div className="stat-tile">
                    <p className="label">Sleep–mood link</p>
                    <p className="value">{correlationLabel ?? '—'}</p>
                    {correlationDirection
                      ? <p className="helper">{correlationDirection}</p>
                      : <p className="helper">Correlation strength</p>}
                  </div>
                  <div className="stat-tile">
                    <p className="label">Mood by sleep</p>
                    {moodBySleepThreshold.high !== null
                      || moodBySleepThreshold.low !== null
                      ? (
                          <p className="helper helper-inline">
                            <span className="helper-break" aria-hidden="true" />
                            <span className="helper-tag">
                              ≥{formatSleepHours(sleepThreshold)}
                            </span>
                            <span className="helper-tag helper-pill-value">
                              {moodBySleepThreshold.high?.toFixed(1) ?? '—'}
                            </span>
                            <span className="helper-sep helper-sep--desktop">vs</span>
                            <span className="helper-tag">
                              &lt;{formatSleepHours(sleepThreshold)}
                            </span>
                            <span className="helper-tag helper-pill-value">
                              {moodBySleepThreshold.low?.toFixed(1) ?? '—'}
                            </span>
                          </p>
                        )
                      : <p className="value">—</p>}
                    {moodBySleepThreshold.high !== null
                      || moodBySleepThreshold.low !== null
                      ? (
                          <p className="helper">
                            Average mood for days above vs below 8h
                          </p>
                        )
                      : null}
                  </div>
                </>
              )}
        </div>
      </section>
    </>
  )
}
