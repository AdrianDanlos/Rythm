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

const EARLY_SIGNAL_MIN_COMPLETE_LOGS = 14
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

const WeekdayLegend = ({ wrapperStyle }: WeekdayLegendProps) => (
  <div className="rolling-trend-legend weekday-legend" style={wrapperStyle}>
    <span className="rolling-trend-legend__item">
      <span className="rolling-trend-legend__swatch" style={{ background: 'var(--chart-sleep-bar, var(--chart-sleep))' }} aria-hidden />
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

  const sleepValues = weekdayAverages
    .map(p => p.avgSleep)
    .filter((v): v is number => v != null && Number.isFinite(v))
  const sleepMin = sleepValues.length ? Math.min(...sleepValues) : 4
  const sleepMax = sleepValues.length ? Math.max(...sleepValues) : 10
  const padding = 0.5
  const rawDomainMin = sleepValues.length ? sleepMin - padding : 0
  const rawDomainMax = sleepValues.length ? sleepMax + padding : 10
  const sleepDomainMin = Math.max(0, Math.floor(rawDomainMin))
  const sleepDomainMax = Math.min(10, Math.ceil(rawDomainMax))
  const sleepDomain: [number, number] = [
    sleepDomainMin === sleepDomainMax ? Math.max(0, sleepDomainMin - 1) : sleepDomainMin,
    sleepDomainMin === sleepDomainMax ? Math.min(10, sleepDomainMax + 1) : sleepDomainMax,
  ]
  const sleepTicks = (() => {
    const [lo, hi] = sleepDomain
    const step = hi - lo <= 4 ? 1 : 2
    const t: number[] = []
    for (let v = lo; v <= hi; v += step) t.push(v)
    if (t[t.length - 1] !== hi) t.push(hi)
    return t
  })()

  const chartMargin = isMobile
    ? { top: 8, right: 0, bottom: 0, left: -23 }
    : { top: 0, right: 0, bottom: 0, left: 0 }
  const baseTickProps = { fontSize: isMobile ? 12 : 13 }
  const legendWrapperStyle = isMobile ? { paddingTop: 10 } : undefined
  return (
    <section className="card chart-card--compact">
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
                  Early signal: patterns get more reliable after about {EARLY_SIGNAL_MIN_COMPLETE_LOGS} days.
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
                      domain={sleepDomain}
                      ticks={sleepTicks}
                      tickFormatter={value => formatSleepHours(Number(value))}
                      tick={baseTickProps}
                      width={isMobile ? 50 : 56}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[1, 5]}
                      ticks={[1, 2, 3, 4, 5]}
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
                      fill="var(--chart-sleep-bar, var(--chart-sleep))"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={isMobile ? 16 : 18}
                    />
                    <Line
                      yAxisId="right"
                      dataKey="avgMood"
                      name="Avg mood"
                      type="monotone"
                      stroke="var(--chart-mood)"
                      strokeWidth={3}
                      dot={{ r: 3.5, fill: 'var(--bg)', stroke: 'var(--chart-mood)', strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: 'var(--bg)', stroke: 'var(--chart-mood)', strokeWidth: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
    </section>
  )
}
