import type { TagDriver } from '../../lib/types/stats'
import { DEFAULT_TAG_DRIVER_MIN_COUNT } from '../../lib/utils/tagInsights'

type InsightsTagInsightsProps = {
  isPro: boolean
  tagDrivers: TagDriver[]
  onOpenPaywall: () => void
}

export const InsightsTagInsights = ({
  isPro,
  tagDrivers,
  onOpenPaywall,
}: InsightsTagInsightsProps) => {
  const positiveDrivers = [...tagDrivers]
    .filter(driver => typeof driver.delta === 'number' && driver.delta > 0)
    .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))
    .slice(0, 4)
  const negativeDrivers = [...tagDrivers]
    .filter(driver => typeof driver.delta === 'number' && driver.delta < 0)
    .sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0))
    .slice(0, 4)
  const hasDrivers = positiveDrivers.length > 0 || negativeDrivers.length > 0

  const formatDelta = (delta: number | null) => {
    if (delta === null) return '—'
    const sign = delta >= 0 ? '+' : ''
    return `${sign}${delta.toFixed(1)} mood vs days without`
  }

  return (
    <section className={`card ${!isPro ? 'pro-locked' : ''}`}>
      <div className="card-header">
        <div>
          <h2>Tag Insights</h2>
          <p className="muted">Impact of tags on your mood and sleep</p>
        </div>
      </div>
      {!isPro
        ? (
            <div className="locked-message">
              <p className="muted">Finds the tags that have the biggest impact on your mood and sleep.</p>
              <button type="button" className="ghost cta-ghost" onClick={onOpenPaywall}>
                Upgrade to Pro
              </button>
            </div>
          )
        : hasDrivers
          ? (
              <>
                {positiveDrivers.length
                  ? (
                      <div className="tag-driver-section">
                        <p className="label">Top positive tags</p>
                        <div className="tag-grid">
                          {positiveDrivers.map(tag => (
                            <div className="tag-card" key={tag.tag}>
                              <p className="tag-title">{tag.tag}</p>
                              <p className="helper">
                                {formatDelta(tag.delta)} · {tag.count} entries
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  : null}
                {negativeDrivers.length
                  ? (
                      <div className="tag-driver-section">
                        <p className="label">Top negative tags</p>
                        <div className="tag-grid">
                          {negativeDrivers.map(tag => (
                            <div className="tag-card" key={tag.tag}>
                              <p className="tag-title">{tag.tag}</p>
                              <p className="helper">
                                {formatDelta(tag.delta)} · {tag.count} entries
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  : null}
              </>
            )
          : (
              <p className="muted">
                {`Add tags on your daily logs (at least ${DEFAULT_TAG_DRIVER_MIN_COUNT} entries per tag) to see patterns.`}

              </p>
            )}
    </section>
  )
}
