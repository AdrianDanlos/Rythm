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
}

export const InsightsScatter = ({
  isLoading,
  isEmpty,
  isMobile,
  entries,
  plottedData,
  moodColors,
}: InsightsScatterProps) => {
  const baseTickProps = { fontSize: 13 }
  const mobileTickProps = { fontSize: 12 }
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
        <p>Sleep: {entry.sleep_hours} hrs</p>
        <p>Mood: {entry.mood} / 5</p>
        {entry.note ? <p className="tooltip-note">{entry.note}</p> : null}
      </div>
    )
  }

  return (
    <section className="card chart-card">
      <div className="chart-header">
        <div>
          <h2>Rythm insights</h2>
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
                <p>Add entries to see insights.</p>
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
                    <Scatter data={plottedData}>
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
