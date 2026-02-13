import type { TagDriver, TagSleepDriver } from '../../lib/types/stats'
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
          aria-label={isUp ? 'Increase' : 'Decrease'}
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
          aria-label={isUp ? 'Increase' : 'Decrease'}
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
              <p className="helper">{d.count} entries</p>
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
          <h2>Event Insights</h2>
          <p className="muted">See how what happens during the day influences your mood and sleep over time.</p>
        </div>
      </div>
      {!isPro
        ? <InsightsTagInsightsTeaser onOpenPaywall={onOpenPaywall} />
        : (hasDrivers || hasSleepDrivers)
            ? (
                <>
                  <div className="tag-insights-block">
                    <div className="tag-insights-block-header">
                      <h3 className="tag-insights-block-title">Events that predict mood</h3>
                      <Tooltip label="Compares mood on days with an event vs without it.">
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
                                <p className="label">Positive</p>
                                <div className="tag-bar-list">
                                  {positiveDrivers.map(tag => (
                                    <div className="tag-bar-item positive" key={tag.tag}>
                                      <div className="tag-bar-header">
                                        <p className="tag-title">{tag.tag}</p>
                                        <p className="tag-delta tag-delta--pc">{renderDeltaPercent(moodDeltaPercent(tag))} mood</p>
                                      </div>
                                      <div className="tag-bar-delta-and-track">
                                        <p className="tag-delta tag-delta--mobile">{renderDeltaPercent(moodDeltaPercent(tag))} mood</p>
                                        <div className="tag-bar-track" aria-hidden="true">
                                          <span
                                            className="tag-bar-fill"
                                            style={{ width: `${buildDeltaWidth(tag.delta)}%` }}
                                          />
                                        </div>
                                      </div>
                                      <p className="helper">{tag.count} entries</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {negativeDrivers.length > 0 && (
                              <div className="tag-driver-section">
                                <p className="label">Negative</p>
                                <div className="tag-bar-list">
                                  {negativeDrivers.map(tag => (
                                    <div className="tag-bar-item negative" key={tag.tag}>
                                      <div className="tag-bar-header">
                                        <p className="tag-title">{tag.tag}</p>
                                        <p className="tag-delta tag-delta--pc">{renderDeltaPercent(moodDeltaPercent(tag))} mood</p>
                                      </div>
                                      <div className="tag-bar-delta-and-track">
                                        <p className="tag-delta tag-delta--mobile">{renderDeltaPercent(moodDeltaPercent(tag))} mood</p>
                                        <div className="tag-bar-track" aria-hidden="true">
                                          <span
                                            className="tag-bar-fill"
                                            style={{ width: `${buildDeltaWidth(tag.delta)}%` }}
                                          />
                                        </div>
                                      </div>
                                      <p className="helper">{tag.count} entries</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )
                      : (
                          <p className="muted">Add events to see mood impact (min 3 entries per event).</p>
                        )}
                  </div>
                  <div className="tag-insights-block">
                    <div className="tag-insights-block-header">
                      <h3 className="tag-insights-block-title">Events that predict sleep</h3>
                      <Tooltip label="Compares sleep on days with an event vs without it.">
                        <span className="tooltip-trigger">
                          <span className="tooltip-icon" aria-hidden="true">i</span>
                        </span>
                      </Tooltip>
                    </div>
                    {(positiveSleepDrivers.length > 0 || negativeSleepDrivers.length > 0)
                      ? (
                          <>
                            {renderSleepDriverSection('More sleep after', 'positive', positiveSleepDrivers)}
                            {renderSleepDriverSection('Less sleep after', 'negative', negativeSleepDrivers)}
                          </>
                        )
                      : (
                          <p className="muted">Add events to see sleep impact (min 3 entries per event).</p>
                        )}
                  </div>
                </>
              )
            : (
                <p className="muted">
                  <button type="button" className="link-button link-button--text" onClick={goToLog}>Add events</button>
                  {' '}to see how each one changes your mood and sleep <strong>(at least {DEFAULT_TAG_DRIVER_MIN_COUNT} entries per event).</strong>
                </p>
              )}
    </section>
  )
}
