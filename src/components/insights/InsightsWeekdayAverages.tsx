import {
  Bar,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { WeekdayAveragePoint } from '../../lib/types/stats'
import { formatSleepHours } from '../../lib/utils/sleepHours'

const EARLY_SIGNAL_MIN_COMPLETE_LOGS = 12
const weekdayLabelMap: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
}

type InsightsWeekdayAveragesProps = {
  weekdayAverages: WeekdayAveragePoint[]
  isMobile: boolean
  goToLog: () => void
}

type WeekdayLegendProps = {
  wrapperStyle?: React.CSSProperties
}

const buildAxisScale = (
  values: number[],
  {
    fallback,
    step,
    padSteps,
    minSpan,
    minLimit,
    maxLimit,
  }: {
    fallback: { min: number, max: number }
    step: number
    padSteps: number
    minSpan: number
    minLimit: number
    maxLimit: number
  },
) => {
  if (!values.length) return fallback

  let min = Math.min(...values)
  let max = Math.max(...values)
  if (min === max) {
    min -= step
    max += step
  }
  min = Math.floor((min - padSteps * step) / step) * step
  max = Math.ceil((max + padSteps * step) / step) * step
  min = Math.max(minLimit, min)
  max = Math.min(maxLimit, max)

  if (max - min < minSpan) {
    const midpoint = (min + max) / 2
    min = Math.max(minLimit, midpoint - minSpan / 2)
    max = Math.min(maxLimit, midpoint + minSpan / 2)
    min = Math.floor(min / step) * step
    max = Math.ceil(max / step) * step
  }

  if (max <= min) return fallback

  return { min, max }
}

const WeekdayLegend = ({ wrapperStyle }: WeekdayLegendProps) => (
  <div className="rolling-trend-legend weekday-legend" style={wrapperStyle}>
    <span className="rolling-trend-legend__item">
      <span className="rolling-trend-legend__swatch" style={{ background: 'var(--chart-sleep)' }} aria-hidden />
      Avg sleep
    </span>
    <span className="rolling-trend-legend__item">
      <span className="rolling-trend-legend__swatch" style={{ background: 'var(--chart-mood)' }} aria-hidden />
      Avg mood
    </span>
  </div>
)

export const InsightsWeekdayAverages = ({
  weekdayAverages,
  isMobile,
  goToLog,
}: InsightsWeekdayAveragesProps) => {
  const hasAnyData = weekdayAverages.some(point => point.observationCount > 0)
  const totalCompleteLogs = weekdayAverages.reduce((sum, point) => sum + point.observationCount, 0)
  const showEarlySignalNote = hasAnyData && totalCompleteLogs < EARLY_SIGNAL_MIN_COMPLETE_LOGS
  const chartMargin = isMobile
    ? { top: 0, right: 0, bottom: 0, left: 0 }
    : { top: 0, right: 0, bottom: 0, left: 0 }
  const baseTickProps = { fontSize: isMobile ? 12 : 13 }
  const legendWrapperStyle = isMobile ? { paddingTop: 10 } : undefined
  const sleepValues = weekdayAverages
    .map(point => point.avgSleep)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  const moodValues = weekdayAverages
    .map(point => point.avgMood)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  const sleepAxis = buildAxisScale(sleepValues, {
    fallback: { min: 4, max: 10 },
    step: 0.25,
    padSteps: 0.5,
    minSpan: 0.75,
    minLimit: 0,
    maxLimit: 12,
  })
  const moodAxis = buildAxisScale(moodValues, {
    fallback: { min: 1, max: 5 },
    step: 0.1,
    padSteps: 0.5,
    minSpan: 0.4,
    minLimit: 1,
    maxLimit: 5,
  })

  return (
    <section className="card chart-card chart-card--compact">
      <div className="card-header">
        <div>
          <h2>
            Weekday pattern
          </h2>
          <p className="muted">Your average sleep and mood for each day of the week.</p>
        </div>
      </div>
      {!hasAnyData
        ? (
            <div className="chart-empty chart-empty--compact">
              <p className="muted">
                <button type="button" className="link-button link-button--text" onClick={goToLog}>
                  Log more days
                </button>
                {' '}to unlock weekday patterns.
              </p>
            </div>
          )
        : (
            <>
              {showEarlySignalNote && (
                <p className="muted" style={{ marginTop: 8 }}>
                  Early signal: patterns get more reliable after about {EARLY_SIGNAL_MIN_COMPLETE_LOGS} complete logs.
                </p>
              )}
              <div className="chart-wrapper chart-wrapper--compact" style={{ marginTop: 16 }}>
                <ResponsiveContainer width="100%" height={190}>
                  <ComposedChart data={weekdayAverages} margin={chartMargin}>
                    <XAxis
                      dataKey="label"
                      tick={baseTickProps}
                      height={28}
                      tickMargin={4}
                    />
                    <YAxis
                      yAxisId="left"
                      domain={[sleepAxis.min, sleepAxis.max]}
                      tickCount={5}
                      tickFormatter={value => formatSleepHours(Number(value))}
                      tick={baseTickProps}
                      width={isMobile ? 50 : 56}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[moodAxis.min, moodAxis.max]}
                      tickCount={5}
                      tick={baseTickProps}
                      width={isMobile ? 24 : 28}
                    />
                    <RechartsTooltip
                      formatter={(value, name, item) => {
                        const numeric = typeof value === 'number' ? value : Number(value)
                        if (!Number.isFinite(numeric)) return ['—', name]
                        if (name === 'Avg sleep') return [formatSleepHours(numeric), name]
                        const observations = item?.payload?.observationCount
                        return [`${numeric.toFixed(1)} / 5 (${observations} logs)`, name]
                      }}
                      itemSorter={item => (item.name === 'Avg sleep' ? -1 : 1)}
                      labelFormatter={label => weekdayLabelMap[String(label)] ?? String(label)}
                    />
                    <Legend content={<WeekdayLegend wrapperStyle={legendWrapperStyle} />} />
                    <Bar
                      yAxisId="left"
                      dataKey="avgSleep"
                      name="Avg sleep"
                      fill="var(--chart-sleep)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={isMobile ? 16 : 18}
                    />
                    <Line
                      yAxisId="right"
                      dataKey="avgMood"
                      name="Avg mood"
                      stroke="var(--chart-mood)"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
    </section>
  )
}
