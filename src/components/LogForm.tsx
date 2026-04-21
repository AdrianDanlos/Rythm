import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties, type FormEvent, type ChangeEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { DayPicker } from 'react-day-picker'
import { useTranslation } from 'react-i18next'
import { Angry, ChevronDown, Frown, Info, Laugh, Meh, Moon, Smile, Sun } from 'lucide-react'
import { PluginRegistry, TimepickerUI } from 'timepicker-ui'
import { WheelPlugin } from 'timepicker-ui/plugins/wheel'
import 'react-day-picker/dist/style.css'
import 'timepicker-ui/main.css'
import 'timepicker-ui/theme-dark.css'
import { getHighContrastTextColor } from '../lib/utils/colorContrast'
import { formatLongDate } from '../lib/utils/dateFormatters'
import {
  DEFAULT_LOG_SLEEP_HOURS,
  MAX_LOG_SLEEP_MINUTES,
} from '../lib/utils/sleepHours'
import { MAX_TAG_LENGTH, parseTags } from '../lib/utils/stringUtils'
import { useScrollToLogDailyEventsOnMount } from '../hooks/useScrollToLogDailyEventsOnMount'
import { Tooltip } from './Tooltip'

PluginRegistry.register(WheelPlugin)

const MOOD_ICONS: Record<1 | 2 | 3 | 4 | 5, ComponentType<{ 'className'?: string, 'size'?: number, 'aria-hidden'?: boolean }>> = {
  1: Angry,
  2: Frown,
  3: Meh,
  4: Smile,
  5: Laugh,
}

export type LogFormProps = {
  selectedDate: Date
  todayDate: Date
  highlightedDates: Date[]
  incompleteHighlightedDates: Date[]
  sleepHours: string
  mood: number | null
  note: string
  tags: string
  tagSuggestions: string[]
  maxTagsPerEntry: number
  saving: boolean
  saved: boolean
  moodColors: string[]
  formatLocalDate: (date: Date) => string
  tagColors?: Record<string, string>
  onEnsureTagColor?: (tag: string) => void
  onEntryDateChange: (value: string) => void
  onSleepHoursChange: (value: string) => void
  onMoodChange: (value: number) => void
  onNoteChange: (value: string) => void
  onTagsChange: (value: string) => void
  onSave: (event: FormEvent<HTMLFormElement>) => void
}

