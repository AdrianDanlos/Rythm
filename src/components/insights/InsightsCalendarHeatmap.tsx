import { useEffect, useMemo, useRef, useState } from 'react'
import type { Entry } from '../../lib/entries'
import { formatLocalDate, formatLongDate, getDateLocale } from '../../lib/utils/dateFormatters'
import { sleepHeatmapColors } from '../../lib/colors'
import { formatSleepHours } from '../../lib/utils/sleepHours'
import { Tooltip } from '../Tooltip'

type HeatmapDay = {
  date: string
  inRange: boolean
  isFuture: boolean
  mood: number | null
  sleep: number | null
}

type InsightsCalendarHeatmapProps = {
  entries: Entry[]
  moodColors: string[]
  isMobile: boolean
}

const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', '']

const buildHeatmapWeeks = (entries: Entry[], days: number): HeatmapDay[][] => {
  const end = new Date()
  end.setHours(0, 0, 0, 0)
  const start = new Date(end)
  start.setDate(end.getDate() - (days - 1))

  const entriesByDate = new Map(entries.map(entry => [entry.entry_date, entry]))
  const startMs = start.getTime()
  const endMs = end.getTime()

  const startOffset = (start.getDay() + 6) % 7
  const gridStart = new Date(start)
  gridStart.setDate(start.getDate() - startOffset)

  const endOffset = 6 - ((end.getDay() + 6) % 7)
  const gridEnd = new Date(end)
  gridEnd.setDate(end.getDate() + endOffset)

  const weeks: HeatmapDay[][] = []
  const cursor = new Date(gridStart)

  while (cursor <= gridEnd) {
    const week: HeatmapDay[] = []
    for (let i = 0; i < 7; i += 1) {
      const current = new Date(cursor)
      const currentMs = current.getTime()
      const inRange = currentMs >= startMs && currentMs <= endMs
      const isFuture = currentMs > endMs
      const key = formatLocalDate(current)
      const entry = entriesByDate.get(key) ?? null
      const moodValue = entry?.mood === null || entry?.mood === undefined
        ? Number.NaN
        : Number(entry.mood)
      const sleepValue = entry?.sleep_hours === null || entry?.sleep_hours === undefined
        ? Number.NaN
        : Number(entry.sleep_hours)
      week.push({
        date: key,
        inRange,
        isFuture,
        mood: Number.isFinite(moodValue) ? moodValue : null,
        sleep: Number.isFinite(sleepValue) ? sleepValue : null,
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }

  return weeks
}

const clampIndex = (value: number, maxIndex: number) => {
  if (!Number.isFinite(value)) return 0
  return Math.min(maxIndex, Math.max(0, Math.round(value)))
}

const getMoodColor = (mood: number | null, palette: string[]) => {
  if (mood === null) return null
  const index = clampIndex(mood - 1, palette.length - 1)
  return palette[index] ?? null
}

const getSleepColor = (sleep: number | null) => {
  if (sleep === null) return null
  if (sleep <= 4) return sleepHeatmapColors[0] ?? null
  if (sleep < 5.5) return sleepHeatmapColors[1] ?? null
  if (sleep < 6.9) return sleepHeatmapColors[2] ?? null
  if (sleep >= 7 && sleep < 8.9) return sleepHeatmapColors[3] ?? null
  return sleepHeatmapColors[4] ?? null
}

export const InsightsCalendarHeatmap = ({
  entries,
  moodColors,
  isMobile,
}: InsightsCalendarHeatmapProps) => {
  const [metric, setMetric] = useState<'mood' | 'sleep'>('mood')
  const [daySize, setDaySize] = useState<number | null>(null)
  const gridRef = useRef<HTMLDivElement | null>(null)
  const totalDays = isMobile ? 90 : 365
  const dateLocale = getDateLocale()
  const weeks = useMemo(
    () => buildHeatmapWeeks(entries, totalDays),
    [entries, totalDays],
  )
  const gapSize = 2
  const legendColors = metric === 'mood' ? moodColors : sleepHeatmapColors
  const monthLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(dateLocale, { month: 'short' })
    const monthTotals = new Map<string, number>()

    weeks.forEach((week) => {
      week.forEach((day) => {
        if (!day.inRange) return
        const date = new Date(`${day.date}T00:00:00`)
        const key = `${date.getFullYear()}-${date.getMonth()}`
        monthTotals.set(key, (monthTotals.get(key) ?? 0) + 1)
      })
    })

    const labelMaxByMonthName = new Map<string, number>()
    monthTotals.forEach((count, key) => {
      const [yearValue, monthValue] = key.split('-').map(Number)
      const label = formatter.format(new Date(yearValue, monthValue, 1))
      const currentMax = labelMaxByMonthName.get(label) ?? 0
      if (count > currentMax) {
        labelMaxByMonthName.set(label, count)
      }
    })

    return weeks.map((week, index) => {
      const firstDay = week.find(day => day.inRange) ?? week[0]
      if (!firstDay) return ''
      const date = new Date(`${firstDay.date}T00:00:00`)
      const label = formatter.format(date)
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`
      const monthTotal = monthTotals.get(monthKey) ?? 0
      const maxForLabel = labelMaxByMonthName.get(label) ?? monthTotal

      if (index === 0) {
        return monthTotal < maxForLabel ? '' : label
      }
      const previous = weeks[index - 1]?.find(day => day.inRange) ?? weeks[index - 1]?.[0]
      if (!previous) return monthTotal < maxForLabel ? '' : label
      const previousDate = new Date(`${previous.date}T00:00:00`)
      if (
        previousDate.getMonth() === date.getMonth()
        && previousDate.getFullYear() === date.getFullYear()
      ) {
        return ''
      }
      return monthTotal < maxForLabel ? '' : label
    })
  }, [dateLocale, weeks])

  useEffect(() => {
    const element = gridRef.current
    if (!element) return

    const updateSize = () => {
      const width = element.clientWidth
      const columns = weeks.length
      if (width <= 0 || columns <= 0) {
        setDaySize(null)
        return
      }
      const totalGap = gapSize * (columns - 1)
      const size = Math.floor((width - totalGap) / columns)
      if (size <= 0) {
        setDaySize(null)
        return
      }
      setDaySize(current => (current === size ? current : size))
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(element)

    return () => observer.disconnect()
  }, [gapSize, weeks.length])

  const columnTemplate = daySize
    ? `repeat(${weeks.length}, ${daySize}px)`
    : `repeat(${weeks.length}, minmax(0, 1fr))`
  const rowTemplate = daySize
    ? `repeat(7, ${daySize}px)`
    : 'repeat(7, minmax(0, 1fr))'

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>
            Calendar heatmap
            <Tooltip label="What is this? A calendar view of daily mood or sleep over time.">
              <span className="tooltip-trigger">
                <span className="tooltip-icon" aria-hidden="true">i</span>
              </span>
            </Tooltip>
          </h2>
          <p className="muted">
            Daily {metric} · Last {totalDays} days
          </p>
        </div>
        <div className="toggle-group">
          <button
            type="button"
            className={`ghost ${metric === 'mood' ? 'active' : ''}`}
            onClick={() => setMetric('mood')}
          >
            Mood
          </button>
          <button
            type="button"
            className={`ghost ${metric === 'sleep' ? 'active' : ''}`}
            onClick={() => setMetric('sleep')}
          >
            Sleep
          </button>
        </div>
      </div>
      <div className="heatmap-layout" role="img" aria-label="Calendar heatmap">
        <div className="heatmap-header">
          <div className="heatmap-spacer" aria-hidden="true" />
          <div
            className="heatmap-months"
            style={{ gridTemplateColumns: columnTemplate }}
          >
            {monthLabels.map((label, index) => (
              <span className="heatmap-month" key={`month-${index}`}>
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="heatmap-body">
          <div className="heatmap-days" aria-hidden="true">
            {dayLabels.map((label, index) => (
              <span className="heatmap-day-label" key={`day-${index}`}>
                {label}
              </span>
            ))}
          </div>
          <div
            className="heatmap-grid"
            ref={gridRef}
            style={{ gridTemplateColumns: columnTemplate }}
          >
            {weeks.map((week, weekIndex) => (
              <div
                className="heatmap-week"
                key={`week-${weekIndex}`}
                style={{ gridTemplateRows: rowTemplate }}
              >
                {week.map((day) => {
                  const color = metric === 'mood'
                    ? getMoodColor(day.mood, moodColors)
                    : getSleepColor(day.sleep)
                  const labelDate = formatLongDate(new Date(`${day.date}T00:00:00`))
                  const valueLabel = metric === 'mood'
                    ? day.mood !== null
                      ? `${day.mood.toFixed(0)} / 5`
                      : 'No entry'
                    : day.sleep !== null
                      ? formatSleepHours(day.sleep)
                      : 'No entry'
                  if (day.isFuture) {
                    return (
                      <span
                        key={day.date}
                        className="heatmap-day future"
                        aria-hidden="true"
                      />
                    )
                  }

                  const tooltipLabel = `${labelDate} · ${valueLabel}`
                  return (
                    <Tooltip key={day.date} label={tooltipLabel}>
                      <span
                        className={`heatmap-day${color ? ' filled' : ''}`}
                        style={color ? { backgroundColor: color } : undefined}
                      />
                    </Tooltip>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="heatmap-legend">
        <span className="muted">Low</span>
        <div className="heatmap-legend-scale">
          {legendColors.map(color => (
            <span
              className="heatmap-legend-swatch"
              key={color}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <span className="muted">High</span>
      </div>
    </section>
  )
}
