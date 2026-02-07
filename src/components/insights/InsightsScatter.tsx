import {
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Entry } from '../../lib/entries'
import { formatLongDate } from '../../lib/utils/dateFormatters'
import { formatSleepHours } from '../../lib/utils/sleepHours'
import { Tooltip } from '../Tooltip'

type PlottedEntry = Entry & {
  sleep_hours_clamped: number
  sleep_hours_jittered: number
  mood_jittered: number
}

type InsightsScatterProps = {
  isLoading: boolean
  isEmpty: boolean
  isMobile: boolean
  entries: Entry[]
  plottedData: PlottedEntry[]
  moodColors: string[]
  goToLog: () => void
}

export const InsightsScatter = ({
  isLoading,
  isEmpty,
  isMobile,
  entries,
  plottedData,
  moodColors,
  goToLog,
}: InsightsScatterProps) => {
  const baseTickProps = { fontSize: 13 }
  const mobileTickProps = { fontSize: 12 }
  const scatterSize = isMobile ? 28 : 36
  const scatterRadius = scatterSize / 6
  const renderDot = ({
    cx,
    cy,
    fill,
    fillOpacity,
  }: {
    cx?: number
    cy?: number
    fill?: string
    fillOpacity?: number
  }) => {
    if (cx == null || cy == null) return null
    return (
      <circle
        cx={cx}
        cy={cy}
        r={scatterRadius}
        fill={fill}
        fillOpacity={fillOpacity}
      />
    )
  }
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
    const labelDate = formatLongDate(new Date(`${entry.entry_date}T00:00:00`))
    return (
      <div className="tooltip">
        <p>{labelDate}</p>
        <p>Sleep: {formatSleepHours(entry.sleep_hours)}</p>
        <p>Mood: {entry.mood} / 5</p>
        {entry.note ? <p className="tooltip-note">{entry.note}</p> : null}
      </div>
    )
  }

  return (
    <section className="card chart-card">
      <div className="card-header">
        <div>
          <h2>
            Sleep & Mood
            <Tooltip label="What is this? A scatter plot of daily sleep vs mood; hover dots for details.">
              <span className="tooltip-trigger">
                <span className="tooltip-icon" aria-hidden="true">i</span>
              </span>
            </Tooltip>
          </h2>
          <p className="muted">Each dot is one day: more sleep is right, better mood is higher.</p>
        </div>
        <p className="muted">
          {isLoading ? 'Loading entries...' : `${entries.length} entries`}
        </p>
      </div>
      {isLoading
        ? (
            <div className="chart-empty">
              <div className="skeleton-block" />
            </div>
          )
        : isEmpty
          ? (
              <div className="chart-empty">
                <p className="muted">
                  <button type="button" className="link-button link-button--text" onClick={goToLog}>
                    Log a day
                  </button>
                  {' '}to see insights.
                </p>
              </div>
            )
          : (
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={260}>
                  <ScatterChart margin={{ top: 12, right: 12, bottom: 12, left: 5 }}>
                    <XAxis
                      type="number"
                      dataKey="sleep_hours_jittered"
                      domain={[4, 10]}
                      ticks={[4, 5, 6, 7, 8, 9, 10]}
                      tick={isMobile ? mobileTickProps : baseTickProps}
                      tickFormatter={(value) => {
                        if (value === 4) return '≤4h'
                        if (value === 10) return '≥10h'
                        return formatSleepHours(Number(value))
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
                      tick={isMobile ? mobileTickProps : baseTickProps}
                      label={{
                        value: 'Mood',
                        angle: -90,
                        position: 'insideLeft',
                        offset: 0,
                      }}
                      width={35}
                      tickMargin={2}
                    />
                    <RechartsTooltip content={renderTooltip} />
                    <Scatter data={plottedData} shape={renderDot}>
                      {plottedData.map(entry => (
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
  )
}
