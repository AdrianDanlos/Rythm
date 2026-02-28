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
import { useTranslation } from 'react-i18next'
import type { Entry } from '../../lib/entries'
import { formatLongDate } from '../../lib/utils/dateFormatters'
import { formatSleepHours } from '../../lib/utils/sleepHours'
import { Tooltip } from '../Tooltip'

type PlottedEntry = Entry & {
  sleep_hours_clamped: number
  sleep_hours_jittered: number
  mood_jittered: number
}

/** Minimal shape for scatter dots (e.g. mock teaser data). */
type ScatterPoint = {
  id: string
  sleep_hours_jittered: number
  mood_jittered: number
  mood: number
}

type InsightsScatterProps = {
  isLoading: boolean
  hasAnyEntries: boolean
  isRangeEmpty: boolean
  isMobile: boolean
  plottedData: PlottedEntry[] | ScatterPoint[]
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
  isPro?: boolean
  onOpenPaywall?: () => void
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
  isPro = true,
  onOpenPaywall,
}: InsightsScatterProps) => {
  const { t } = useTranslation()
  const baseTickProps = { fontSize: 13 }
  const mobileTickProps = { fontSize: 12 }
  const scatterSize = isMobile ? 28 : 36
  const scatterRadius = scatterSize / 6

  const handleRangeChange = (value: 'all' | 'last30' | 'last90') => {
    if (!isPro && onOpenPaywall) {
      onOpenPaywall()
      return
    }
    onScatterRangeChange(value)
  }

  const renderDot = (props: {
    cx?: number
    cy?: number
    fill?: string
    fillOpacity?: number
    payload?: PlottedEntry | ScatterPoint
  }) => {
    const { cx, cy, payload, fill, fillOpacity } = props
    if (cx == null || cy == null) return null
    // Cell fill is not applied to Scatter shapes in Recharts, so derive color from payload
    const moodIndex = payload != null
      ? Math.max(0, Math.min(moodColors.length - 1, Math.floor(Number(payload.mood)) - 1))
      : 0
    const color = fill ?? moodColors[moodIndex]
    return (
      <circle
        cx={cx}
        cy={cy}
        r={scatterRadius}
        fill={color}
        fillOpacity={fillOpacity ?? 0.7}
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
        <p className="tooltip-date">{labelDate}</p>
        <p>{t('insights.sleepLabel')}: {entry.sleep_hours == null ? t('common.notAvailable') : formatSleepHours(entry.sleep_hours)}</p>
        <p>{t('insights.moodLabel')}: {entry.mood} / 5</p>
        <div className="tooltip-events">
          <p>{t('insights.dailyEventsLabel')}</p>
          {tags.length
            ? (
                <div className="tooltip-tags">
                  {tags.map((tag, index) => (
                    <span className="tag-pill" data-color-index={index % 8} key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )
            : <p>{t('insights.none')}</p>}
        </div>
        {entry.note ? <p className="tooltip-note">{entry.note}</p> : null}
      </div>
    )
  }

  const showTeaser = !isPro && onOpenPaywall && plottedData.length > 0
  const chartContent
    = isLoading
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
                    {t('insights.logMoreDays')}
                  </button>
                  {' '}{t('insights.toSeeInsights')}
                </p>
              </div>
            )
          : isRangeEmpty
            ? (
                <div className="chart-empty">
                  <p className="muted">{t('insights.noCompleteLogsRange')}</p>
                </div>
              )
            : (
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={showTeaser ? 120 : 260}>
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
                          value: t('insights.sleepAxis'),
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
                          value: t('common.mood'),
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
                      <RechartsTooltip content={isPro ? renderTooltip : undefined} />
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
              )

  return (
    <section className={`card chart-card ${!isPro ? 'pro-locked' : ''}`}>
      <div className="card-header">
        <div>
          <h2>
            {t('insights.sleepAndMood')}
            <Tooltip label={t('insights.scatterTooltip')}>
              <span className="tooltip-trigger">
                <span className="tooltip-icon" aria-hidden="true">i</span>
              </span>
            </Tooltip>
          </h2>
          <p className="muted">
            {t('insights.scatterSubtitle')}
            {bestSleepBand
              ? ` ${t('insights.bestSleepRange', { from: formatSleepHours(bestSleepBand.x1), to: formatSleepHours(bestSleepBand.x2) })}`
              : ''}
          </p>
        </div>
        <div style={{ display: 'grid', gap: 8, width: '100%', justifyItems: 'stretch' }}>
          <div className="toggle-group toggle-group--thirds" aria-label={t('insights.sleepAndMoodTimeframe')}>
            <button
              type="button"
              className={`ghost ${scatterRange === 'last30' ? 'active' : ''}`}
              onClick={() => handleRangeChange('last30')}
            >
              {t('insights.last30Days')}
            </button>
            {!isPro || !show90Range
              ? (
                  <Tooltip label={t('insights.logAtLeast30')}>
                    <span className="tooltip-trigger">
                      <button
                        type="button"
                        className="ghost toggle-group__btn--disabled"
                        disabled
                        aria-disabled="true"
                        style={{ pointerEvents: 'none' }}
                      >
                        {t('insights.last90Days')}
                      </button>
                    </span>
                  </Tooltip>
                )
              : (
                  <button
                    type="button"
                    className={`ghost ${scatterRange === 'last90' ? 'active' : ''}`}
                    onClick={() => handleRangeChange('last90')}
                  >
                    {t('insights.last90Days')}
                  </button>
                )}
            {!isPro || !showAllRange
              ? (
                  <Tooltip label={t('insights.logAtLeast90')}>
                    <span className="tooltip-trigger">
                      <button
                        type="button"
                        className="ghost toggle-group__btn--disabled"
                        disabled
                        aria-disabled="true"
                        style={{ pointerEvents: 'none' }}
                      >
                        {t('insights.all')}
                      </button>
                    </span>
                  </Tooltip>
                )
              : (
                  <button
                    type="button"
                    className={`ghost ${scatterRange === 'all' ? 'active' : ''}`}
                    onClick={() => handleRangeChange('all')}
                  >
                    {t('insights.all')}
                  </button>
                )}
          </div>
          {!showTeaser && (
            <p className="muted" style={{ justifySelf: 'end', marginTop: '10px' }}>
              {isLoading ? t('insights.loadingEntries') : t('insights.entriesCount', { count: plottedData.length })}
            </p>
          )}
        </div>
      </div>
      {showTeaser
        ? (
            <div className="premium-preview">
              <div className="premium-preview__blur">
                {chartContent}
              </div>
              <div className="premium-preview__overlay">
                <div className="locked-message">
                  <button type="button" className="ghost cta-ghost" onClick={onOpenPaywall}>
                    {t('insights.upgradeToPro')}
                  </button>
                </div>
              </div>
            </div>
          )
        : chartContent}
    </section>
  )
}
