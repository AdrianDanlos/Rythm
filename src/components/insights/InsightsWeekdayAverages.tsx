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
import { useTranslation } from 'react-i18next'
import { Info, Moon, Smile, Frown } from 'lucide-react'
import type { WeekdayAveragePoint, WeekdayKey } from '../../lib/types/stats'
import { formatSleepHours } from '../../lib/utils/sleepHours'
import { Tooltip } from '../Tooltip'

const EARLY_SIGNAL_MIN_COMPLETE_LOGS = 14
type InsightsWeekdayAveragesProps = {
  weekdayAverages: WeekdayAveragePoint[]
  isMobile: boolean
  goToLog: () => void
}

type WeekdayLegendProps = {
  avgSleepLabel: string
  avgMoodLabel: string
  wrapperStyle?: React.CSSProperties
}

const WEEKDAY_LABEL_KEYS: Record<WeekdayKey, string> = {
  mon: 'insights.weekdayMonFull',
  tue: 'insights.weekdayTueFull',
  wed: 'insights.weekdayWedFull',
  thu: 'insights.weekdayThuFull',
  fri: 'insights.weekdayFriFull',
  sat: 'insights.weekdaySatFull',
  sun: 'insights.weekdaySunFull',
}

const WeekdayLegend = ({ avgSleepLabel, avgMoodLabel, wrapperStyle }: WeekdayLegendProps) => (
  <div className="rolling-trend-legend weekday-legend" style={wrapperStyle}>
    <span className="rolling-trend-legend__item">
      <span className="rolling-trend-legend__swatch" style={{ background: 'var(--chart-sleep-bar, var(--chart-sleep))' }} aria-hidden />
      {avgSleepLabel}
    </span>
    <span className="rolling-trend-legend__item">
      <span className="rolling-trend-legend__swatch" style={{ background: 'var(--chart-mood)' }} aria-hidden />
      {avgMoodLabel}
    </span>
  </div>
)

