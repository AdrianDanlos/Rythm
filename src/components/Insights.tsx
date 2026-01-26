import { useState } from 'react'
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Entry } from '../lib/entries'

type WindowStats = {
  sleep: number | null
  mood: number | null
  count: number
}

type TrendPoint = {
  date: string
  sleep: number | null
  mood: number | null
}

type RollingPoint = {
  date: string
  sleep7: number | null
  sleep30: number | null
  sleep90: number | null
  mood7: number | null
  mood30: number | null
  mood90: number | null
}

type RollingSummary = {
  days: number
  sleep: number | null
  mood: number | null
  sleepDelta: number | null
  moodDelta: number | null
}

type TagInsight = {
  tag: string
  sleep: number | null
  mood: number | null
  count: number
}

type InsightsProps = {
  entries: Entry[]
  entriesLoading: boolean
  chartData: Entry[]
  averages: { sleep: number | null; mood: number | null }
  windowAverages: {
    last7: WindowStats
    last30: WindowStats
    last90: WindowStats
    last365: WindowStats
  }
  streak: number
  sleepConsistencyLabel: string | null
  correlationLabel: string | null
  correlationDirection: string | null
  moodBySleepThreshold: { high: number | null; low: number | null }
  sleepThreshold: number
  moodColors: string[]
  trendSeries: { last30: TrendPoint[]; last90: TrendPoint[]; last365: TrendPoint[] }
  rollingSeries: RollingPoint[]
  rollingSummaries: RollingSummary[]
  personalSleepThreshold: number | null
  moodByPersonalThreshold: { high: number | null; low: number | null }
  tagInsights: TagInsight[]
  isPro: boolean
  onExportCsv: () => void
  onExportMonthlyReport: () => void
}

