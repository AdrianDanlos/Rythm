import type { TagDriver, TagSleepDriver } from '../../lib/types/stats'
import { useTranslation } from 'react-i18next'
import { DEFAULT_TAG_DRIVER_MIN_COUNT } from '../../lib/utils/tagInsights'
import { formatSleepHours } from '../../lib/utils/sleepHours'
import { Tooltip } from '../Tooltip'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { InsightsTagInsightsTeaser } from './InsightsTagInsightsTeaser'

type InsightsTagInsightsProps = {
  isPro: boolean
  tagDrivers: TagDriver[]
  tagSleepDrivers: TagSleepDriver[]
  onOpenPaywall: () => void
  goToLog: () => void
}

export const InsightsTagInsights = ({
  isPro,
  tagDrivers,
  tagSleepDrivers,
  onOpenPaywall,
  goToLog,
}: InsightsTagInsightsProps) => {
  const { t } = useTranslation()
  const positiveDrivers = [...tagDrivers]
    .filter(driver => typeof driver.delta === 'number' && driver.delta > 0)
    .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))
    .slice(0, 2)
  const negativeDrivers = [...tagDrivers]
    .filter(driver => typeof driver.delta === 'number' && driver.delta < 0)
    .sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0))
    .slice(0, 2)
  const hasDrivers = positiveDrivers.length > 0 || negativeDrivers.length > 0

  const positiveSleepDrivers = [...tagSleepDrivers]
    .filter(d => typeof d.delta === 'number' && d.delta > 0)
    .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))
    .slice(0, 2)
  const negativeSleepDrivers = [...tagSleepDrivers]
    .filter(d => typeof d.delta === 'number' && d.delta < 0)
    .sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0))
    .slice(0, 2)
  const hasSleepDrivers = positiveSleepDrivers.length > 0 || negativeSleepDrivers.length > 0

  const moodDeltaPercent = (tag: TagDriver): number | null => {
    if (tag.delta === null || tag.moodWithout === null || tag.moodWithout === 0) return null
    return (tag.delta / tag.moodWithout) * 100
  }

  const renderSleepDelta = (delta: number | null) => {
    if (delta === null) return '—'
    const isUp = delta >= 0
    const Icon = isUp ? TrendingUp : TrendingDown
    const formatted = formatSleepHours(Math.abs(delta))
    const sign = delta >= 0 ? '+' : '−'
    return (
      <span className="tag-delta-value">
        <span className={isUp ? 'mood-by-sleep-percent--up' : 'mood-by-sleep-percent--down'}>
          {sign}{formatted}
        </span>
        <span
          className={`mood-by-sleep-trend ${isUp ? 'mood-by-sleep-trend--up' : 'mood-by-sleep-trend--down'}`}
          aria-label={isUp ? t('insights.increaseAria') : t('insights.decreaseAria')}
          role="img"
        >
          <Icon size={16} aria-hidden="true" />
        </span>
      </span>
    )
  }

  const renderDeltaPercent = (percent: number | null) => {
    if (percent === null) return '—'
    const isUp = percent >= 0
    const Icon = isUp ? TrendingUp : TrendingDown
    return (
      <span className="tag-delta-value">
        <span className={isUp ? 'mood-by-sleep-percent--up' : 'mood-by-sleep-percent--down'}>
          {Math.abs(percent).toFixed(0)}%
        </span>
        <span
          className={`mood-by-sleep-trend ${isUp ? 'mood-by-sleep-trend--up' : 'mood-by-sleep-trend--down'}`}
          aria-label={isUp ? t('insights.increaseAria') : t('insights.decreaseAria')}
          role="img"
        >
          <Icon size={16} aria-hidden="true" />
        </span>
      </span>
    )
  }

  const maxAbsDelta = Math.max(
    0,
    ...positiveDrivers.map(driver => Math.abs(driver.delta ?? 0)),
    ...negativeDrivers.map(driver => Math.abs(driver.delta ?? 0)),
  )

  const maxAbsSleepDelta = Math.max(
    0,
    ...positiveSleepDrivers.map(d => Math.abs(d.delta ?? 0)),
    ...negativeSleepDrivers.map(d => Math.abs(d.delta ?? 0)),
  )

  const buildDeltaWidth = (delta: number | null) => {
    if (delta === null || maxAbsDelta === 0) return 0
    return Math.min(100, Math.max(0, (Math.abs(delta) / maxAbsDelta) * 100))
  }

  const buildSleepDeltaWidth = (delta: number | null) => {
    if (delta === null || maxAbsSleepDelta === 0) return 0
    return Math.min(100, Math.max(0, (Math.abs(delta) / maxAbsSleepDelta) * 100))
  }

  const renderSleepDriverSection = (
    label: string,
    variant: 'positive' | 'negative',
    drivers: TagSleepDriver[],
  ) => {
    if (drivers.length === 0) return null
    return (
      <div className="tag-driver-section">
        <p className="label">{label}</p>
        <div className="tag-bar-list">
          {drivers.map(d => (
            <div className={`tag-bar-item ${variant}`} key={d.tag}>
              <div className="tag-bar-header">
                <p className="tag-title">{d.tag}</p>
                <p className="tag-delta tag-delta--pc">{renderSleepDelta(d.delta)}</p>
              </div>
              <div className="tag-bar-delta-and-track">
                <p className="tag-delta tag-delta--mobile">{renderSleepDelta(d.delta)}</p>
                <div className="tag-bar-track" aria-hidden="true">
                  <span
                    className="tag-bar-fill"
                    style={{ width: `${buildSleepDeltaWidth(d.delta)}%` }}
                  />
                </div>
              </div>
              <p className="helper">{t('insights.entriesSuffix', { count: d.count })}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <section className={`card ${!isPro ? 'pro-locked' : ''}`}>
      <div className="card-header">
        <div>
          <h2>{t('insights.dailyEventsInsights')}</h2>
          <p className="muted">{t('insights.eventsInfluence')}</p>
        </div>
      </div>
      {!isPro
        ? <InsightsTagInsightsTeaser onOpenPaywall={onOpenPaywall} />
        : (hasDrivers || hasSleepDrivers)
            ? (
                <>
                  <div className="tag-insights-block">
                    <div className="tag-insights-block-header">
                      <h3 className="tag-insights-block-title">{t('insights.eventsPredictMood')}</h3>
                      <Tooltip label={t('insights.compareMoodWithWithout')}>
                        <span className="tooltip-trigger">
                          <span className="tooltip-icon" aria-hidden="true">i</span>
                        </span>
                      </Tooltip>
                    </div>
                    {(positiveDrivers.length > 0 || negativeDrivers.length > 0)
                      ? (
                          <>
                            {positiveDrivers.length > 0 && (
                              <div className="tag-driver-section">
                                <p className="label">{t('insights.positive')}</p>
                                <div className="tag-bar-list">
                                  {positiveDrivers.map(tag => (
                                    <div className="tag-bar-item positive" key={tag.tag}>
                                      <div className="tag-bar-header">
                                        <p className="tag-title">{tag.tag}</p>
                                        <p className="tag-delta tag-delta--pc">{renderDeltaPercent(moodDeltaPercent(tag))} {t('insights.moodSuffix')}</p>
                                      </div>
                                      <div className="tag-bar-delta-and-track">
                                        <p className="tag-delta tag-delta--mobile">{renderDeltaPercent(moodDeltaPercent(tag))} {t('insights.moodSuffix')}</p>
                                        <div className="tag-bar-track" aria-hidden="true">
                                          <span
                                            className="tag-bar-fill"
                                            style={{ width: `${buildDeltaWidth(tag.delta)}%` }}
                                          />
                                        </div>
                                      </div>
                                      <p className="helper">{t('insights.entriesSuffix', { count: tag.count })}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {negativeDrivers.length > 0 && (
                              <div className="tag-driver-section">
                                <p className="label">{t('insights.negative')}</p>
                                <div className="tag-bar-list">
                                  {negativeDrivers.map(tag => (
                                    <div className="tag-bar-item negative" key={tag.tag}>
                                      <div className="tag-bar-header">
                                        <p className="tag-title">{tag.tag}</p>
                                        <p className="tag-delta tag-delta--pc">{renderDeltaPercent(moodDeltaPercent(tag))} {t('insights.moodSuffix')}</p>
                                      </div>
                                      <div className="tag-bar-delta-and-track">
                                        <p className="tag-delta tag-delta--mobile">{renderDeltaPercent(moodDeltaPercent(tag))} {t('insights.moodSuffix')}</p>
                                        <div className="tag-bar-track" aria-hidden="true">
                                          <span
                                            className="tag-bar-fill"
                                            style={{ width: `${buildDeltaWidth(tag.delta)}%` }}
                                          />
                                        </div>
                                      </div>
                                      <p className="helper">{t('insights.entriesSuffix', { count: tag.count })}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )
                      : (
                          <p className="muted">{t('insights.addEventsToSeeMoodImpact')}</p>
                        )}
                  </div>
                  <div className="tag-insights-block">
                    <div className="tag-insights-block-header">
                      <h3 className="tag-insights-block-title">{t('insights.eventsPredictSleep')}</h3>
                      <Tooltip label={t('insights.compareSleepWithWithout')}>
                        <span className="tooltip-trigger">
                          <span className="tooltip-icon" aria-hidden="true">i</span>
                        </span>
                      </Tooltip>
                    </div>
                    {(positiveSleepDrivers.length > 0 || negativeSleepDrivers.length > 0)
                      ? (
                          <>
                            {renderSleepDriverSection(t('insights.moreSleepAfter'), 'positive', positiveSleepDrivers)}
                            {renderSleepDriverSection(t('insights.lessSleepAfter'), 'negative', negativeSleepDrivers)}
                          </>
                        )
                      : (
                          <p className="muted">{t('insights.addEventsToSeeSleepImpact')}</p>
                        )}
                  </div>
                </>
              )
            : (
                <p className="muted">
                  <button type="button" className="link-button link-button--text" onClick={goToLog}>{t('insights.addDailyEvents')}</button>
                  {' '}{t('insights.addEventsToUnlock', { count: DEFAULT_TAG_DRIVER_MIN_COUNT })}
                </p>
              )}
    </section>
  )
}
