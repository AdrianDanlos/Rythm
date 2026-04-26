import { type RefObject, type SetStateAction } from 'react'
import classNames from 'classnames'
import { AnimatePresence, motion } from 'framer-motion'
import { DayPicker } from 'react-day-picker'
import type { TFunction } from 'i18next'
import { ChevronDown, Info, Moon } from 'lucide-react'
import type { TimepickerUI } from 'timepicker-ui'
import { formatLongDate } from '../../lib/utils/dateFormatters'
import { Tooltip } from '../Tooltip'
type LogFormSleepPageProps = {
  isEntryToday: boolean
  selectedDate: Date
  todayDate: Date
  highlightedDates: Date[]
  incompleteHighlightedDates: Date[]
  onEntryDateChange: (value: string) => void
  formatLocalDate: (date: Date) => string
  calendarOpen: boolean
  setCalendarOpen: (value: SetStateAction<boolean>) => void
  calendarWrapRef: RefObject<HTMLDivElement | null>
  sleepHourNumber: number
  sleepMinuteNumber: number
  sleepTimeInputRef: RefObject<HTMLInputElement | null>
  sleepTimepickerRef: RefObject<TimepickerUI | null>
  onNext: () => void
  t: TFunction
}

export function LogFormSleepPage({
  isEntryToday,
  selectedDate,
  todayDate,
  highlightedDates,
  incompleteHighlightedDates,
  onEntryDateChange,
  formatLocalDate,
  calendarOpen,
  setCalendarOpen,
  calendarWrapRef,
  sleepHourNumber,
  sleepMinuteNumber,
  sleepTimeInputRef,
  sleepTimepickerRef,
  onNext,
  t,
}: LogFormSleepPageProps) {
  return (
    <>
      <div id="log-calendar" ref={calendarWrapRef} className="log-date-picker-wrap">
        <button
          type="button"
          className="log-date-picker-collapsed"
          aria-expanded={calendarOpen}
          aria-controls="log-daypicker-panel"
          onClick={() => setCalendarOpen(o => !o)}
        >
          <span className="log-date-picker-date">
            {isEntryToday
              ? (
                  <>
                    <span className="log-date-picker-date-primary">{t('insights.today')}</span>
                    <span className="log-date-picker-date-sub">{formatLongDate(selectedDate)}</span>
                  </>
                )
              : (
                  <span className="log-date-picker-date-sub">{formatLongDate(selectedDate)}</span>
                )}
          </span>
          <span className="log-date-picker-toggle" aria-hidden>
            <ChevronDown
              className={classNames('log-date-picker-chevron', { 'is-open': calendarOpen })}
              size={22}
              aria-hidden
            />
          </span>
        </button>
        <AnimatePresence initial={false}>
          {calendarOpen
            ? (
                <motion.div
                  key="log-daypicker-panel"
                  id="log-daypicker-panel"
                  role="region"
                  aria-label={t('log.openDatePicker')}
                  className="log-date-picker-panel-motion"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    height: {
                      duration: 0.32,
                      ease: [0.4, 0, 0.2, 1],
                    },
                    opacity: {
                      duration: 0.22,
                      ease: 'easeOut',
                    },
                  }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="date-picker log-date-picker-panel">
                    <DayPicker
                      mode="single"
                      weekStartsOn={1}
                      selected={selectedDate}
                      defaultMonth={selectedDate}
                      onSelect={(date: Date | undefined) => {
                        if (!date) return
                        onEntryDateChange(formatLocalDate(date))
                        setCalendarOpen(false)
                      }}
                      disabled={{ after: todayDate }}
                      modifiers={{
                        logged: highlightedDates,
                        incomplete: incompleteHighlightedDates,
                      }}
                      modifiersClassNames={{
                        logged: 'rdp-day-logged',
                        incomplete: 'rdp-day-incomplete',
                      }}
                    />
                  </div>
                </motion.div>
              )
            : null}
        </AnimatePresence>
      </div>
      <div className="log-form-carousel__sleep-land">
        <div className="log-form-carousel__sleep-cluster">
          <div className="sleep-duration-picker">
            <div className="sleep-duration-picker__hero" aria-hidden="true">
              <Moon size={20} />
            </div>
            <div className="sleep-duration-picker__title-row">
              <p className="sleep-duration-picker__title">{t('log.sleepQuestion')}</p>
            </div>
            <p className="sleep-duration-picker__subtitle">
              <span>{t('log.sleepSubtitle', { defaultValue: 'Track your rest' })}</span>
              {' '}
              <Tooltip label={t('log.sleepTooltip')}>
                <span className="tooltip-trigger">
                  <span className="tooltip-icon" aria-hidden="true">
                    <Info size={14} />
                  </span>
                </span>
              </Tooltip>
            </p>
            <div
              className="sleep-duration-picker__value"
              role="button"
              tabIndex={0}
              aria-label={t('log.pickTime', { defaultValue: 'Pick time' })}
              onClick={() => sleepTimepickerRef.current?.open()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  sleepTimepickerRef.current?.open()
                }
              }}
            >
              <span className="sleep-duration-picker__value-main">{sleepHourNumber}</span>
              <span className="sleep-duration-picker__value-unit">{t('log.hours').charAt(0).toLowerCase()}</span>
              <span className="sleep-duration-picker__value-main">{String(sleepMinuteNumber).padStart(2, '0')}</span>
              <span className="sleep-duration-picker__value-unit">{t('log.minutes').charAt(0).toLowerCase()}</span>
            </div>
            <div className="sleep-duration-picker__picker-row">
              <input
                ref={sleepTimeInputRef}
                type="text"
                className="sleep-duration-picker__picker-anchor"
                aria-hidden="true"
                tabIndex={-1}
              />
              <button
                type="button"
                className="sleep-duration-picker__picker-button"
                onClick={() => sleepTimepickerRef.current?.open()}
              >
                {t('log.pickTime', { defaultValue: 'Pick time' })}
              </button>
            </div>
            <div className="sleep-duration-picker__next-wrap">
              <button
                type="button"
                className="save-button sleep-duration-picker__next"
                onClick={onNext}
              >
                {t('intro.next')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
