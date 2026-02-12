import { formatSleepHours } from '../../lib/utils/sleepHours'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Tooltip } from '../Tooltip'
import { IdeaSleepTargetTeaser } from './IdeaSleepTargetTeaser'

type IdeaSleepTargetProps = {
  isPro: boolean
  entryCount: number
  personalSleepThreshold: number | null
  moodByPersonalThreshold: { high: number | null, low: number | null }
  onOpenPaywall: () => void
  goToLog: () => void
}

export const IdeaSleepTarget = ({
  isPro,
  entryCount,
  personalSleepThreshold,
  moodByPersonalThreshold,
  onOpenPaywall,
  goToLog,
}: IdeaSleepTargetProps) => {
  const hasThreshold = typeof personalSleepThreshold === 'number'
  const lowMood = moodByPersonalThreshold.low
  const highMood = moodByPersonalThreshold.high
  const hasMoodAverages = lowMood !== null && highMood !== null
  const isAboveMoodHigher = hasMoodAverages ? highMood >= lowMood : true
  const aboveMoodToneClass = isAboveMoodHigher
    ? 'ideal-sleep-mood-comparison__item--high'
    : 'ideal-sleep-mood-comparison__item--low'
  const belowMoodToneClass = isAboveMoodHigher
    ? 'ideal-sleep-mood-comparison__item--low'
    : 'ideal-sleep-mood-comparison__item--high'
  const moodDeltaPercent = hasMoodAverages && lowMood > 0
    ? ((highMood - lowMood) / lowMood) * 100
    : null
  const isMoodDeltaPositive = moodDeltaPercent !== null && moodDeltaPercent >= 0
  const moodDeltaDirection = moodDeltaPercent !== null && moodDeltaPercent < 0
    ? 'Worse'
    : 'Better'
  const shouldShowReduceSleepMessage = moodDeltaPercent !== null
    && moodDeltaPercent < 0
    && entryCount > 21

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
                {hasMoodAverages
                  ? (
                      <>
                        <div className="ideal-sleep-mood-comparison" role="group" aria-label="Mood by personal sleep threshold">
                          <div className={`ideal-sleep-mood-comparison__item ${aboveMoodToneClass}`}>
                            <span className="ideal-sleep-mood-comparison__circle">
                              {highMood.toFixed(1)}
                            </span>
                            <span className="ideal-sleep-mood-comparison__label">
                              Mood when sleep above {formatSleepHours(personalSleepThreshold)}
                            </span>
                          </div>
                          <span className="ideal-sleep-mood-comparison__divider" aria-hidden="true" />
                          <div className={`ideal-sleep-mood-comparison__item ${belowMoodToneClass}`}>
                            <span className="ideal-sleep-mood-comparison__circle">
                              {lowMood.toFixed(1)}
                            </span>
                            <span className="ideal-sleep-mood-comparison__label">
                              Mood when sleep below {formatSleepHours(personalSleepThreshold)}
                            </span>
                          </div>
                        </div>
                        {moodDeltaPercent !== null && (
                          <div className="ideal-sleep-mood-delta">
                            <p className="ideal-sleep-mood-delta__value mood-by-sleep-value">
                              <span className={isMoodDeltaPositive ? 'mood-by-sleep-percent--up' : 'mood-by-sleep-percent--down'}>
                                {Math.abs(moodDeltaPercent).toFixed(0)}%
                              </span>
                              <span
                                className={`mood-by-sleep-trend ${isMoodDeltaPositive ? 'mood-by-sleep-trend--up' : 'mood-by-sleep-trend--down'}`}
                                aria-label={isMoodDeltaPositive ? 'Mood trend up' : 'Mood trend down'}
                                role="img"
                              >
                                {isMoodDeltaPositive
                                  ? <TrendingUp size={16} aria-hidden="true" />
                                  : <TrendingDown size={16} aria-hidden="true" />}
                              </span>
                            </p>
                            <p className="helper ideal-sleep-mood-delta__helper">
                              {moodDeltaDirection} mood on average when above target
                            </p>
                            {shouldShowReduceSleepMessage && (
                              <p className="helper ideal-sleep-mood-delta__helper ideal-sleep-mood-delta__helper--advice">
                                It looks like you are sleeping more hours than what your body needs, try slightly reducing your sleep time
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )
                  : (
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