export const Insights = ({
  entries,
  entriesLoading,
  chartData,
  averages,
  windowAverages,
  streak,
  sleepConsistencyLabel,
  correlationLabel,
  correlationDirection,
  moodBySleepThreshold,
  sleepThreshold,
  moodColors,
  trendSeries,
  rollingSeries,
  rollingSummaries,
  personalSleepThreshold,
  moodByPersonalThreshold,
  tagInsights,
  isPro,
  onExportCsv,
  onExportMonthlyReport,
}: InsightsProps) => {
  const isLoading = entriesLoading
  const isEmpty = !entriesLoading && entries.length === 0
  const jitterFromId = (id: string, scale = 0.18) => {
    let hash = 0
    for (let i = 0; i < id.length; i += 1) {
      hash = (hash << 5) - hash + id.charCodeAt(i)
      hash |= 0
    }
    const normalized = (hash % 1000) / 1000
    return (normalized - 0.5) * scale
  }

  const plottedData = chartData.map((entry) => {
    const sleep = Number(entry.sleep_hours)
    const mood = Number(entry.mood)
    const sleepClamped = Math.min(10, Math.max(4, sleep))
    const moodClamped = Math.min(5, Math.max(1, mood))
    const jitter = jitterFromId(entry.id)
    return {
      ...entry,
      sleep_hours_clamped: sleepClamped,
      sleep_hours_jittered: Math.min(10, Math.max(4, sleepClamped + jitter)),
      mood_jittered: Math.min(5, Math.max(1, moodClamped + jitter / 2)),
    }
  })
  const [trendRange, setTrendRange] = useState<'last30' | 'last90' | 'last365'>(
    'last90',
  )
  const [rollingMetric, setRollingMetric] = useState<'sleep' | 'mood'>('sleep')
  const trendPoints = trendSeries[trendRange]

  const formatShortDate = (value: string) => {
    const date = new Date(`${value}T00:00:00`)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  const formatLineValue = (value: number | string) => {
    if (value === null || value === undefined) return '—'
    const numeric = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(numeric) ? numeric.toFixed(1) : '—'
  }

  const getDateTickInterval = (pointCount: number, targetTicks = 6) => {
    if (!pointCount || pointCount <= targetTicks) return 0
    return Math.max(0, Math.ceil(pointCount / targetTicks) - 1)
  }

  const rollingTickInterval = getDateTickInterval(rollingSeries.length)
  const trendTickInterval = getDateTickInterval(trendPoints.length)

  const renderTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: ReadonlyArray<{ payload: Entry }>
  }) => {
    if (!active || !payload?.length) return null
    const entry = payload[0]?.payload as Entry | undefined
    if (!entry) return null
    return (
      <div className="tooltip">
        <p>{entry.entry_date}</p>
        <p>Sleep: {entry.sleep_hours} hrs</p>
        <p>Mood: {entry.mood}</p>
        {entry.note ? <p className="tooltip-note">{entry.note}</p> : null}
      </div>
    )
  }

  return (
    <>
      <div className="insights-header">
        <div className="insights-actions">
          <button
            type="button"
            className="ghost"
            onClick={onExportCsv}
            disabled={!entries.length}
          >
            Export CSV
          </button>
          <button
            type="button"
            className={`ghost ${!isPro ? 'pro-locked-button' : ''}`}
            onClick={onExportMonthlyReport}
            disabled={!entries.length || !isPro}
          >
            Export Report
            {!isPro ? <span className="pro-pill">Pro</span> : null}
          </button>
        </div>
      </div>

      <section className="card stats">
        {isLoading ? (
          <>
            <div className="stat-block">
              <p className="label">Average sleep</p>
              <div className="skeleton-line" />
            </div>
            <div className="stat-block">
              <p className="label">Average mood</p>
              <div className="skeleton-line" />
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="label">Average sleep</p>
              <p className="value">
                {averages.sleep !== null ? `${averages.sleep.toFixed(1)} hrs` : '—'}
              </p>
            </div>
            <div>
              <p className="label">Average mood</p>
              <p className="value">
                {averages.mood !== null ? averages.mood.toFixed(1) : '—'} / 5
              </p>
            </div>
          </>
        )}
      </section>

      <section className="card stats-stack">
        {isLoading ? (
          <>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div className="stat-block" key={item}>
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="stat-block">
              <p className="label">Last 7 days</p>
              <p className="value">
                {windowAverages.last7.sleep !== null &&
                windowAverages.last7.mood !== null
                  ? `${windowAverages.last7.sleep.toFixed(1)}h / ${windowAverages.last7.mood.toFixed(1)}`
                  : '—'}
              </p>
              <p className="helper">
                Sleep avg / Mood avg · {windowAverages.last7.count} entries
              </p>
            </div>
            <div className="stat-divider" aria-hidden />
            <div className="stat-block">
              <p className="label">Last 30 days</p>
              <p className="value">
                {windowAverages.last30.sleep !== null &&
                windowAverages.last30.mood !== null
                  ? `${windowAverages.last30.sleep.toFixed(1)}h / ${windowAverages.last30.mood.toFixed(1)}`
                  : '—'}
              </p>
              <p className="helper">
                Sleep avg / Mood avg · {windowAverages.last30.count} entries
              </p>
            </div>
            <div className="stat-divider" aria-hidden />
            <div className="stat-block">
              <p className="label">Streak</p>
              <p className="value">{streak} days</p>
              <p className="helper">Consecutive days logged</p>
            </div>
            <div className="stat-divider" aria-hidden />
            <div className="stat-block">
              <p className="label">Sleep consistency</p>
              <p className="value">{sleepConsistencyLabel ?? '—'}</p>
              <p className="helper">How steady your sleep hours are</p>
            </div>
            <div className="stat-divider" aria-hidden />
            <div className="stat-block">
              <p className="label">Sleep–mood link</p>
              <p className="value">{correlationLabel ?? '—'}</p>
              {correlationDirection ? (
                <p className="helper">{correlationDirection}</p>
              ) : null}
            </div>
            <div className="stat-divider" aria-hidden />
            <div className="stat-block">
              <p className="label">Mood by sleep</p>
              <p className="value">
                {moodBySleepThreshold.high !== null ||
                moodBySleepThreshold.low !== null
                  ? `≥${sleepThreshold}h ${moodBySleepThreshold.high?.toFixed(1) ?? '—'} / <${sleepThreshold}h ${moodBySleepThreshold.low?.toFixed(1) ?? '—'}`
                  : '—'}
              </p>
              <p className="helper">Avg mood split at {sleepThreshold} hours</p>
            </div>
          </>
        )}
      </section>

      <section className={`card ${!isPro ? 'pro-locked' : ''}`}>
        <div className="card-header">
          <div>
            <h2>Smoothed trends</h2>
            <p className="muted">
              Rolling averages over 7/30/90 days to show direction.
            </p>
          </div>
          <div className="toggle-group">
            <button
              type="button"
              className={`ghost ${rollingMetric === 'sleep' ? 'active' : ''}`}
              onClick={() => setRollingMetric('sleep')}
            >
              Sleep
            </button>
            <button
              type="button"
              className={`ghost ${rollingMetric === 'mood' ? 'active' : ''}`}
              onClick={() => setRollingMetric('mood')}
            >
              Mood
            </button>
          </div>
        </div>
        {!isPro ? (
          <p className="muted">Upgrade to Pro to view rolling trend lines.</p>
        ) : (
          <>
            <div className="chart-wrapper full-bleed">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={rollingSeries}
                  margin={{ top: 12, right: 28, bottom: 0, left: -12 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    interval={rollingTickInterval}
                  />
                  <YAxis
                    tickFormatter={formatLineValue}
                    domain={
                      rollingMetric === 'sleep' ? [4, 10] : [1, 5]
                    }
                    ticks={
                      rollingMetric === 'sleep' ? [4, 6, 8, 10] : [1, 2, 3, 4, 5]
                    }
                  />
                  <Tooltip
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
                  <Legend />
                  {rollingMetric === 'sleep' ? (
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
                  ) : (
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
              {rollingSummaries.map((summary) => (
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
                    <span className="delta-tooltip" tabIndex={0}>
                      <span className="delta-tooltip-icon" aria-hidden="true">
                        i
                      </span>
                      Delta
                      <span className="delta-tooltip-bubble" role="tooltip">
                        Change versus the prior {summary.days} days.
                      </span>
                    </span>
                    : {summary.sleepDelta?.toFixed(1) ?? '—'}h ·{' '}
                    {summary.moodDelta?.toFixed(1) ?? '—'}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className={`card ${!isPro ? 'pro-locked' : ''}`}>
        <div className="card-header">
          <div>
            <h2>Daily history</h2>
            <p className="muted">Raw day-by-day values across 30/90/365 days.</p>
          </div>
          <div className="toggle-group">
            <button
              type="button"
              className={`ghost ${trendRange === 'last30' ? 'active' : ''}`}
              onClick={() => setTrendRange('last30')}
            >
              30 days
            </button>
            <button
              type="button"
              className={`ghost ${trendRange === 'last90' ? 'active' : ''}`}
              onClick={() => setTrendRange('last90')}
            >
              90 days
            </button>
            <button
              type="button"
              className={`ghost ${trendRange === 'last365' ? 'active' : ''}`}
              onClick={() => setTrendRange('last365')}
            >
              365 days
            </button>
          </div>
        </div>
        {!isPro ? (
          <p className="muted">Upgrade to Pro for long-range trends.</p>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendPoints} margin={{ top: 12, right: -35, bottom: 0, left: -28 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortDate}
                  interval={trendTickInterval}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
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

      <section className={`card ${!isPro ? 'pro-locked' : ''}`}>
        <div className="card-header">
          <div>
            <h2>Your sleep threshold</h2>
            <p className="muted">Personalized sleep target</p>
          </div>
        </div>
        {!isPro ? (
          <p className="muted">Upgrade to Pro to see your personal threshold.</p>
        ) : (
          <div className="stat-block">
            <p className="label">Estimated threshold</p>
            <p className="value">
              {personalSleepThreshold ? `${personalSleepThreshold}h` : '—'}
            </p>
            <p className="helper">
              Avg mood at ≥{personalSleepThreshold ?? '—'}h:{' '}
              {moodByPersonalThreshold.high?.toFixed(1) ?? '—'} · &lt;
              {personalSleepThreshold ?? '—'}h:{' '}
              {moodByPersonalThreshold.low?.toFixed(1) ?? '—'}
            </p>
          </div>
        )}
      </section>

      <section className={`card ${!isPro ? 'pro-locked' : ''}`}>
        <div className="card-header">
          <div>
            <h2>Tag insights</h2>
            <p className="muted">Sleep and Mood by tag</p>
          </div>
        </div>
        {!isPro ? (
          <p className="muted">Upgrade to Pro to see tag insights.</p>
        ) : tagInsights.length ? (
          <div className="tag-grid">
            {tagInsights.slice(0, 8).map((tag) => (
              <div className="tag-card" key={tag.tag}>
                <p className="tag-title">{tag.tag}</p>
                <p className="helper">
                  {tag.count} entries · {tag.sleep?.toFixed(1) ?? '—'}h /{' '}
                  {tag.mood?.toFixed(1) ?? '—'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">Add tags to see insights.</p>
        )}
      </section>

      <section className="card chart-card">
        <div className="chart-header">
          <h2>Rythm insights</h2>
          <p className="muted">
            {entriesLoading ? 'Loading entries...' : `${entries.length} entries`}
          </p>
        </div>
        {isLoading ? (
          <div className="chart-empty">
            <div className="skeleton-block" />
          </div>
        ) : isEmpty ? (
          <div className="chart-empty">
            <p>Add entries to see insights.</p>
          </div>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart margin={{ top: 12, right: 12, bottom: 12, left: 5 }}>
                <XAxis
                  type="number"
                  dataKey="sleep_hours_jittered"
                  domain={[4, 10]}
                  ticks={[4, 5, 6, 7, 8, 9, 10]}
                  tickFormatter={(value) => {
                    if (value === 4) return '≤4'
                    if (value === 10) return '≥10'
                    return String(value)
                  }}
                  label={{
                    value: 'Sleep hours',
                    position: 'insideBottom',
                    offset: -5,
                  }}
                  height={35}
                  tickMargin={2}
                />
                <YAxis
                  type="number"
                  dataKey="mood_jittered"
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  label={{
                    value: 'Mood',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 0,
                  }}
                  width={35}
                  tickMargin={2}
                />
                <Tooltip content={renderTooltip} />
                <Scatter data={plottedData}>
                  {plottedData.map((entry) => (
                    <Cell
                      key={entry.id}
                      fill={moodColors[entry.mood - 1]}
                      fillOpacity={0.7}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </>
  )
}
