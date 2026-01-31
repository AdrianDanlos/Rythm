import { useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  type LegendPayload,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { RollingPoint, RollingSummary } from '../../lib/types/stats'
import { buildMockRollingSeries } from '../../lib/insightsMock'
import { formatShortDate } from '../../lib/utils/dateFormatters'
import { Tooltip } from '../Tooltip'

type InsightsSmoothedTrendsProps = {
  isPro: boolean
  isMobile: boolean
  rollingSeries: RollingPoint[]
  rollingSummaries: RollingSummary[]
  onOpenPaywall: () => void
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

const rollingLegendSorter = (item: LegendPayload) => {
  const label = String(item.dataKey ?? item.value ?? '')
  if (label.includes('7')) return 1
  if (label.includes('30')) return 2
  if (label.includes('90')) return 3
  return 99
}

const formatDeltaValue = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return '—'
  const formatted = value.toFixed(1)
  return value > 0 ? `+${formatted}` : formatted
}

const getDateTickInterval = (pointCount: number, targetTicks = 6) => {
  if (!pointCount || pointCount <= targetTicks) return 0
  return Math.max(0, Math.ceil(pointCount / targetTicks) - 1)
}

export const InsightsSmoothedTrends = ({
  isPro,
  isMobile,
  rollingSeries,
  rollingSummaries,
  onOpenPaywall,
}: InsightsSmoothedTrendsProps) => {
  const [rollingMetric, setRollingMetric] = useState<'sleep' | 'mood'>('mood')
  const previewRollingSeries = buildMockRollingSeries()
  const smoothedChartMargin = isMobile
    ? { top: 12, right: 0, bottom: 0, left: -36 }
    : { top: 12, right: 28, bottom: 0, left: -12 }
  const rollingTickInterval = getDateTickInterval(rollingSeries.length)
  const previewRollingTickInterval = getDateTickInterval(previewRollingSeries.length)
  const baseTickProps = { fontSize: 12 }
  const mobileTickProps = isMobile
    ? { angle: -35, textAnchor: 'end' as const, dy: 6, fontSize: 11 }
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
          <h2>Smoothed trends</h2>
          <p className="muted">
            Rolling averages over 7/30/90 days to show direction
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
                      data={previewRollingSeries}
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
                        tickFormatter={formatAxisValue}
                        domain={
                          rollingMetric === 'sleep' ? [4, 10] : [1, 5]
                        }
                        ticks={
                          rollingMetric === 'sleep' ? [4, 6, 8, 10] : [1, 2, 3, 4, 5]
                        }
                        tick={baseTickProps}
                      />
                      <RechartsTooltip
                        formatter={(value) => {
                          const normalized = Array.isArray(value) ? value[0] : value
                          const formatted = formatLineValue(
                            normalized ?? '',
                          )
                          return rollingMetric === 'sleep' && formatted !== '—'
                            ? `${formatted}h`
                            : formatted
                        }}
                        itemSorter={(item) => {
                          const name = String(item.name ?? '')
                          if (name.includes('7')) return 1
                          if (name.includes('30')) return 2
                          if (name.includes('90')) return 3
                          return 99
                        }}
                      />
                      <Legend itemSorter={rollingLegendSorter} wrapperStyle={legendWrapperStyle} />
                      {rollingMetric === 'sleep'
                        ? (
                            <>
                              <Line
                                type="monotone"
                                dataKey="sleep7"
                                name="Last 7 days"
                                stroke="#0f172a"
                                dot={false}
                                strokeWidth={2}
                              />
                              <Line
                                type="monotone"
                                dataKey="sleep30"
                                name="Last 30 days"
                                stroke="#2563eb"
                                dot={false}
                                strokeWidth={2}
                              />
                              <Line
                                type="monotone"
                                dataKey="sleep90"
                                name="Last 90 days"
                                stroke="#f97316"
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
                                stroke="#0f172a"
                                dot={false}
                                strokeWidth={2}
                              />
                              <Line
                                type="monotone"
                                dataKey="mood30"
                                name="Last 30 days"
                                stroke="#2563eb"
                                dot={false}
                                strokeWidth={2}
                              />
                              <Line
                                type="monotone"
                                dataKey="mood90"
                                name="Last 90 days"
                                stroke="#f97316"
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
                  <p className="muted">Upgrade to Pro to view rolling trend lines.</p>
                  <button type="button" className="ghost cta-ghost" onClick={onOpenPaywall}>
                    Upgrade to Pro
                  </button>
                </div>
              </div>
            </div>
          )
        : (
            <>
              <div className="chart-wrapper full-bleed">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart
                    data={rollingSeries}
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
                      tickFormatter={formatAxisValue}
                      domain={
                        rollingMetric === 'sleep' ? [4, 10] : [1, 5]
                      }
                      ticks={
                        rollingMetric === 'sleep' ? [4, 6, 8, 10] : [1, 2, 3, 4, 5]
                      }
                      tick={baseTickProps}
                    />
                    <RechartsTooltip
                      formatter={(value) => {
                        const normalized = Array.isArray(value) ? value[0] : value
                        const formatted = formatLineValue(
                          normalized ?? '',
                        )
                        return rollingMetric === 'sleep' && formatted !== '—'
                          ? `${formatted}h`
                          : formatted
                      }}
                      itemSorter={(item) => {
                        const name = String(item.name ?? '')
                        if (name.includes('7')) return 1
                        if (name.includes('30')) return 2
                        if (name.includes('90')) return 3
                        return 99
                      }}
                    />
                    <Legend itemSorter={rollingLegendSorter} wrapperStyle={legendWrapperStyle} />
                    {rollingMetric === 'sleep'
                      ? (
                          <>
                            <Line
                              type="monotone"
                              dataKey="sleep7"
                              name="Last 7 days"
                              stroke="#0f172a"
                              dot={false}
                              strokeWidth={2}
                            />
                            <Line
                              type="monotone"
                              dataKey="sleep30"
                              name="Last 30 days"
                              stroke="#2563eb"
                              dot={false}
                              strokeWidth={2}
                            />
                            <Line
                              type="monotone"
                              dataKey="sleep90"
                              name="Last 90 days"
                              stroke="#f97316"
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
                              stroke="#0f172a"
                              dot={false}
                              strokeWidth={2}
                            />
                            <Line
                              type="monotone"
                              dataKey="mood30"
                              name="Last 30 days"
                              stroke="#2563eb"
                              dot={false}
                              strokeWidth={2}
                            />
                            <Line
                              type="monotone"
                              dataKey="mood90"
                              name="Last 90 days"
                              stroke="#f97316"
                              dot={false}
                              strokeWidth={2}
                            />
                          </>
                        )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="trend-summary">
                {rollingSummaries.map(summary => (
                  <div className="stat-block" key={summary.days}>
                    <p className="label">
                      {summary.days === 7
                        ? 'Last 7 days'
                        : summary.days === 30
                          ? 'Last 30 days'
                          : 'Last 90 days'}
                    </p>
                    <p className="value">
                      {summary.sleep !== null
                        ? `${summary.sleep.toFixed(1)}h`
                        : '—'}{' '}
                      / {summary.mood !== null ? summary.mood.toFixed(1) : '—'}
                    </p>
                    <p className="helper">
                      <Tooltip label={`Change versus the prior ${summary.days} days.`}>
                        <span className="tooltip-trigger">
                          <span className="tooltip-icon" aria-hidden="true">
                            i
                          </span>
                          Delta
                        </span>
                      </Tooltip>
                      : {formatDeltaValue(summary.sleepDelta)}h ·{' '}
                      {formatDeltaValue(summary.moodDelta)}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
    </section>
  )
}
