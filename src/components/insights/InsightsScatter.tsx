import {
  Cell,
  ReferenceArea,
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
  hasAnyEntries: boolean
  isRangeEmpty: boolean
  isMobile: boolean
  plottedData: PlottedEntry[]
  moodColors: string[]
  scatterRange: 'all' | 'last30' | 'last90'
  onScatterRangeChange: (value: 'all' | 'last30' | 'last90') => void
  show90Range: boolean
  showAllRange: boolean
  bestSleepBand: {
    x1: number
    x2: number
    samples: number
    avgMood: number
  } | null
  goToLog: () => void
}

export const InsightsScatter = ({
  isLoading,
  hasAnyEntries,
  isRangeEmpty,
  isMobile,
  plottedData,
  moodColors,
  scatterRange,
  onScatterRangeChange,
  show90Range,
  showAllRange,
  bestSleepBand,
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
    const tags = entry.tags?.filter(Boolean) ?? []
    return (
      <div className="tooltip">
        <p>{labelDate}</p>
        <p>Sleep: {entry.sleep_hours == null ? 'N/A' : formatSleepHours(entry.sleep_hours)}</p>
        <p>Mood: {entry.mood} / 5</p>
        <div className="tooltip-events">
          <p>Events:</p>
          {tags.length
            ? (
                <div className="tooltip-tags">
                  {tags.map((tag, index) => (
                    <span className="tag-pill" data-color-index={index % 5} key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )
            : <p>None</p>}
        </div>
        {entry.note ? <p className="tooltip-note">{entry.note}</p> : null}
      </div>
    )
  }

  return (
    <section className="card chart-card">
      <div className="card-header">
        <div>
          <h2>
            Sleep & Mood relationship
            <Tooltip label="What is this? An advanced scatter plot of daily sleep vs mood; hover dots for details.">
              <span className="tooltip-trigger">
                <span className="tooltip-icon" aria-hidden="true">i</span>
              </span>
            </Tooltip>
          </h2>
          <p className="muted">
            Each dot is one day: more sleep is right, better mood is higher.
            {bestSleepBand
              ? ` Best sleep range in timeframe: ${formatSleepHours(bestSleepBand.x1)}-${formatSleepHours(bestSleepBand.x2)}.`
              : ''}
          </p>
        </div>
        <div style={{ display: 'grid', gap: 8, width: '100%', justifyItems: 'stretch' }}>
          <div className="toggle-group toggle-group--thirds" aria-label="Sleep and mood timeframe">
            <button
              type="button"
              className={`ghost ${scatterRange === 'last30' ? 'active' : ''}`}
              onClick={() => onScatterRangeChange('last30')}
            >
              30d
            </button>
            {show90Range
              ? (
                  <button
                    type="button"
                    className={`ghost ${scatterRange === 'last90' ? 'active' : ''}`}
                    onClick={() => onScatterRangeChange('last90')}
                  >
                    90d
                  </button>
                )
              : null}
            {showAllRange
              ? (
                  <button
                    type="button"
                    className={`ghost ${scatterRange === 'all' ? 'active' : ''}`}
                    onClick={() => onScatterRangeChange('all')}
                  >
                    All
                  </button>
                )
              : null}
          </div>
          <p className="muted" style={{ justifySelf: 'end' }}>
            {isLoading ? 'Loading entries...' : `${plottedData.length} entries`}
          </p>
        </div>
      </div>
      {isLoading
        ? (
            <div className="chart-empty">
              <div className="skeleton-block" />
            </div>
          )
        : !hasAnyEntries
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
            : isRangeEmpty
              ? (
                  <div className="chart-empty">
                    <p className="muted">No complete sleep and mood logs in this time frame yet.</p>
                  </div>
                )
              : (
                  <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={260}>
                      <ScatterChart margin={{ top: 12, right: 12, bottom: 12, left: 2 }}>
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
                            offset: -4,
                            dy: 20,
                            dx: 10,
                          }}
                          width={35}
                          tickMargin={2}
                        />
                        {bestSleepBand
                          ? (
                              <ReferenceArea
                                x1={bestSleepBand.x1}
                                x2={bestSleepBand.x2}
                                y1={1}
                                y2={5}
                                fill="var(--chart-sleep)"
                                fillOpacity={0.12}
                                ifOverflow="extendDomain"
                              />
                            )
                          : null}
                        <RechartsTooltip content={renderTooltip} />
                        <Scatter data={plottedData} shape={renderDot}>
                          {plottedData.map(entry => (
                            <Cell
                              key={entry.id}
                              fill={moodColors[Math.max(0, Math.min(moodColors.length - 1, Number(entry.mood) - 1))]}
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