export const InsightsWeekdayAverages = ({
  weekdayAverages,
  isMobile,
  goToLog,
}: InsightsWeekdayAveragesProps) => {
  const { t } = useTranslation()
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
  const moodPoints = weekdayAverages.filter(
    point => point.observationCount > 0 && point.avgMood != null && Number.isFinite(point.avgMood),
  )
  const sleepPointsWithData = weekdayAverages.filter(
    point => point.observationCount > 0 && point.avgSleep != null && Number.isFinite(point.avgSleep),
  )

  const bestMoodDay = moodPoints.reduce<WeekdayAveragePoint | null>((best, point) => {
    if (!best) return point
    if ((point.avgMood ?? -Infinity) > (best.avgMood ?? -Infinity)) return point
    if (point.avgMood === best.avgMood && point.observationCount > best.observationCount) return point
    return best
  }, null)
  const worstMoodDay = moodPoints.reduce<WeekdayAveragePoint | null>((worst, point) => {
    if (!worst) return point
    if ((point.avgMood ?? Infinity) < (worst.avgMood ?? Infinity)) return point
    if (point.avgMood === worst.avgMood && point.observationCount > worst.observationCount) return point
    return worst
  }, null)
  const mostSleepDay = sleepPointsWithData.reduce<WeekdayAveragePoint | null>((best, point) => {
    if (!best) return point
    if ((point.avgSleep ?? -Infinity) > (best.avgSleep ?? -Infinity)) return point
    if (point.avgSleep === best.avgSleep && point.observationCount > best.observationCount) return point
    return best
  }, null)
  const leastSleepDay = sleepPointsWithData.reduce<WeekdayAveragePoint | null>((least, point) => {
    if (!least) return point
    if ((point.avgSleep ?? Infinity) < (least.avgSleep ?? Infinity)) return point
    if (point.avgSleep === least.avgSleep && point.observationCount > least.observationCount) return point
    return least
  }, null)

  const getWeekdayLabel = (dayKey: WeekdayKey) => t(WEEKDAY_LABEL_KEYS[dayKey])
  return (
    <section className="card chart-card--compact">
      <div className="card-header">
        <div>
          <h2>
            {t('insights.weekdayPattern')}
            <Tooltip label={t('insights.weekdaySleepTooltip')}>
              <span className="tooltip-trigger">
                <span className="tooltip-icon" aria-hidden="true">
                  <Info size={14} />
                </span>
              </span>
            </Tooltip>
          </h2>
        </div>
      </div>
      {!hasAnyData
        ? (
            <div className="chart-empty chart-empty--compact">
              <p className="muted">
                <button type="button" className="link-button link-button--text" onClick={goToLog}>
                  {t('insights.logMoreDays')}
                </button>
                {' '}{t('insights.unlockWeekdayPatterns')}
              </p>
            </div>
          )
        : (
            <>
              {showEarlySignalNote && (
                <p className="muted" style={{ marginTop: 8 }}>
                  {t('insights.earlySignal', { count: EARLY_SIGNAL_MIN_COMPLETE_LOGS })}
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
                        if (name === t('insights.avgSleep')) return [formatSleepHours(numeric), name]
                        const observations = item?.payload?.observationCount
                        return [`${numeric.toFixed(1)} / 5 (${t('insights.logsCount', { count: observations ?? 0 })})`, name]
                      }}
                      itemSorter={item => (item.name === t('insights.avgSleep') ? -1 : 1)}
                      labelFormatter={label => t(`insights.weekday${String(label)}Full`)}
                    />
                    <Legend
                      content={(
                        <WeekdayLegend
                          avgSleepLabel={t('insights.avgSleep')}
                          avgMoodLabel={t('insights.avgMood')}
                          wrapperStyle={legendWrapperStyle}
                        />
                      )}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="avgSleep"
                      name={t('insights.avgSleep')}
                      fill="var(--chart-sleep-bar, var(--chart-sleep))"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={isMobile ? 16 : 18}
                    />
                    <Line
                      yAxisId="right"
                      dataKey="avgMood"
                      name={t('insights.avgMood')}
                      type="monotone"
                      stroke="var(--chart-mood)"
                      strokeWidth={3}
                      dot={{ r: 3.5, fill: 'var(--bg)', stroke: 'var(--chart-mood)', strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: 'var(--bg)', stroke: 'var(--chart-mood)', strokeWidth: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="weekday-pattern-highlights" style={{ marginTop: 10 }}>
                {bestMoodDay && (
                  <article className="weekday-pattern-highlight weekday-pattern-highlight--mood-best">
                    <div className="weekday-pattern-highlight__title">
                      <Smile size={16} aria-hidden />
                      <span>{t('insights.bestMoodDay')}</span>
                    </div>
                    <p className="weekday-pattern-highlight__summary">
                      <span className="weekday-pattern-highlight__day">{getWeekdayLabel(bestMoodDay.dayKey)}</span>
                      <span className="weekday-pattern-highlight__metric">{bestMoodDay.avgMood?.toFixed(1)} / 5</span>
                    </p>
                  </article>
                )}
                {worstMoodDay && (
                  <article className="weekday-pattern-highlight weekday-pattern-highlight--mood-worst">
                    <div className="weekday-pattern-highlight__title">
                      <Frown size={16} aria-hidden />
                      <span>{t('insights.worstMoodDay')}</span>
                    </div>
                    <p className="weekday-pattern-highlight__summary">
                      <span className="weekday-pattern-highlight__day">{getWeekdayLabel(worstMoodDay.dayKey)}</span>
                      <span className="weekday-pattern-highlight__metric">{worstMoodDay.avgMood?.toFixed(1)} / 5</span>
                    </p>
                  </article>
                )}
                {mostSleepDay && (
                  <article className="weekday-pattern-highlight weekday-pattern-highlight--sleep-most">
                    <div className="weekday-pattern-highlight__title">
                      <Moon size={16} aria-hidden />
                      <span>{t('insights.mostSleepDay')}</span>
                    </div>
                    <p className="weekday-pattern-highlight__summary">
                      <span className="weekday-pattern-highlight__day">{getWeekdayLabel(mostSleepDay.dayKey)}</span>
                      <span className="weekday-pattern-highlight__metric">{formatSleepHours(mostSleepDay.avgSleep)}</span>
                    </p>
                  </article>
                )}
                {leastSleepDay && (
                  <article className="weekday-pattern-highlight weekday-pattern-highlight--sleep-least">
                    <div className="weekday-pattern-highlight__title">
                      <Moon size={16} aria-hidden />
                      <span>{t('insights.leastSleepDay')}</span>
                    </div>
                    <p className="weekday-pattern-highlight__summary">
                      <span className="weekday-pattern-highlight__day">{getWeekdayLabel(leastSleepDay.dayKey)}</span>
                      <span className="weekday-pattern-highlight__metric">{formatSleepHours(leastSleepDay.avgSleep)}</span>
                    </p>
                  </article>
                )}
              </div>
            </>
          )}
    </section>
  )
}
