import { formatSleepHours } from '../../lib/utils/sleepHours'
import { Tooltip } from '../Tooltip'
import { IdeaSleepTargetTeaser } from './IdeaSleepTargetTeaser'

type IdeaSleepTargetProps = {
  isPro: boolean
  personalSleepThreshold: number | null
  moodByPersonalThreshold: { high: number | null, low: number | null }
  onOpenPaywall: () => void
  goToLog: () => void
}

export const IdeaSleepTarget = ({
  isPro,
  personalSleepThreshold,
  moodByPersonalThreshold,
  onOpenPaywall,
  goToLog,
}: IdeaSleepTargetProps) => {
  const hasThreshold = typeof personalSleepThreshold === 'number'
  const hasMoodData
    = moodByPersonalThreshold.high !== null || moodByPersonalThreshold.low !== null
  const moodDelta
    = hasMoodData && moodByPersonalThreshold.high != null && moodByPersonalThreshold.low != null
      ? moodByPersonalThreshold.high - moodByPersonalThreshold.low
      : null

  return (
    <section className={`card ${!isPro ? 'pro-locked' : ''}`}>
      <div className="card-header">
        <div>
          <h2>
            Your ideal sleep target
            <Tooltip label="What is this? An estimated sleep target tied to your best mood days.">
              <span className="tooltip-trigger">
                <span className="tooltip-icon" aria-hidden="true">i</span>
              </span>
            </Tooltip>
          </h2>
          <p className="muted">
            Finds your ideal target sleep time based on your sleep history.
          </p>
        </div>
      </div>
      {!isPro
        ? <IdeaSleepTargetTeaser onOpenPaywall={onOpenPaywall} />
        : hasThreshold
          ? (
              <div className="ideal-sleep-target-content">
                <div className="stat-block stat-block--ring stat-block--sleep ideal-sleep-target-ring">
                  <div
                    className="stat-ring"
                    style={{ ['--stat-progress' as string]: '100%' }}
                  >
                    <div className="stat-ring__inner">
                      <p className="label">Target</p>
                      <p className="value">{formatSleepHours(personalSleepThreshold)}</p>
                    </div>
                  </div>
                </div>
                {hasMoodData && (
                  <div className="ideal-sleep-mood-delta">
                    <span className="ideal-sleep-mood-delta__pill ideal-sleep-mood-delta__pill--high">
                      ≥{formatSleepHours(personalSleepThreshold)} → {moodByPersonalThreshold.high?.toFixed(1) ?? '—'}
                    </span>
                    <span className="ideal-sleep-mood-delta__arrow" aria-hidden="true">-</span>
                    <span className="ideal-sleep-mood-delta__pill ideal-sleep-mood-delta__pill--low">
                      &lt;{formatSleepHours(personalSleepThreshold)} → {moodByPersonalThreshold.low?.toFixed(1) ?? '—'}
                    </span>
                    {moodDelta !== null && (
                      <span className="ideal-sleep-mood-delta__badge">
                        +{moodDelta.toFixed(1)} mood when above target
                      </span>
                    )}
                  </div>
                )}
                {!hasMoodData && (
                  <p className="helper">
                    Log more days to see average mood above vs below {formatSleepHours(personalSleepThreshold)}
                  </p>
                )}
              </div>
            )
          : (
              <div className="stat-block">
                <p className="muted">
                  Not enough data yet.{' '}
                  <button type="button" className="link-button link-button--text" onClick={goToLog}>
                    Log more days
                  </button>
                  {' '}to estimate your personal threshold.
                </p>
              </div>
            )}
    </section>
  )
}
