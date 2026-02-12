import type { SleepMoodAverages, WindowStats } from '../../lib/types/stats'
import { formatSleepHours } from '../../lib/utils/sleepHours'
import { Tooltip } from '../Tooltip'
import flame from '../../assets/flame.png'

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
  goToLog: () => void
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
  goToLog,
}: InsightsStatsProps) => {
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
          Sleep avg / Mood avg · {window.count} entries
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

  return (
    <>
      <section className="card streak-card">
        <img className="streak-card__image" src={flame} alt="flame" />
        <div className="streak-card__content">
          <p className="label">Streak</p>
          {isLoading ? <div className="skeleton-line" /> : <p className="value">{streak} days</p>}
          <p className="helper">Consecutive logged days</p>
        </div>
      </section>
      <section className="card stats">
        {renderTopStat(
          'Average sleep',
          averages.sleep !== null ? formatSleepHours(averages.sleep) : '—',
          averages.sleep !== null ? (averages.sleep / sleepThreshold) * 100 : null,
          'stat-block--sleep',
        )}
        {renderTopStat(
          'Average mood',
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
                  Log a few more days
                </button>
                {' '}to unlock all stats
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
                  {renderWindowTile('Last 7 days', windowAverages.last7)}
                  {renderWindowTile('Last 30 days', windowAverages.last30)}
                  <div className="stat-tile">
                    <p className="label label--with-tooltip">
                      Rhythm score
                      <Tooltip label="Score based on how steady your sleep hours are in the last 30 days. Higher score = more consistent.">
                        <span className="tooltip-trigger">
                          <span className="tooltip-icon" aria-hidden="true">i</span>
                        </span>
                      </Tooltip>
                    </p>
                    <p className="value">{rhythmScore !== null ? `${rhythmScore} / 100` : '—'}</p>
                    <p className="helper">
                      {rhythmScore !== null
                        ? 'Sleep stability over the last 30 days'
                        : 'Needs 5 nights'}
                    </p>
                  </div>
                  <div className="stat-tile">
                    <p className="label">Sleep consistency</p>
                    <p className="value">{sleepConsistencyLabel ?? '—'}</p>
                    <p className="helper">
                      {sleepConsistencyLabel
                        ? 'How steady your sleep hours are'
                        : 'Needs 2 nights'}
                    </p>
                  </div>
                  <div className="stat-tile">
                    <p className="label">Sleep–mood link</p>
                    <p className="value">{correlationLabel ?? '—'}</p>
                    {correlationDirection
                      ? <p className="helper">{correlationDirection}</p>
                      : (
                          <p className="helper">
                            {correlationLabel ? 'Correlation strength' : 'Needs 2 nights'}
                          </p>
                        )}
                  </div>
                  <div className="stat-tile">
                    <p className="label">Mood by sleep</p>
                    {moodBySleepThreshold.high !== null
                      || moodBySleepThreshold.low !== null
                      ? (
                          <div className="ideal-sleep-mood-delta">
                            <span className="ideal-sleep-mood-delta__pill ideal-sleep-mood-delta__pill--high">
                              ≥{formatSleepHours(sleepThreshold)} → {moodBySleepThreshold.high?.toFixed(1) ?? '—'}
                            </span>
                            <span className="ideal-sleep-mood-delta__arrow" aria-hidden="true">-</span>
                            <span className="ideal-sleep-mood-delta__pill ideal-sleep-mood-delta__pill--low">
                              &lt;{formatSleepHours(sleepThreshold)} → {moodBySleepThreshold.low?.toFixed(1) ?? '—'}
                            </span>
                          </div>
                        )
                      : <p className="value">—</p>}
                    {moodBySleepThreshold.high !== null
                      || moodBySleepThreshold.low !== null
                      ? (
                          <p className="helper">
                            Average mood for days above vs below {formatSleepHours(sleepThreshold)}
                          </p>
                        )
                      : (
                          <p className="helper">Needs 5 nights</p>
                        )}
                  </div>
                </>
              )}
        </div>
      </section>
    </>
  )
}
