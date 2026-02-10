import { useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { RollingPoint, RollingSummary } from '../../lib/types/stats'
import { trimToDataExtentRolling } from '../../lib/chartUtils'
import { buildMockRollingSeries } from '../../lib/insightsMock'
import { formatLongDate, formatShortDate } from '../../lib/utils/dateFormatters'
import { rollingTrendColors } from '../../lib/colors'
import { formatSleepHours } from '../../lib/utils/sleepHours'
import { Tooltip } from '../Tooltip'

const ENTRY_THRESHOLD_30 = 7
const ENTRY_THRESHOLD_90 = 30

type InsightsSmoothedTrendsProps = {
  isPro: boolean
  isMobile: boolean
  entryCount: number
  rollingSeries: RollingPoint[]
  rollingSummaries: RollingSummary[]
  onOpenPaywall: () => void
  goToLog: () => void
}

const formatLineValue = (value: number | string) => {
  if (value === null || value === undefined) return '—'
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric.toFixed(1) : '—'
}

const formatAxisValue = (value: number | string) => {
  const formatted = formatLineValue(value)
  return formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted
}

const formatSleepAxisValue = (value: number | string) => {
  if (value === null || value === undefined) return '—'
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? formatSleepHours(numeric) : '—'
}

const formatDeltaValue = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return '—'
  const formatted = value.toFixed(1)
  return value > 0 ? `+${formatted}` : formatted
}

