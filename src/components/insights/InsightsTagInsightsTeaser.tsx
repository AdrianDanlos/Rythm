import { buildMockTagDrivers, buildMockTagSleepDrivers } from '../../lib/insightsMock'
import { Tooltip } from '../Tooltip'

type InsightsTagInsightsTeaserProps = {
  onOpenPaywall: () => void
}

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

export const InsightsTagInsightsTeaser = ({ onOpenPaywall }: InsightsTagInsightsTeaserProps) => {
  const mockTagDrivers = buildMockTagDrivers()
  const mockTagSleepDrivers = buildMockTagSleepDrivers()
  const mockPositiveDrivers = [...mockTagDrivers]
    .filter(d => typeof d.delta === 'number' && d.delta > 0)
    .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))
    .slice(0, 2)
  const mockNegativeDrivers = [...mockTagDrivers]
    .filter(d => typeof d.delta === 'number' && d.delta < 0)
    .sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0))
    .slice(0, 2)
  const mockPositiveSleepDrivers = [...mockTagSleepDrivers]
    .filter(d => typeof d.delta === 'number' && d.delta > 0)
    .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))
    .slice(0, 2)
  const mockNegativeSleepDrivers = [...mockTagSleepDrivers]
    .filter(d => typeof d.delta === 'number' && d.delta < 0)
    .sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0))
    .slice(0, 2)
  const mockMaxAbsDelta = Math.max(
    0,
    ...mockPositiveDrivers.map(d => Math.abs(d.delta ?? 0)),
    ...mockNegativeDrivers.map(d => Math.abs(d.delta ?? 0)),
  )
  const mockMaxAbsSleepDelta = Math.max(
    0,
    ...mockPositiveSleepDrivers.map(d => Math.abs(d.delta ?? 0)),
    ...mockNegativeSleepDrivers.map(d => Math.abs(d.delta ?? 0)),
  )
  const mockBuildDeltaWidth = (delta: number | null) => {
    if (delta === null || mockMaxAbsDelta === 0) return 0
    return Math.min(100, Math.max(0, (Math.abs(delta) / mockMaxAbsDelta) * 100))
  }
  const mockBuildSleepDeltaWidth = (delta: number | null) => {
    if (delta === null || mockMaxAbsSleepDelta === 0) return 0
    return Math.min(100, Math.max(0, (Math.abs(delta) / mockMaxAbsSleepDelta) * 100))
  }

  return (
    <div className="tag-insights-teaser premium-preview">
      <div className="premium-preview__blur">
        <div className="tag-insights-block">
          <div className="tag-insights-block-header">
            <h3 className="tag-insights-block-title">Events that predict mood</h3>
            <Tooltip label="Compares mood on days with an event vs without it.">
              <span className="tooltip-trigger">
                <span className="tooltip-icon" aria-hidden="true">i</span>
              </span>
            </Tooltip>
          </div>
          {mockPositiveDrivers.length > 0 && (
            <div className="tag-driver-section">
              <p className="label">Positive</p>
              <div className="tag-bar-list">
                {mockPositiveDrivers.map(tag => (
                  <div className="tag-bar-item positive" key={tag.tag}>
                    <div className="tag-bar-header">
                      <p className="tag-title">{tag.tag}</p>
                      <p className="tag-delta tag-delta--pc">{formatDelta(tag.delta)} mood</p>
                    </div>
                    <div className="tag-bar-delta-and-track">
                      <p className="tag-delta tag-delta--mobile">{formatDelta(tag.delta)} mood</p>
                      <div className="tag-bar-track" aria-hidden="true">
                        <span
                          className="tag-bar-fill"
                          style={{ width: `${mockBuildDeltaWidth(tag.delta)}%` }}
                        />
                      </div>
                    </div>
                    <p className="helper">{tag.count} entries</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {mockNegativeDrivers.length > 0 && (
            <div className="tag-driver-section">
              <p className="label">Negative</p>
              <div className="tag-bar-list">
                {mockNegativeDrivers.map(tag => (
                  <div className="tag-bar-item negative" key={tag.tag}>
                    <div className="tag-bar-header">
                      <p className="tag-title">{tag.tag}</p>
                      <p className="tag-delta tag-delta--pc">{formatDelta(tag.delta)} mood</p>
                    </div>
                    <div className="tag-bar-delta-and-track">
                      <p className="tag-delta tag-delta--mobile">{formatDelta(tag.delta)} mood</p>
                      <div className="tag-bar-track" aria-hidden="true">
                        <span
                          className="tag-bar-fill"
                          style={{ width: `${mockBuildDeltaWidth(tag.delta)}%` }}
                        />
                      </div>
                    </div>
                    <p className="helper">{tag.count} entries</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="tag-insights-block">
          <div className="tag-insights-block-header">
            <h3 className="tag-insights-block-title">Events that predict sleep</h3>
            <Tooltip label="Predict how much these events will affect your sleep tonight.">
              <span className="tooltip-trigger">
                <span className="tooltip-icon" aria-hidden="true">i</span>
              </span>
            </Tooltip>
          </div>
          {mockPositiveSleepDrivers.length > 0 && (
            <div className="tag-driver-section">
              <p className="label">More sleep after</p>
              <div className="tag-bar-list">
                {mockPositiveSleepDrivers.map(d => (
                  <div className="tag-bar-item positive" key={d.tag}>
                    <div className="tag-bar-header">
                      <p className="tag-title">{d.tag}</p>
                      <p className="tag-delta tag-delta--pc">{formatSleepDelta(d.delta)}</p>
                    </div>
                    <div className="tag-bar-delta-and-track">
                      <p className="tag-delta tag-delta--mobile">{formatSleepDelta(d.delta)}</p>
                      <div className="tag-bar-track" aria-hidden="true">
                        <span
                          className="tag-bar-fill"
                          style={{ width: `${mockBuildSleepDeltaWidth(d.delta)}%` }}
                        />
                      </div>
                    </div>
                    <p className="helper">{d.count} nights</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {mockNegativeSleepDrivers.length > 0 && (
            <div className="tag-driver-section">
              <p className="label">Less sleep after</p>
              <div className="tag-bar-list">
                {mockNegativeSleepDrivers.map(d => (
                  <div className="tag-bar-item negative" key={d.tag}>
                    <div className="tag-bar-header">
                      <p className="tag-title">{d.tag}</p>
                      <p className="tag-delta tag-delta--pc">{formatSleepDelta(d.delta)}</p>
                    </div>
                    <div className="tag-bar-delta-and-track">
                      <p className="tag-delta tag-delta--mobile">{formatSleepDelta(d.delta)}</p>
                      <div className="tag-bar-track" aria-hidden="true">
                        <span
                          className="tag-bar-fill"
                          style={{ width: `${mockBuildSleepDeltaWidth(d.delta)}%` }}
                        />
                      </div>
                    </div>
                    <p className="helper">{d.count} nights</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="premium-preview__overlay">
        <div className="locked-message">
          <button type="button" className="ghost cta-ghost" onClick={onOpenPaywall}>
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
  )
}
