import { formatSleepHours } from '../../lib/utils/sleepHours'
import { useTranslation } from 'react-i18next'
import { TrendingUp } from 'lucide-react'

type IdeaSleepTargetTeaserProps = {
  onOpenPaywall: () => void
}

const MOCK_THRESHOLD = 7.5
const MOCK_MOOD_HIGH = 3.8
const MOCK_MOOD_LOW = 3.1
const MOCK_DELTA_PERCENT = ((MOCK_MOOD_HIGH - MOCK_MOOD_LOW) / MOCK_MOOD_LOW) * 100
const IS_MOCK_ABOVE_HIGHER = MOCK_MOOD_HIGH >= MOCK_MOOD_LOW
const MOCK_ABOVE_TONE_CLASS = IS_MOCK_ABOVE_HIGHER
  ? 'ideal-sleep-mood-comparison__item--high'
  : 'ideal-sleep-mood-comparison__item--low'
const MOCK_BELOW_TONE_CLASS = IS_MOCK_ABOVE_HIGHER
  ? 'ideal-sleep-mood-comparison__item--low'
  : 'ideal-sleep-mood-comparison__item--high'

export const IdeaSleepTargetTeaser = ({ onOpenPaywall }: IdeaSleepTargetTeaserProps) => {
  const { t } = useTranslation()
  return (
    <div className="ideal-sleep-target-teaser premium-preview">
      <div className="premium-preview__blur">
        <div className="ideal-sleep-target-content">
          <div className="stat-block stat-block--ring stat-block--sleep ideal-sleep-target-ring">
            <div
              className="stat-ring"
              style={{ ['--stat-progress' as string]: '100%' }}
            >
              <div className="stat-ring__inner">
                <p className="label">{t('insights.target')}</p>
                <p className="value">{formatSleepHours(MOCK_THRESHOLD)}</p>
              </div>
            </div>
          </div>
          <div
            className="ideal-sleep-mood-comparison"
            role="group"
            aria-label={t('insights.moodBySleepTitle', { threshold: formatSleepHours(MOCK_THRESHOLD) })}
          >
            <div className={`ideal-sleep-mood-comparison__item ${MOCK_ABOVE_TONE_CLASS}`}>
              <span className="ideal-sleep-mood-comparison__circle">
                {MOCK_MOOD_HIGH.toFixed(1)}
              </span>
              <span className="ideal-sleep-mood-comparison__label">
                {t('insights.moodWhenAbove', { threshold: formatSleepHours(MOCK_THRESHOLD) })}
              </span>
            </div>
            <span className="ideal-sleep-mood-comparison__divider" aria-hidden="true" />
            <div className={`ideal-sleep-mood-comparison__item ${MOCK_BELOW_TONE_CLASS}`}>
              <span className="ideal-sleep-mood-comparison__circle">
                {MOCK_MOOD_LOW.toFixed(1)}
              </span>
              <span className="ideal-sleep-mood-comparison__label">
                {t('insights.moodWhenBelow', { threshold: formatSleepHours(MOCK_THRESHOLD) })}
              </span>
            </div>
          </div>
          <div className="ideal-sleep-mood-delta">
            <p className="ideal-sleep-mood-delta__value mood-by-sleep-value">
              <span className="mood-by-sleep-percent--up">
                {Math.abs(MOCK_DELTA_PERCENT).toFixed(0)}%
              </span>
              <span className="mood-by-sleep-trend mood-by-sleep-trend--up" aria-label={t('insights.moodTrendUp')} role="img">
                <TrendingUp size={16} aria-hidden="true" />
              </span>
            </p>
            <p className="helper ideal-sleep-mood-delta__helper">{t('insights.betterMoodAbove')}</p>
          </div>
        </div>
      </div>
      <div className="premium-preview__overlay">
        <div className="locked-message">
          <button type="button" className="ghost cta-ghost" onClick={onOpenPaywall}>{t('insights.upgradeToPro')}</button>
        </div>
      </div>
    </div>
  )
}
