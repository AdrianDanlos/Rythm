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
import type { TrendPoint } from '../../lib/types/stats'
import { buildMockTrendSeries } from '../../lib/insightsMock'
import { buildWeeklyTrendSeries } from '../../lib/stats'
import { formatShortDate } from '../../lib/utils/dateFormatters'

type InsightsDailyHistoryProps = {
  isPro: boolean
  isMobile: boolean
  trendSeries: { last30: TrendPoint[], last90: TrendPoint[], last365: TrendPoint[] }
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

const getDateTickInterval = (pointCount: number, targetTicks = 6) => {
  if (!pointCount || pointCount <= targetTicks) return 0
  return Math.max(0, Math.ceil(pointCount / targetTicks) - 1)
}

export const InsightsDailyHistory = ({
  isPro,
  isMobile,
  trendSeries,
  onOpenPaywall,
}: InsightsDailyHistoryProps) => {
  const [trendRange, setTrendRange] = useState<'last30' | 'last90' | 'last365'>('last90')
  const [trendGranularity, setTrendGranularity] = useState<'daily' | 'weekly'>('daily')
  const trendPoints = trendSeries[trendRange]
  const weeklyTrendPoints = trendRange === 'last365'
    ? buildWeeklyTrendSeries(trendSeries.last365)
    : []
  const trendDisplayPoints = isMobile && trendRange === 'last365' && trendGranularity === 'weekly'
    ? weeklyTrendPoints
    : trendPoints
  const previewTrendSeries = buildMockTrendSeries()
  const previewTrendPoints = previewTrendSeries[trendRange]
  const previewWeeklyTrendPoints = trendRange === 'last365'
    ? buildWeeklyTrendSeries(previewTrendSeries.last365)
    : []
  const previewTrendDisplayPoints = isMobile && trendRange === 'last365' && trendGranularity === 'weekly'
    ? previewWeeklyTrendPoints
    : previewTrendPoints
  const trendTickInterval = getDateTickInterval(trendDisplayPoints.length)
  const previewTickInterval = getDateTickInterval(previewTrendDisplayPoints.length)
  const baseTickProps = { fontSize: 13 }
  const mobileTickProps = isMobile
    ? { angle: -35, textAnchor: 'end' as const, dy: 6, fontSize: 12 }
    : undefined
  const legendWrapperStyle = isMobile ? { paddingTop: 12 } : undefined
  const trendChartMargin = isMobile
    ? { top: 12, right: -42, bottom: 0, left: -36 }
    : { top: 12, right: -32, bottom: 0, left: -24 }

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
          <h2>Daily history</h2>
          <p className="muted">Raw day-by-day values across 30/90/365 days</p>
        </div>
        <div className="toggle-group">
          <button
            type="button"
            className={`ghost ${trendRange === 'last30' ? 'active' : ''}`}
            onClick={() => handleProAction(() => {
              setTrendRange('last30')
              setTrendGranularity('daily')
            })}
          >
            30 days
          </button>
          <button
            type="button"
            className={`ghost ${trendRange === 'last90' ? 'active' : ''}`}
            onClick={() => handleProAction(() => {
              setTrendRange('last90')
              setTrendGranularity('daily')
            })}
          >
            90 days
          </button>
          <button
            type="button"
            className={`ghost ${trendRange === 'last365' ? 'active' : ''}`}
            onClick={() => handleProAction(() => {
              setTrendRange('last365')
              setTrendGranularity(isMobile ? 'weekly' : 'daily')
            })}
          >
            365 days
          </button>
        </div>
        {isMobile && trendRange === 'last365'
          ? (
              <div className="toggle-group">
                <button
                  type="button"
                  className={`ghost ${trendGranularity === 'weekly' ? 'active' : ''}`}
                  onClick={() => handleProAction(() => setTrendGranularity('weekly'))}
                >
                  Weekly
                </button>
                <button
                  type="button"
                  className={`ghost ${trendGranularity === 'daily' ? 'active' : ''}`}
                  onClick={() => handleProAction(() => setTrendGranularity('daily'))}
                >
                  Daily
                </button>
              </div>
            )
          : null}
      </div>
      {!isPro
        ? (
            <div className="premium-preview">
              <div className="premium-preview__blur">
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={previewTrendDisplayPoints} margin={trendChartMargin}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatShortDate}
                        interval={isMobile ? Math.max(previewTickInterval, 1) : previewTickInterval}
                        tick={isMobile ? mobileTickProps : baseTickProps}
                        height={isMobile ? 36 : 30}
                      />
                      <YAxis
                        yAxisId="left"
                        domain={[4, 10]}
                        ticks={[4, 6, 8, 10]}
                        tickFormatter={formatAxisValue}
                        tick={baseTickProps}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[1, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                        tickFormatter={formatAxisValue}
                        tick={baseTickProps}
                      />
                      <RechartsTooltip />
                      <Legend wrapperStyle={legendWrapperStyle} />
                      <Line
                        type="monotone"
                        dataKey="sleep"
                        name="Sleep"
                        stroke="#0f172a"
                        dot={false}
                        yAxisId="left"
                      />
                      <Line
                        type="monotone"
                        dataKey="mood"
                        name="Mood"
                        stroke="#22c55e"
                        dot={false}
                        yAxisId="right"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="premium-preview__overlay">
                <div className="locked-message">
                  <p className="muted">Explore daily sleep and mood trends across 30/90/365 days.</p>
                  <button type="button" className="ghost cta-ghost" onClick={onOpenPaywall}>
                    Upgrade to Pro
                  </button>
                </div>
              </div>
            </div>
          )
        : (
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendDisplayPoints} margin={trendChartMargin}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    interval={isMobile ? Math.max(trendTickInterval, 1) : trendTickInterval}
                    tick={isMobile ? mobileTickProps : baseTickProps}
                    height={isMobile ? 36 : 30}
                  />
                  <YAxis
                    yAxisId="left"
                    domain={[4, 10]}
                    ticks={[4, 6, 8, 10]}
                    tickFormatter={formatAxisValue}
                    tick={baseTickProps}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tickFormatter={formatAxisValue}
                    tick={baseTickProps}
                  />
                  <RechartsTooltip />
                  <Legend wrapperStyle={legendWrapperStyle} />
                  <Line
                    type="monotone"
                    dataKey="sleep"
                    name="Sleep"
                    stroke="#0f172a"
                    dot={false}
                    yAxisId="left"
                  />
                  <Line
                    type="monotone"
                    dataKey="mood"
                    name="Mood"
                    stroke="#22c55e"
                    dot={false}
                    yAxisId="right"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
    </section>
  )
}