export const LogForm = ({
  selectedDate,
  todayDate,
  highlightedDates,
  incompleteHighlightedDates,
  sleepHours,
  mood,
  note,
  tags,
  tagSuggestions,
  maxTagsPerEntry,
  saving,
  saved,
  moodColors,
  formatLocalDate,
  tagColors,
  onEnsureTagColor,
  onEntryDateChange,
  onSleepHoursChange,
  onMoodChange,
  onNoteChange,
  onTagsChange,
  onSave,
}: LogFormProps) => {
  const { t } = useTranslation()
  const noteTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const tagDropdownWrapRef = useRef<HTMLDivElement | null>(null)
  const tagInputRef = useRef<HTMLInputElement | null>(null)
  const sleepTimeInputRef = useRef<HTMLInputElement | null>(null)
  const sleepTimepickerRef = useRef<TimepickerUI | null>(null)
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const [isDarkTheme, setIsDarkTheme] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark',
  )

  const openTagDropdownAfterScroll = useCallback((el: HTMLElement) => {
    setTagDropdownOpen(true)
    if (el instanceof HTMLInputElement && !el.disabled) {
      el.focus({ preventScroll: true })
    }
  }, [])

  useScrollToLogDailyEventsOnMount(tagInputRef, openTagDropdownAfterScroll)
  const [tagInputValue, setTagInputValue] = useState('')
  const [tagPlaceholderOverride, setTagPlaceholderOverride] = useState<string | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const calendarWrapRef = useRef<HTMLDivElement | null>(null)

  const usedTags = parseTags(tags)
  const usedTagSet = new Set(usedTags)
  const sortedTagSuggestions = [...tagSuggestions].sort((a, b) =>
    a.localeCompare(b),
  )
  const suggestionsWithinLength = sortedTagSuggestions.filter(
    tag => tag.length <= MAX_TAG_LENGTH,
  )
  const suggestionsWithinLengthSet = new Set(
    suggestionsWithinLength.map(tag => tag.toLowerCase()),
  )
  const token = tagInputValue.trim().toLowerCase()
  const allMatchingSuggestions = token
    ? suggestionsWithinLength.filter(s => s.toLowerCase().includes(token))
    : suggestionsWithinLength
  const dropdownOptions = token
    ? [
        tagInputValue.trim(),
        ...allMatchingSuggestions.filter(s => s.toLowerCase() !== token),
      ]
    : allMatchingSuggestions
  const atMaxTags = usedTags.length >= maxTagsPerEntry

  const updateSleepFromMinutes = useCallback((nextMinutes: number) => {
    const clampedMinutes = Math.max(0, Math.min(MAX_LOG_SLEEP_MINUTES, nextMinutes))
    const nextValue = clampedMinutes / 60
    const formatted = nextValue.toFixed(2).replace(/\.?0+$/, '')
    onSleepHoursChange(formatted)
  }, [onSleepHoursChange])

  const totalSleepMinutes = useMemo(() => {
    const parsedSleepHours = Number(sleepHours)
    const hasSleepValue = sleepHours.trim().length > 0 && Number.isFinite(parsedSleepHours)
    return hasSleepValue
      ? Math.round(parsedSleepHours * 60)
      : DEFAULT_LOG_SLEEP_HOURS * 60
  }, [sleepHours])
  const sleepHourNumber = Math.floor(totalSleepMinutes / 60)
  const sleepMinuteNumber = totalSleepMinutes % 60

  const formatTimeInputValue = useCallback((minutesTotal: number) => {
    const clamped = Math.max(0, Math.min(MAX_LOG_SLEEP_MINUTES, minutesTotal))
    const h = Math.floor(clamped / 60)
    const m = clamped % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    const syncTheme = () => setIsDarkTheme(root.dataset.theme === 'dark')
    syncTheme()
    const observer = new MutationObserver(syncTheme)
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!sleepTimeInputRef.current) return

    // This is a workaround to prevent the modal being slow at closing itself
    const setSleepPickerModalOpacityHidden = (hidden: boolean) => {
      const wrap = document.querySelector<HTMLElement>('.tp-ui-wrapper.sleep-timepicker')
      const modal = wrap?.closest<HTMLElement>('.tp-ui-modal')
      if (!modal) return
      if (hidden) {
        modal.style.opacity = '0'
        modal.style.transition = 'none'
      }
      else {
        modal.style.removeProperty('opacity')
        modal.style.removeProperty('transition')
      }
    }

    const picker = new TimepickerUI(sleepTimeInputRef.current, {
      clock: {
        type: '24h',
        incrementMinutes: 5,
        disabledTime: {
          hours: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
        },
      },
      labels: {
        ok: t('log.sleepTimePickerOk'),
        cancel: t('log.sleepTimePickerCancel'),
        time: t('log.sleepTimePickerSelectTime'),
        mobileTime: t('log.sleepTimePickerEnterTime'),
        mobileHour: t('log.sleepTimePickerHour'),
        mobileMinute: t('log.sleepTimePickerMinute'),
        clear: t('log.sleepTimePickerClear'),
        am: t('log.sleepTimePickerAm'),
        pm: t('log.sleepTimePickerPm'),
      },
      ui: {
        mode: 'compact-wheel',
        theme: isDarkTheme ? 'dark' : 'basic',
        cssClass: 'sleep-timepicker',
        backdrop: true,
      },
      behavior: {
        delayHandler: 0,
      },
      wheel: {
        hideDisabled: true,
      },
    })
    picker.on('open', () => {
      setSleepPickerModalOpacityHidden(false)
    })
    picker.on('cancel', () => {
      setSleepPickerModalOpacityHidden(true)
    })
    picker.on('confirm', ({ hour, minutes }) => {
      setSleepPickerModalOpacityHidden(true)
      if (hour == null || minutes == null) return
      const parsedHour = Number(hour)
      const parsedMinute = Number(minutes)
      if (!Number.isFinite(parsedHour) || !Number.isFinite(parsedMinute)) return
      if (parsedHour < 0 || parsedHour > 12 || parsedMinute < 0 || parsedMinute > 59) return
      if (parsedHour === 12 && parsedMinute > 55) return
      updateSleepFromMinutes(parsedHour * 60 + parsedMinute)
    })
    picker.create()
    sleepTimepickerRef.current = picker
    return () => {
      picker.destroy()
      sleepTimepickerRef.current = null
    }
  }, [isDarkTheme, t, updateSleepFromMinutes])

  useEffect(() => {
    if (!sleepTimeInputRef.current || !sleepTimepickerRef.current) return
    const timeValue = formatTimeInputValue(totalSleepMinutes)
    sleepTimeInputRef.current.value = timeValue
    sleepTimepickerRef.current.setValue(timeValue)
  }, [formatTimeInputValue, totalSleepMinutes])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!tagDropdownWrapRef.current) return
      if (event.target instanceof Node && tagDropdownWrapRef.current.contains(event.target)) {
        return
      }
      setTagDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!calendarOpen) return
    const close = (event: MouseEvent) => {
      if (!calendarWrapRef.current) return
      if (event.target instanceof Node && calendarWrapRef.current.contains(event.target)) return
      setCalendarOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCalendarOpen(false)
    }
    document.addEventListener('mousedown', close)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [calendarOpen])

  const isEntryToday = formatLocalDate(selectedDate) === formatLocalDate(todayDate)

  const addTag = (tag: string) => {
    const normalized = tag.trim().toLowerCase()
    if (
      !normalized
      || normalized.length > MAX_TAG_LENGTH
      || usedTagSet.has(normalized)
      || atMaxTags
    ) return

    if (!tagColors?.[normalized]) {
      onEnsureTagColor?.(normalized)
    }

    const nextList = [...usedTags, normalized]
    onTagsChange(nextList.join(', '))
    setTagInputValue('')
    setTagPlaceholderOverride(null)
  }

  const removeTag = (tag: string) => {
    const nextList = usedTags.filter(t => t !== tag)
    onTagsChange(nextList.join(', '))
  }

  const submitTagInput = () => {
    if (atMaxTags) return
    if (!tagInputValue.trim()) {
      setTagPlaceholderOverride(t('log.typeEventPrompt'))
      setTagDropdownOpen(true)
      // Keep the input focused so mobile keyboards open.
      tagInputRef.current?.focus()
      return
    }
    addTag(tagInputValue)
  }

  const autoResizeNote = () => {
    const textarea = noteTextareaRef.current
    if (!textarea) return
    const minH = textarea.classList.contains('log-diary-textarea') ? 88 : 44
    textarea.style.height = '0px'
    textarea.style.height = `${Math.max(minH, textarea.scrollHeight)}px`
  }

  useEffect(() => {
    autoResizeNote()
  }, [note])

  const handleNoteChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onNoteChange(event.target.value.slice(0, 300))
  }

  return (
    <form onSubmit={onSave} className="log-form-stack">
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
                  <span className="log-date-picker-date-primary">{formatLongDate(selectedDate)}</span>
                )}
          </span>
          <span className="log-date-picker-toggle" aria-hidden>
            <ChevronDown
              className={`log-date-picker-chevron${calendarOpen ? ' is-open' : ''}`}
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
      </div>
      <div
        className={`log-reflection-card log-reflection-block${mood != null ? ' log-reflection-card--mood-selected' : ''}`}
        style={
          mood != null
            ? ({ '--reflection-mood-tint': moodColors[mood - 1] ?? moodColors[2] } as CSSProperties)
            : undefined
        }
      >
        <header className="log-reflection-header">
          <div className="log-reflection-icon" aria-hidden="true">
            <Sun size={28} strokeWidth={2} />
          </div>
          <h2 className="log-reflection-title">{t('log.reflectionTitle')}</h2>
          <p className="log-reflection-subtitle">{t('log.reflectionSubtitle')}</p>
        </header>

        <div className="field field--tags log-reflection-tags">
          <div className="log-reflection-section-label">
            {t('log.sectionTags')}
            <Tooltip label={t('log.eventsTooltip')}>
              <span className="tooltip-trigger log-reflection-label-tip">
                <span className="tooltip-icon" aria-hidden="true">
                  <Info size={14} />
                </span>
              </span>
            </Tooltip>
          </div>
          <div className="tag-control-row tag-control-row--reflection">
            <div className="tag-dropdown-wrap" ref={tagDropdownWrapRef}>
              <input
                ref={tagInputRef}
                type="text"
                className="tag-dropdown-trigger log-reflection-input"
                aria-haspopup="listbox"
                aria-expanded={tagDropdownOpen}
                aria-label={t('log.addEventsAria')}
                placeholder={
                  atMaxTags
                    ? t('log.maxReached', { count: maxTagsPerEntry })
                    : tagPlaceholderOverride ?? t('log.tagInputPlaceholder')
                }
                value={tagInputValue}
                disabled={atMaxTags}
                onChange={(e) => {
                  if (tagPlaceholderOverride) {
                    setTagPlaceholderOverride(null)
                  }
                  setTagInputValue(e.target.value.slice(0, MAX_TAG_LENGTH))
                  setTagDropdownOpen(true)
                }}
                maxLength={MAX_TAG_LENGTH}
                onFocus={() => setTagDropdownOpen(true)}
                onClick={() => setTagDropdownOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    submitTagInput()
                  }
                }}
              />
              {tagDropdownOpen && (
                <div className="tag-suggestions" role="listbox">
                  {dropdownOptions.length > 0
                    ? dropdownOptions.map((suggestion) => {
                        const isAdded = usedTagSet.has(suggestion.toLowerCase())
                        const isCreatableOption = token.length > 0
                          && suggestion === tagInputValue.trim()
                          && !suggestionsWithinLengthSet.has(suggestion.toLowerCase())
                        return (
                          <button
                            key={suggestion}
                            type="button"
                            className={`tag-suggestion${isAdded ? ' tag-suggestion--added' : ''}${isCreatableOption ? ' tag-suggestion--creatable' : ''}`}
                            aria-label={isAdded ? t('log.removeTag', { tag: suggestion }) : undefined}
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => isAdded ? removeTag(suggestion.toLowerCase()) : addTag(suggestion)}
                          >
                            {isAdded
                              ? (
                                  <>
                                    <span className="tag-suggestion-check" aria-hidden="true">✓</span>
                                    <span className="tag-suggestion-label">{suggestion}</span>
                                  </>
                                )
                              : (
                                  isCreatableOption
                                    ? (
                                        <>
                                          <span className="tag-suggestion-label">{suggestion}</span>
                                          <span className="tag-suggestion-action">{t('log.addTagOption')}</span>
                                        </>
                                      )
                                    : suggestion
                                )}
                          </button>
                        )
                      })
                    : (
                        <span className="tag-suggestions-empty">
                          {token
                            ? t('log.pressEnterForNew')
                            : t('log.noSuggestions')}
                        </span>
                      )}
                </div>
              )}
            </div>
            <div className="tag-add-wrap">
              <button
                type="button"
                className="tag-add-button log-reflection-done"
                onClick={() => setTagDropdownOpen(false)}
              >
                {t('log.done')}
              </button>
            </div>
          </div>
          {usedTags.length > 0 && (
            <div className="tag-pills-row">
              {usedTags.map((tag, index) => {
                const colorKey = tag.trim().toLowerCase()
                const tagColor = tagColors?.[colorKey]
                const textColor = getHighContrastTextColor(tagColor)
                return (
                  <span
                    key={tag}
                    className="tag-pill"
                    data-color-index={index}
                    style={tagColor ? { backgroundColor: tagColor, color: textColor } : undefined}
                  >
                    #{tag}
                    <button
                      type="button"
                      className="tag-badge-remove"
                      style={{ color: 'inherit' }}
                      aria-label={t('log.removeTag', { tag })}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => removeTag(tag)}
                    >
                      ×
                    </button>
                  </span>
                )
              })}
            </div>
          )}
        </div>

        <div className="log-reflection-section log-reflection-section--mood">
          <div className="log-reflection-section-label">
            {t('log.sectionMood')}
          </div>
          <div className="mood-row" role="group" aria-label={t('log.moodQuestion')}>
            {([1, 2, 3, 4, 5] as const).map((value) => {
              const Icon = MOOD_ICONS[value]
              return (
                <button
                  key={value}
                  type="button"
                  className={`mood-button ${mood === value ? 'active' : ''}`}
                  onClick={() => onMoodChange(value)}
                  style={
                    {
                      '--mood-color': moodColors[value - 1],
                    } as CSSProperties
                  }
                  aria-pressed={mood === value}
                  aria-label={
                    [
                      t('log.moodName1'),
                      t('log.moodName2'),
                      t('log.moodName3'),
                      t('log.moodName4'),
                      t('log.moodName5'),
                    ][value - 1]!
                  }
                >
                  <Icon className="mood-button-icon" size={26} aria-hidden />
                  <span className="mood-button-num">{value}</span>
                </button>
              )
            })}
          </div>
          <p
            className={`mood-selected-name${mood == null ? ' mood-selected-name--placeholder' : ''}`}
            aria-live="polite"
          >
            {mood != null
              ? t(`log.moodName${mood}` as 'log.moodName1')
              : t('log.selectMoodHint')}
          </p>
        </div>

        <div className="log-reflection-section log-reflection-diary">
          <div className="log-reflection-section-label">
            {t('log.sectionThoughts')} ({t('log.optionalShort')})
          </div>
          <textarea
            ref={noteTextareaRef}
            className="log-diary-textarea"
            value={note}
            onChange={handleNoteChange}
            onInput={autoResizeNote}
            placeholder={t('log.journalThoughtsPlaceholder')}
            maxLength={300}
            rows={3}
            aria-label={`${t('log.sectionThoughts')} (${t('log.optionalShort')})`}
          />
          <div className="log-diary-footer">
            <span>{t('log.characterCount', { count: note.length })}</span>
          </div>
        </div>
      </div>
      <button type="submit" disabled={saving} className="save-button">
        {saving
          ? <span className="spinner" aria-label={t('log.saving')} />
          : saved
            ? t('log.saved')
            : t('log.save')}
      </button>
    </form>
  )
}
