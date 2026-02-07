import type { TagDriver, TagSleepDriver } from '../../lib/types/stats'
import { DEFAULT_TAG_DRIVER_MIN_COUNT } from '../../lib/utils/tagInsights'
import { Tooltip } from '../Tooltip'

type InsightsTagInsightsProps = {
  isPro: boolean
  tagDrivers: TagDriver[]
  tagSleepDrivers: TagSleepDriver[]
  onOpenPaywall: () => void
}

export const InsightsTagInsights = ({
  isPro,
  tagDrivers,
  tagSleepDrivers,
  onOpenPaywall,
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

  const formatDelta = (delta: number | null) => {
    if (delta === null) return '—'
    const sign = delta >= 0 ? '+' : ''
    return `${sign}${delta.toFixed(1)}`
  }

  const formatSleepDelta = (delta: number | null) => {
    if (delta === null) return '—'
    const sign = delta >= 0 ? '+' : ''
    return `${sign}${delta.toFixed(1)}h`
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

  return (
    <section className={`card ${!isPro ? 'pro-locked' : ''}`}>
      <div className="card-header">
        <div>
          <h2>Tag Insights</h2>
          <p className="muted">Tags that predict mood (same day) and sleep (day before).</p>
        </div>
      </div>
      {!isPro
        ? (
            <div className="locked-message">
              <button type="button" className="ghost cta-ghost" onClick={onOpenPaywall}>
                Upgrade to Pro
              </button>
            </div>
          )
        : (hasDrivers || hasSleepDrivers)
          ? (
              <>
                <div className="tag-insights-block">
                  <div className="tag-insights-block-header">
                    <h3 className="tag-insights-block-title">Tags that predict mood</h3>
                    <Tooltip label="Compares mood on days with a tag vs without it (same day).">
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
                                      <p className="tag-delta">{formatDelta(tag.delta)} mood</p>
                                    </div>
                                    <div className="tag-bar-track" aria-hidden="true">
                                      <span
                                        className="tag-bar-fill"
                                        style={{ width: `${buildDeltaWidth(tag.delta)}%` }}
                                      />
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
                                      <p className="tag-delta">{formatDelta(tag.delta)} mood</p>
                                    </div>
                                    <div className="tag-bar-track" aria-hidden="true">
                                      <span
                                        className="tag-bar-fill"
                                        style={{ width: `${buildDeltaWidth(tag.delta)}%` }}
                                      />
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
                        <p className="muted">Add tags to see mood impact (min 3 entries per tag).</p>
                      )}
                </div>
                <div className="tag-insights-block">
                  <div className="tag-insights-block-header">
                    <h3 className="tag-insights-block-title">Tags that predict sleep</h3>
                    <Tooltip label="Tags from the day before: how they relate to that night's sleep.">
                      <span className="tooltip-trigger">
                        <span className="tooltip-icon" aria-hidden="true">i</span>
                      </span>
                    </Tooltip>
                  </div>
                  {(positiveSleepDrivers.length > 0 || negativeSleepDrivers.length > 0)
                    ? (
                        <>
                          {positiveSleepDrivers.length > 0 && (
                            <div className="tag-driver-section">
                              <p className="label">More sleep after</p>
                              <div className="tag-bar-list">
                                {positiveSleepDrivers.map(d => (
                                  <div className="tag-bar-item positive" key={d.tag}>
                                    <div className="tag-bar-header">
                                      <p className="tag-title">{d.tag}</p>
                                      <p className="tag-delta">{formatSleepDelta(d.delta)}</p>
                                    </div>
                                    <div className="tag-bar-track" aria-hidden="true">
                                      <span
                                        className="tag-bar-fill"
                                        style={{ width: `${buildSleepDeltaWidth(d.delta)}%` }}
                                      />
                                    </div>
                                    <p className="helper">{d.count} nights</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {negativeSleepDrivers.length > 0 && (
                            <div className="tag-driver-section">
                              <p className="label">Less sleep after</p>
                              <div className="tag-bar-list">
                                {negativeSleepDrivers.map(d => (
                                  <div className="tag-bar-item negative" key={d.tag}>
                                    <div className="tag-bar-header">
                                      <p className="tag-title">{d.tag}</p>
                                      <p className="tag-delta">{formatSleepDelta(d.delta)}</p>
                                    </div>
                                    <div className="tag-bar-track" aria-hidden="true">
                                      <span
                                        className="tag-bar-fill"
                                        style={{ width: `${buildSleepDeltaWidth(d.delta)}%` }}
                                      />
                                    </div>
                                    <p className="helper">{d.count} nights</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )
                    : (
                        <p className="muted">Add tags to see sleep impact (min 3 nights per tag).</p>
                      )}
                </div>
              </>
            )
          : (
              <p className="muted">
                {`Add tags to see how each one changes your mood and sleep (at least ${DEFAULT_TAG_DRIVER_MIN_COUNT} entries per tag).`}
              </p>
            )}
    </section>
  )
}
