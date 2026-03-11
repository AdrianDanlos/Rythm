import { formatSleepHours } from '../../lib/utils/sleepHours'
import { useTranslation } from 'react-i18next'
import { MoonStar, TrendingDown, TrendingUp } from 'lucide-react'
import { IdeaSleepTargetTeaser } from './IdeaSleepTargetTeaser'

type IdeaSleepTargetProps = {
  isPro: boolean
  entryCount: number
  personalSleepThreshold: number | null
  averageSleep: number | null
  moodByPersonalThreshold: { high: number | null, low: number | null }
  onOpenPaywall: () => void
  goToLog: () => void
}

export const IdeaSleepTarget = ({
  isPro,
  entryCount,
  personalSleepThreshold,
  averageSleep,
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
  const progressToTarget = hasThreshold && averageSleep !== null
    ? Math.min(100, (averageSleep / personalSleepThreshold) * 100)
    : null
  const isInOptimalRange = progressToTarget !== null && progressToTarget >= 100
  const optimalRangeTitle = isInOptimalRange
    ? t('insights.optimalRangeTitle')
    : t('insights.notOptimalRangeTitle')
  const optimalRangeBody = isInOptimalRange
    ? t('insights.optimalRangeBody')
    : t('insights.notOptimalRangeBody')

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
                <div className="ideal-sleep-target-card__header">
                  <div className="ideal-sleep-target-card__icon streak-card__image" aria-hidden="true">
                    <MoonStar className="streak-card__icon" />
                  </div>
                  <div className="ideal-sleep-target-card__text">
                    <p className="ideal-sleep-target-card__title">
                      {t('common.recommended')}
                    </p>
                  </div>
                  <p className="ideal-sleep-target-card__value">
                    {formatSleepHours(personalSleepThreshold)}
                  </p>
                </div>
                <div className="ideal-sleep-target-card__progress">
                  <div className="ideal-sleep-target-card__progress-header">
                    <p className="ideal-sleep-target-card__progress-label">
                      {t('insights.progressToTargetLabel')}
                    </p>
                    <p className="ideal-sleep-target-card__progress-value">
                      {progressToTarget !== null ? `${Math.round(progressToTarget)}%` : '—'}
                    </p>
                  </div>
                  <div className="ideal-sleep-target-card__progress-track">
                    <div
                      className="ideal-sleep-target-card__progress-fill"
                      style={{ width: `${progressToTarget !== null ? progressToTarget : 0}%` }}
                    />
                  </div>
                </div>
                <div className="ideal-sleep-target-card__message ideal-sleep-target-card__message--success">
                  <p className="ideal-sleep-target-card__message-title">
                    {optimalRangeTitle}
                  </p>
                  <p className="ideal-sleep-target-card__message-body">
                    {optimalRangeBody}
                  </p>
                </div>
                {hasMoodAverages
                  ? (
                      <>
                        <div className="ideal-sleep-mood-comparison" role="group" aria-label={t('insights.moodByPersonalSleepThresholdAria')}>
                          <div className={`ideal-sleep-mood-comparison__item ${aboveMoodToneClass}`}>
                            <span className="ideal-sleep-mood-comparison__label">
                              {t('insights.moodWhenAbove', { threshold: formatSleepHours(personalSleepThreshold) })}
                            </span>
                            <span className="ideal-sleep-mood-comparison__circle">
                              {highMood.toFixed(1)}
                            </span>
                          </div>
                          <span className="ideal-sleep-mood-comparison__divider" aria-hidden="true" />
                          <div className={`ideal-sleep-mood-comparison__item ${belowMoodToneClass}`}>
                            <span className="ideal-sleep-mood-comparison__label">
                              {t('insights.moodWhenBelow', { threshold: formatSleepHours(personalSleepThreshold) })}
                            </span>
                            <span className="ideal-sleep-mood-comparison__circle">
                              {lowMood.toFixed(1)}
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
                                aria-label={isMoodDeltaPositive ? t('insights.moodTrendUp') : t('insights.moodTrendDown')}
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
