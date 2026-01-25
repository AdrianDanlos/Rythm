import {
  Cell,
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

type InsightsProps = {
  entries: Entry[]
  entriesLoading: boolean
  chartData: Entry[]
  averages: { sleep: number | null; mood: number | null }
  windowAverages: { last7: WindowStats; last30: WindowStats }
  streak: number
  sleepConsistencyLabel: string | null
  correlationLabel: string | null
  correlationDirection: string | null
  moodBySleepThreshold: { high: number | null; low: number | null }
  sleepThreshold: number
  moodColors: string[]
  onExportCsv: () => void
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
  onExportCsv,
}: InsightsProps) => {
  const isLoading = entriesLoading
  const isEmpty = !entriesLoading && entries.length === 0

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
        <h2>Insights</h2>
        <button
          type="button"
          className="ghost"
          onClick={onExportCsv}
          disabled={!entries.length}
        >
          Export CSV
        </button>
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

      <section className="card chart-card">
        <div className="chart-header">
          <h2>Sleep vs Mood</h2>
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
                  dataKey="sleep_hours"
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
                  dataKey="mood"
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
                <Scatter data={chartData}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.id}
                      fill={moodColors[entry.mood - 1]}
                      fillOpacity={0.85}
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
