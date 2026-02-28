import { formatSleepHours } from '../../lib/utils/sleepHours'
import { useTranslation } from 'react-i18next'
import { TrendingDown, TrendingUp } from 'lucide-react'
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
  const { t } = useTranslation()
  const hasThreshold = typeof personalSleepThreshold === 'number'
  const lowMood = moodByPersonalThreshold.low
  const highMood = moodByPersonalThreshold.high
  const hasMoodAverages = lowMood !== null && highMood !== null
  const isAboveMoodHigher = hasMoodAverages ? highMood >= lowMood : false
  const aboveMoodToneClass = isAboveMoodHigher
    ? 'ideal-sleep-mood-comparison__item--high'
    : 'ideal-sleep-mood-comparison__item--down'
  const belowMoodToneClass = 'ideal-sleep-mood-comparison__item--low'
  const moodDeltaPercent = hasMoodAverages && lowMood > 0
    ? ((highMood - lowMood) / lowMood) * 100
    : null
  const isMoodDeltaPositive = moodDeltaPercent !== null && moodDeltaPercent >= 0
  const moodDeltaDirection = moodDeltaPercent !== null && moodDeltaPercent < 0
    ? t('insights.worseMoodAbove')
    : t('insights.betterMoodAbove')
  const shouldShowReduceSleepMessage = moodDeltaPercent !== null
    && moodDeltaPercent < 0
    && entryCount > 21

  return (
    <section className={`card ${!isPro ? 'pro-locked' : ''}`}>
      <div className="card-header">
        <div>
          <h2>
            {t('insights.idealSleepTarget')}
          </h2>
          <p className="muted">
            {t('insights.idealSleepSubtitle')}
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
                      <p className="label">{t('insights.target')}</p>
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
                              {t('insights.moodWhenAbove', { threshold: formatSleepHours(personalSleepThreshold) })}
                            </span>
                          </div>
                          <span className="ideal-sleep-mood-comparison__divider" aria-hidden="true" />
                          <div className={`ideal-sleep-mood-comparison__item ${belowMoodToneClass}`}>
                            <span className="ideal-sleep-mood-comparison__circle">
                              {lowMood.toFixed(1)}
                            </span>
                            <span className="ideal-sleep-mood-comparison__label">
                              {t('insights.moodWhenBelow', { threshold: formatSleepHours(personalSleepThreshold) })}
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
                              {moodDeltaDirection}
                            </p>
                            {shouldShowReduceSleepMessage && (
                              <p className="helper ideal-sleep-mood-delta__helper ideal-sleep-mood-delta__helper--advice">
                                {t('insights.reduceSleepAdvice')}
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )
                  : (
                      <p className="helper">
                        {t('insights.logMoreForAboveBelow', { threshold: formatSleepHours(personalSleepThreshold) })}
                      </p>
                    )}
              </div>
            )
          : (
              <div className="stat-block">
                <p className="muted">
                  {t('insights.notEnoughDataYet')}{' '}
                  <button type="button" className="link-button link-button--text" onClick={goToLog}>
                    {t('insights.logMoreDays')}
                  </button>
                  {' '}{t('insights.estimateThreshold')}
                </p>
              </div>
            )}
    </section>
  )
}
