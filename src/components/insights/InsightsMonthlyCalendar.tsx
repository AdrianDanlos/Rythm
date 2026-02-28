import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Entry } from '../../lib/entries'
import { formatLocalDate, getDateLocale } from '../../lib/utils/dateFormatters'
import { InsightsDayDetailModal } from './InsightsDayDetailModal'

type InsightsMonthlyCalendarProps = {
  entries: Entry[]
  moodColors: string[]
  isMobile: boolean
  entriesLoading: boolean
}

type CalendarDay = {
  date: Date
  key: string
  inCurrentMonth: boolean
  isToday: boolean
  isFuture: boolean
  entry: Entry | null
}

const startOfMonth = (value: Date) => new Date(value.getFullYear(), value.getMonth(), 1)

const buildMonthDays = (visibleMonth: Date, entriesByDate: Map<string, Entry>) => {
  const firstDay = startOfMonth(visibleMonth)
  const startOffset = (firstDay.getDay() + 6) % 7
  const gridStart = new Date(firstDay)
  gridStart.setDate(firstDay.getDate() - startOffset)
  const lastDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0)
  const endOffset = 6 - ((lastDay.getDay() + 6) % 7)
  const totalCells = startOffset + lastDay.getDate() + endOffset

  const days: CalendarDay[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayMs = today.getTime()
  const cursor = new Date(gridStart)

  for (let i = 0; i < totalCells; i += 1) {
    const key = formatLocalDate(cursor)
    const isToday = key === formatLocalDate(today)
    const inCurrentMonth = cursor.getMonth() === visibleMonth.getMonth()
      && cursor.getFullYear() === visibleMonth.getFullYear()
    const currentMs = cursor.getTime()

    days.push({
      date: new Date(cursor),
      key,
      inCurrentMonth,
      isToday,
      isFuture: currentMs > todayMs,
      entry: entriesByDate.get(key) ?? null,
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

export const InsightsMonthlyCalendar = ({
  entries,
  moodColors,
  isMobile,
  entriesLoading,
}: InsightsMonthlyCalendarProps) => {
  const { t } = useTranslation()
  const dateLocale = getDateLocale()
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const entriesByDate = useMemo(() => {
    const map = new Map<string, Entry>()
    entries.forEach((entry) => {
      map.set(entry.entry_date, entry)
    })
    return map
  }, [entries])

  const monthDays = useMemo(
    () => buildMonthDays(visibleMonth, entriesByDate),
    [visibleMonth, entriesByDate],
  )

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(dateLocale, { month: 'long', year: 'numeric' }).format(visibleMonth),
    [dateLocale, visibleMonth],
  )

  const monthHasEntries = useMemo(
    () => monthDays.some(day => day.inCurrentMonth && day.entry),
    [monthDays],
  )

  const selectedEntry = selectedDate ? entriesByDate.get(selectedDate) ?? null : null

  return (
    <section className="card monthly-calendar-card">
      <div className="card-header">
        <div>
          <h2>{t('insights.calendar')}</h2>
          <p className="muted">{t('insights.overviewDailyLogs')}</p>
        </div>
        <div className="toggle-group monthly-calendar-nav">
          <button
            type="button"
            className="ghost"
            aria-label={t('insights.previousMonth')}
            onClick={() => setVisibleMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
          >
            {t('insights.prev')}
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => setVisibleMonth(startOfMonth(new Date()))}
          >
            {t('insights.today')}
          </button>
          <button
            type="button"
            className="ghost"
            aria-label={t('insights.nextMonth')}
            onClick={() => setVisibleMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
          >
            {t('insights.next')}
          </button>
        </div>
      </div>

      <p className="monthly-calendar-title">{monthLabel}</p>

      {entriesLoading
        ? (
            <div className="monthly-calendar-loading" aria-live="polite">
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
            </div>
          )
        : (
            <>
              <div className="monthly-calendar-grid" role="grid" aria-label={t('insights.calendarForAria', { month: monthLabel })}>
                {[
                  t('insights.weekdayMonShort'),
                  t('insights.weekdayTueShort'),
                  t('insights.weekdayWedShort'),
                  t('insights.weekdayThuShort'),
                  t('insights.weekdayFriShort'),
                  t('insights.weekdaySatShort'),
                  t('insights.weekdaySunShort'),
                ].map(label => (
                  <div key={label} className="monthly-calendar-weekday" role="columnheader">{label}</div>
                ))}
                {monthDays.map((day) => {
                  const moodValue = day.entry?.mood === null || day.entry?.mood === undefined
                    ? Number.NaN
                    : Number(day.entry.mood)
                  const moodIndex = Number.isFinite(moodValue)
                    ? Math.min(4, Math.max(0, Math.round(moodValue) - 1))
                    : -1
                  const moodColor = moodIndex >= 0 ? moodColors[moodIndex] ?? undefined : undefined

                  return (
                    <button
                      type="button"
                      key={day.key}
                      role="gridcell"
                      className={[
                        'monthly-calendar-day',
                        day.inCurrentMonth ? '' : 'outside-month',
                        day.isToday ? 'today' : '',
                        day.entry ? 'has-entry' : '',
                        day.isFuture ? 'future' : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => setSelectedDate(day.key)}
                      aria-label={`${day.key}${day.entry ? t('insights.hasEntryAria') : `, ${t('insights.noEntryShort').toLowerCase()}`}`}
                    >
                      <span className="monthly-calendar-day__number">{day.date.getDate()}</span>
                      <span className="monthly-calendar-day__meta">
                        {day.entry
                          ? (
                              <span className="monthly-calendar-day__logged" aria-label={t('insights.entryLogged')}>
                                <span
                                  className="monthly-calendar-day__dot"
                                  style={moodColor ? { backgroundColor: moodColor } : undefined}
                                  aria-hidden="true"
                                />
                                <span aria-hidden="true">✓</span>
                              </span>
                            )
                          : (
                              <span className="muted monthly-calendar-day__empty">
                                {isMobile ? '' : t('insights.noEntryShort')}
                              </span>
                            )}
                      </span>
                    </button>
                  )
                })}
              </div>

              {!monthHasEntries
                ? <p className="muted monthly-calendar-empty">{t('insights.noEntriesThisMonth')}</p>
                : null}
            </>
          )}

      <InsightsDayDetailModal
        isOpen={Boolean(selectedDate)}
        dateKey={selectedDate ?? formatLocalDate(new Date())}
        entry={selectedEntry}
        moodColors={moodColors}
        onClose={() => setSelectedDate(null)}
      />
    </section>
  )
}