const formatSleepDeltaValue = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return '—'
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${sign}${formatSleepHours(Math.abs(value))}`
}

const getDateTickInterval = (pointCount: number, targetTicks = 6) => {
  if (!pointCount || pointCount <= targetTicks) return 0
  return Math.max(0, Math.ceil(pointCount / targetTicks) - 1)
}

type RollingLegendProps = {
  show30: boolean
  show90: boolean
  wrapperStyle?: React.CSSProperties
}

const RollingLegend = ({ show30, show90, wrapperStyle }: RollingLegendProps) => (
  <div className="rolling-trend-legend" style={wrapperStyle}>
    <span className="rolling-trend-legend__item">
      <span className="rolling-trend-legend__swatch" style={{ background: rollingTrendColors.long }} aria-hidden />
      Last 7 days
    </span>
    <span className={`rolling-trend-legend__item ${!show30 ? 'rolling-trend-legend__item--disabled' : ''}`}>
      <span className="rolling-trend-legend__swatch" style={{ background: rollingTrendColors.mid }} aria-hidden />
      {!show30
        ? (
            <Tooltip label={`Log ${ENTRY_THRESHOLD_30}+ nights to see 30-day trend.`}>
              <span className="tooltip-trigger">Last 30 days</span>
            </Tooltip>
          )
        : 'Last 30 days'}
    </span>
    <span className={`rolling-trend-legend__item ${!show90 ? 'rolling-trend-legend__item--disabled' : ''}`}>
      <span className="rolling-trend-legend__swatch" style={{ background: 'var(--chart-sleep)' }} aria-hidden />
      {!show90
        ? (
            <Tooltip label={`Log ${ENTRY_THRESHOLD_90}+ nights to see 90-day trend.`}>
              <span className="tooltip-trigger">Last 90 days</span>
            </Tooltip>
          )
        : 'Last 90 days'}
    </span>
  </div>
)

export const InsightsSmoothedTrends = ({
  isPro,
  isMobile,
  entryCount,
  rollingSeries,
  rollingSummaries,
  onOpenPaywall,
  goToLog,
}: InsightsSmoothedTrendsProps) => {
  const [rollingMetric, setRollingMetric] = useState<'sleep' | 'mood'>('mood')
  const show30 = entryCount >= ENTRY_THRESHOLD_30
  const show90 = entryCount >= ENTRY_THRESHOLD_90
  const previewRollingSeries = buildMockRollingSeries()
  const trimmedRollingSeries = trimToDataExtentRolling(rollingSeries)
  const trimmedPreviewRolling = trimToDataExtentRolling(previewRollingSeries)
  const smoothedChartMargin = isMobile
    ? { top: 12, right: 0, bottom: 0, left: -34 }
    : { top: 12, right: 28, bottom: 0, left: -12 }
  const rollingTickInterval = getDateTickInterval(trimmedRollingSeries.length)
  const previewRollingTickInterval = getDateTickInterval(trimmedPreviewRolling.length)
  const baseTickProps = { fontSize: 13 }
  const mobileTickProps = isMobile
    ? { angle: -35, textAnchor: 'end' as const, dy: 6, fontSize: 12 }
    : undefined
  const legendWrapperStyle = isMobile ? { paddingTop: 12 } : undefined

  const handleProAction = (action?: () => void) => {
    if (!isPro) {
      onOpenPaywall()
      return
    }
    action?.()
  }

  return (
    <section className={`card ${!isPro ? 'pro-locked' : ''}`}>
      <div className="card-header">
        <div>
          <h2>
            Smoothed trends
            <Tooltip label="What is this? Rolling averages that smooth daily noise to show direction.">
              <span className="tooltip-trigger">
                <span className="tooltip-icon" aria-hidden="true">i</span>
              </span>
            </Tooltip>
          </h2>
          <p className="muted">
            See how your week, month, or 3-month trend is moving
          </p>
        </div>
        <div className="toggle-group">
          <button
            type="button"
            className={`ghost ${rollingMetric === 'mood' ? 'active' : ''}`}
            onClick={() => handleProAction(() => setRollingMetric('mood'))}
          >
            Mood
          </button>
          <button
            type="button"
            className={`ghost ${rollingMetric === 'sleep' ? 'active' : ''}`}
            onClick={() => handleProAction(() => setRollingMetric('sleep'))}
          >
            Sleep
          </button>
        </div>
      </div>
      {!isPro
        ? (
            <div className="premium-preview">
              <div className="premium-preview__blur">
                <div className="chart-wrapper full-bleed">
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart
                      data={trimmedPreviewRolling.length ? trimmedPreviewRolling : previewRollingSeries}
                      margin={smoothedChartMargin}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatShortDate}
                        interval={isMobile
                          ? Math.max(previewRollingTickInterval, 1)
                          : previewRollingTickInterval}
                        tick={isMobile ? mobileTickProps : baseTickProps}
                        height={isMobile ? 36 : 30}
                      />
                      <YAxis
                        tickFormatter={
                          rollingMetric === 'sleep'
                            ? formatSleepAxisValue
                            : formatAxisValue
                        }
                        domain={
                          rollingMetric === 'sleep' ? [4, 10] : [1, 5]
                        }
                        ticks={
                          rollingMetric === 'sleep' ? [4, 6, 8, 10] : [1, 2, 3, 4, 5]
                        }
                        tick={baseTickProps}
                      />
                      <RechartsTooltip
                        labelFormatter={value =>
                          formatLongDate(new Date(`${value}T00:00:00`))}
                        formatter={(value) => {
                          const normalized = Array.isArray(value) ? value[0] : value
                          if (rollingMetric === 'sleep') {
                            const numeric = typeof normalized === 'number'
                              ? normalized
                              : Number(normalized)
                            return Number.isFinite(numeric) ? formatSleepHours(numeric) : '—'
                          }
                          return formatLineValue(normalized ?? '')
                        }}
                        itemSorter={(item) => {
                          const name = String(item.name ?? '')
                          if (name.includes('7')) return 1
                          if (name.includes('30')) return 2
                          if (name.includes('90')) return 3
                          return 99
                        }}
                      />
                      <Legend content={<RollingLegend show30 show90 wrapperStyle={legendWrapperStyle} />} />
                      {rollingMetric === 'sleep'
                        ? (
                            <>
                              <Line
                                type="monotone"
                                dataKey="sleep7"
                                name="Last 7 days"
                                stroke={rollingTrendColors.long}
                                dot={false}
                                strokeWidth={2}
                              />
                              <Line
                                type="monotone"
                                dataKey="sleep30"
                                name="Last 30 days"
                                stroke={rollingTrendColors.mid}
                                dot={false}
                                strokeWidth={2}
                              />
                              <Line
                                type="monotone"
                                dataKey="sleep90"
                                name="Last 90 days"
                                stroke="var(--chart-sleep)"
                                dot={false}
                                strokeWidth={2}
                              />
                            </>
                          )
                        : (
                            <>
                              <Line
                                type="monotone"
                                dataKey="mood7"
                                name="Last 7 days"
                                stroke={rollingTrendColors.long}
                                dot={false}
                                strokeWidth={2}
                              />
                              <Line
                                type="monotone"
                                dataKey="mood30"
                                name="Last 30 days"
                                stroke={rollingTrendColors.mid}
                                dot={false}
                                strokeWidth={2}
                              />
                              <Line
                                type="monotone"
                                dataKey="mood90"
                                name="Last 90 days"
                                stroke="var(--chart-sleep)"
                                dot={false}
                                strokeWidth={2}
                              />
                            </>
                          )}
                    </LineChart>
                  </ResponsiveContainer>
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
        : trimmedRollingSeries.length === 0
          ? (
              <div className="chart-empty">
                <p className="muted">
                  Not enough data for rolling trends.{' '}
                  <button type="button" className="link-button link-button--text" onClick={goToLog}>
                    Log a day
                  </button>
                  {' '}to see smoothed direction.
                </p>
              </div>
            )
          : (
              <>
                <div className="chart-wrapper full-bleed">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart
                      data={trimmedRollingSeries}
                      margin={smoothedChartMargin}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatShortDate}
                        interval={isMobile ? Math.max(rollingTickInterval, 1) : rollingTickInterval}
                        tick={isMobile ? mobileTickProps : baseTickProps}
                        height={isMobile ? 36 : 30}
                      />
                      <YAxis
                        tickFormatter={
                          rollingMetric === 'sleep'
                            ? formatSleepAxisValue
                            : formatAxisValue
                        }
                        domain={
                          rollingMetric === 'sleep' ? [4, 10] : [1, 5]
                        }
                        ticks={
                          rollingMetric === 'sleep' ? [4, 6, 8, 10] : [1, 2, 3, 4, 5]
                        }
                        tick={baseTickProps}
                      />
                      <RechartsTooltip
                        labelFormatter={value =>
                          formatLongDate(new Date(`${value}T00:00:00`))}
                        formatter={(value) => {
                          const normalized = Array.isArray(value) ? value[0] : value
                          if (rollingMetric === 'sleep') {
                            const numeric = typeof normalized === 'number'
                              ? normalized
                              : Number(normalized)
                            return Number.isFinite(numeric) ? formatSleepHours(numeric) : '—'
                          }
                          return formatLineValue(normalized ?? '')
                        }}
                        itemSorter={(item) => {
                          const name = String(item.name ?? '')
                          if (name.includes('7')) return 1
                          if (name.includes('30')) return 2
                          if (name.includes('90')) return 3
                          return 99
                        }}
                      />
                      <Legend content={<RollingLegend show30={show30} show90={show90} wrapperStyle={legendWrapperStyle} />} />
                      {rollingMetric === 'sleep'
                        ? (
                            <>
                              <Line
                                type="monotone"
                                dataKey="sleep7"
                                name="Last 7 days"
                                stroke={rollingTrendColors.long}
                                dot={false}
                                strokeWidth={2}
                              />
                              {show30 && (
                                <Line
                                  type="monotone"
                                  dataKey="sleep30"
                                  name="Last 30 days"
                                  stroke={rollingTrendColors.mid}
                                  dot={false}
                                  strokeWidth={2}
                                />
                              )}
                              {show90 && (
                                <Line
                                  type="monotone"
                                  dataKey="sleep90"
                                  name="Last 90 days"
                                  stroke="var(--chart-sleep)"
                                  dot={false}
                                  strokeWidth={2}
                                />
                              )}
                            </>
                          )
                        : (
                            <>
                              <Line
                                type="monotone"
                                dataKey="mood7"
                                name="Last 7 days"
                                stroke={rollingTrendColors.long}
                                dot={false}
                                strokeWidth={2}
                              />
                              {show30 && (
                                <Line
                                  type="monotone"
                                  dataKey="mood30"
                                  name="Last 30 days"
                                  stroke={rollingTrendColors.mid}
                                  dot={false}
                                  strokeWidth={2}
                                />
                              )}
                              {show90 && (
                                <Line
                                  type="monotone"
                                  dataKey="mood90"
                                  name="Last 90 days"
                                  stroke="var(--chart-sleep)"
                                  dot={false}
                                  strokeWidth={2}
                                />
                              )}
                            </>
                          )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="trend-summary">
                  {rollingSummaries.map((summary) => {
                    const is30Disabled = summary.days === 30 && !show30
                    const is90Disabled = summary.days === 90 && !show90
                    const isDisabled = is30Disabled || is90Disabled
                    return (
                      <div
                        className={`stat-block ${isDisabled ? 'stat-block--disabled' : ''}`}
                        key={summary.days}
                      >
                        {isDisabled && (
                          <Tooltip
                            label={is30Disabled
                              ? `Log ${ENTRY_THRESHOLD_30}+ nights to see 30-day trend.`
                              : `Log ${ENTRY_THRESHOLD_90}+ nights to see 90-day trend.`}
                            className="tooltip-wrap-card"
                          >
                            <span className="tooltip-trigger stat-block-tooltip-overlay" aria-hidden />
                          </Tooltip>
                        )}
                        <div className={isDisabled ? 'stat-block__content stat-block__content--dimmed' : 'stat-block__content'}>
                          <p className="label">
                            {summary.days === 7
                              ? 'Last 7 days'
                              : summary.days === 30
                                ? 'Last 30 days'
                                : 'Last 90 days'}
                          </p>
                          <p className="value">
                            {summary.sleep !== null
                              ? formatSleepHours(summary.sleep)
                              : '—'}{' '}
                            / {summary.mood !== null ? summary.mood.toFixed(1) : '—'}
                          </p>
                          <p className="helper">
                            {is30Disabled
                              ? (
                                  <span className="muted">
                                    Need {ENTRY_THRESHOLD_30}+ entries for 30-day line
                                  </span>
                                )
                              : is90Disabled
                                ? (
                                    <span className="muted">
                                      Need {ENTRY_THRESHOLD_90}+ entries for 90-day line
                                    </span>
                                  )
                                : (() => {
                                    const noDelta = summary.sleepDelta === null && summary.moodDelta === null
                                    const deltaNote = summary.days === 7
                                      ? '~14 days'
                                      : summary.days === 30
                                        ? '~30 days'
                                        : '~90 days'
                                    return noDelta
                                      ? (
                                          <Tooltip
                                            label={`Delta compares to the previous ${summary.days}-day window; need about ${deltaNote} of history.`}
                                          >
                                            <span className="tooltip-trigger muted">
                                              Delta after {deltaNote} of data
                                            </span>
                                          </Tooltip>
                                        )
                                      : (
                                          <Tooltip
                                            label={`Change vs prior ${summary.days}-day window.`}
                                          >
                                            <span className="tooltip-trigger delta-block muted">
                                              <span className="delta-block__label">
                                                VS prior {summary.days} days
                                              </span>
                                              <span className="delta-stacked">
                                                <span>Sleep: {formatSleepDeltaValue(summary.sleepDelta)}</span>
                                                <span>Mood: {formatDeltaValue(summary.moodDelta)}</span>
                                              </span>
                                            </span>
                                          </Tooltip>
                                        )
                                  })()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
    </section>
  )
}
