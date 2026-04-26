import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type FormEvent,
} from 'react'
import classNames from 'classnames'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { DayPicker } from 'react-day-picker'
import { useTranslation } from 'react-i18next'
import { Angry, ChevronDown, Frown, Info, Laugh, Meh, Moon, NotebookPen, Smile, Sun, Tags } from 'lucide-react'
import { PluginRegistry, TimepickerUI } from 'timepicker-ui'
import { WheelPlugin } from 'timepicker-ui/plugins/wheel'
import 'react-day-picker/dist/style.css'
import 'timepicker-ui/main.css'
import { getInitialLogCarouselPageFromSession, useScrollToLogDailyEventsOnMount } from '../hooks/useScrollToLogDailyEventsOnMount'
import { motionTransition } from '../lib/motion'
import { formatLongDate } from '../lib/utils/dateFormatters'
import {
  DEFAULT_LOG_SLEEP_HOURS,
  MAX_LOG_SLEEP_MINUTES,
} from '../lib/utils/sleepHours'
import { MAX_TAG_LENGTH, parseTags } from '../lib/utils/stringUtils'
import { EventTagSelector, type EventTagOption } from './EventTagSelector'
import { Tooltip } from './Tooltip'

PluginRegistry.register(WheelPlugin)

const MOOD_ICONS: Record<1 | 2 | 3 | 4 | 5, ComponentType<{ 'className'?: string, 'size'?: number, 'aria-hidden'?: boolean }>> = {
  1: Angry,
  2: Frown,
  3: Meh,
  4: Smile,
  5: Laugh,
}
const JOURNAL_RULE_COUNT = 32

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
  const noteEditorRef = useRef<HTMLDivElement | null>(null)
  const tagInputRef = useRef<HTMLInputElement | null>(null)
  const sleepTimeInputRef = useRef<HTMLInputElement | null>(null)
  const sleepTimepickerRef = useRef<TimepickerUI | null>(null)
  const focusTagInputAfterScroll = useCallback((el: HTMLElement) => {
    if (el instanceof HTMLInputElement && !el.disabled) {
      el.focus({ preventScroll: true })
    }
  }, [])

  useScrollToLogDailyEventsOnMount(tagInputRef, focusTagInputAfterScroll)
  const [tagInputValue, setTagInputValue] = useState('')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const calendarWrapRef = useRef<HTMLDivElement | null>(null)
  const formRef = useRef<HTMLFormElement | null>(null)
  const reduceMotion = useReducedMotion()
  const slideTransition = reduceMotion ? { duration: 0 } : motionTransition
  const entryDateKey = formatLocalDate(selectedDate)
  const [carouselState, setCarouselState] = useState<{
    entryDateKey: string
    page: 0 | 1 | 2 | 3
  }>(() => ({
    entryDateKey,
    page: getInitialLogCarouselPageFromSession(),
  }))
  const carouselPage = carouselState.entryDateKey === entryDateKey
    ? carouselState.page
    : 0
  const setCarouselPage = useCallback((page: 0 | 1 | 2 | 3) => {
    setCarouselState({
      entryDateKey,
      page,
    })
  }, [entryDateKey])

  const usedTags = parseTags(tags)
  const usedTagSet = new Set(usedTags)
  const sortedTagSuggestions = [...tagSuggestions].sort((a, b) =>
    a.localeCompare(b),
  )
  const suggestionsWithinLength = sortedTagSuggestions.filter(
    tag => tag.length <= MAX_TAG_LENGTH,
  )
  const token = tagInputValue.trim().toLowerCase()
  const hasExactKnownMatch = token.length > 0
    && suggestionsWithinLength.some(tag => tag.toLowerCase() === token)
  const visibleTagOptions = useMemo((): EventTagOption[] => {
    const selectedSet = new Set(usedTags)
    const selectedFirst = usedTags
      .map((key) => {
        const matchingSuggestion = suggestionsWithinLength.find(tag => tag.toLowerCase() === key)
        return {
          key,
          label: matchingSuggestion ?? key,
        }
      })
      .filter(Boolean)

    const matchedUnselected = suggestionsWithinLength.flatMap((tag) => {
      const normalizedTag = tag.toLowerCase()
      if (selectedSet.has(normalizedTag)) return []
      if (token && !normalizedTag.includes(token)) return []
      return [{
        key: normalizedTag,
        label: tag,
      }]
    })

    return [...selectedFirst, ...matchedUnselected]
  }, [suggestionsWithinLength, token, usedTags])
  const atMaxTags = usedTags.length >= maxTagsPerEntry
  const showCreateTagSuggestion = token.length > 0
    && !usedTagSet.has(token)
    && !hasExactKnownMatch
    && !atMaxTags

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
        theme: 'basic',
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
  }, [t, updateSleepFromMinutes])

  useEffect(() => {
    if (!sleepTimeInputRef.current || !sleepTimepickerRef.current) return
    const timeValue = formatTimeInputValue(totalSleepMinutes)
    sleepTimeInputRef.current.value = timeValue
    sleepTimepickerRef.current.setValue(timeValue)
  }, [formatTimeInputValue, totalSleepMinutes])

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
  const hasAtLeastOneEvent = usedTags.length > 0
  const submitWithSaveHandler = useCallback(() => {
    formRef.current?.requestSubmit()
  }, [])

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
  }

  const removeTag = (tag: string) => {
    const nextList = usedTags.filter(t => t !== tag)
    onTagsChange(nextList.join(', '))
  }

  const toggleTagOption = (option: EventTagOption) => {
    if (usedTagSet.has(option.key)) {
      removeTag(option.key)
      return
    }
    if (atMaxTags) return
    addTag(option.label)
  }

  const normalizeNoteText = useCallback((value: string) => {
    return value.replace(/\r\n?/g, '\n').replace(/\u00A0/g, ' ')
  }, [])

  const hydrateJournalEditor = useCallback((editor: HTMLDivElement) => {
    const currentValue = normalizeNoteText(editor.innerText)
    if (currentValue !== note) {
      editor.innerText = note
    }
    editor.dataset.empty = String(note.length === 0)
  }, [normalizeNoteText, note])

  const setNoteEditorRef = useCallback((node: HTMLDivElement | null) => {
    noteEditorRef.current = node
    if (!node) return
    hydrateJournalEditor(node)
  }, [hydrateJournalEditor])

  useEffect(() => {
    const editor = noteEditorRef.current
    if (!editor) return
    hydrateJournalEditor(editor)
  }, [carouselPage, entryDateKey, hydrateJournalEditor, normalizeNoteText, note])

  const placeCaretAtEnd = (element: HTMLElement) => {
    const selection = window.getSelection()
    if (!selection) return
    const range = document.createRange()
    range.selectNodeContents(element)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  const handleNoteInput = (event: FormEvent<HTMLDivElement>) => {
    const editor = event.currentTarget
    const normalized = normalizeNoteText(editor.innerText)
    const clampedValue = normalized.slice(0, 300)
    if (clampedValue !== normalized) {
      editor.innerText = clampedValue
      placeCaretAtEnd(editor)
    }
    editor.dataset.empty = String(clampedValue.length === 0)
    if (clampedValue !== note) {
      onNoteChange(clampedValue)
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSave}
      data-log-carousel-page={carouselPage}
      className={classNames(
        'log-form-stack',
        'log-form-stack--step-fullbleed',
        carouselPage === 0 && 'log-form-stack--carousel-sleep',
      )}
    >
      <div
        className="log-form-carousel log-form-carousel--fullbleed"
        role="group"
        aria-label={t('log.carouselAria')}
      >
        <AnimatePresence mode="wait" initial={false}>
          {carouselPage === 0
            && (
              <motion.div
                key={0}
                className="log-form-carousel__slide log-form-carousel__slide--sleep"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={slideTransition}
              >
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
                          onClick={() => setCarouselPage(1)}
                        >
                          {t('intro.next')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          {carouselPage === 1
            && (
              <motion.div
                key={1}
                className="log-form-carousel__slide log-form-carousel__slide--reflection"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                layout
                transition={slideTransition}
              >
                <div className="log-form-carousel__reflection-land">
                  <div className="log-form-carousel__reflection-cluster">
                    <div
                      className={classNames('log-reflection-card', 'log-reflection-block', {
                        'log-reflection-card--mood-selected': mood != null,
                      })}
                      style={
                        mood != null
                          ? ({
                              '--reflection-mood-tint': moodColors[mood - 1] ?? moodColors[2],
                              '--mood-aura-x': ['10%', '30%', '50%', '70%', '90%'][mood - 1]!,
                            } as CSSProperties)
                          : undefined
                      }
                    >
                      <header className="log-reflection-header">
                        <div className="log-reflection-icon" aria-hidden="true">
                          <Sun size={28} strokeWidth={2} />
                        </div>
                        <h2 className="log-reflection-title">{t('log.reflectionTitle')}</h2>
                        <p className="log-reflection-subtitle">{t('log.tip')}</p>
                      </header>

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
                                className={classNames('mood-button', { active: mood === value })}
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
                          className={classNames('mood-selected-name', {
                            'mood-selected-name--placeholder': mood == null,
                          })}
                          aria-live="polite"
                        >
                          {mood != null
                            ? t(`log.moodName${mood}` as 'log.moodName1')
                            : t('log.selectMoodHint')}
                        </p>
                      </div>
                    </div>
                    <motion.div className="log-form-carousel__actions" layout="position">
                      <button
                        type="button"
                        className="ghost log-form-carousel__skip"
                        onClick={submitWithSaveHandler}
                        disabled={saving}
                      >
                        {t('intro.skip')}
                      </button>
                      <button
                        type="button"
                        className="save-button log-form-carousel__primary"
                        onClick={() => setCarouselPage(2)}
                        disabled={mood == null}
                      >
                        {t('intro.next')}
                      </button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          {carouselPage === 2
            && (
              <motion.div
                key={2}
                className="log-form-carousel__slide log-form-carousel__slide--reflection"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                layout
                transition={slideTransition}
              >
                <div className="log-form-carousel__reflection-land">
                  <div className="log-form-carousel__reflection-cluster">
                    <div className="log-reflection-card log-reflection-block">
                      <header className="log-reflection-header">
                        <div className={classNames('log-reflection-icon', 'log-reflection-icon--tags')} aria-hidden="true">
                          <Tags size={28} strokeWidth={2} />
                        </div>
                        <div className="log-reflection-title-wrap">
                          <h2 className="log-reflection-title log-reflection-title--with-tip">
                            {t('log.journalPageTitle')}
                            <Tooltip label={t('log.eventsTooltip')}>
                              <span className="tooltip-trigger log-reflection-title-tip">
                                <span className="tooltip-icon" aria-hidden="true">
                                  <Info size={14} />
                                </span>
                              </span>
                            </Tooltip>
                          </h2>
                        </div>
                      </header>

                      <div className="field log-reflection-tags">
                        <div className="tag-control-row tag-control-row--reflection">
                          <div className="tag-dropdown-wrap">
                            <EventTagSelector
                              searchValue={tagInputValue}
                              onSearchChange={value => setTagInputValue(value.slice(0, MAX_TAG_LENGTH))}
                              searchPlaceholder={atMaxTags ? t('log.maxReached', { count: maxTagsPerEntry }) : t('insights.timelineFilters.searchEvents')}
                              searchAriaLabel={t('insights.timelineFilters.searchEvents')}
                              options={visibleTagOptions}
                              selectedKeys={usedTagSet}
                              onToggleOption={toggleTagOption}
                              tagColors={tagColors ?? {}}
                              inputRef={tagInputRef}
                              inputMaxLength={MAX_TAG_LENGTH}
                              isOptionDisabled={(_, isSelected) => atMaxTags && !isSelected}
                              listAboveInput
                              onSubmitSearch={() => {
                                if (atMaxTags) return
                                if (!tagInputValue.trim()) return
                                addTag(tagInputValue)
                              }}
                              createSuggestion={
                                showCreateTagSuggestion
                                  ? {
                                      label: `#${tagInputValue.trim()}`,
                                      actionLabel: t('log.addTagOption'),
                                      ariaLabel: t('log.addTagOption'),
                                      onClick: () => addTag(tagInputValue),
                                    }
                                  : undefined
                              }
                            />
                          </div>
                        </div>
                      </div>

                    </div>
                    <motion.div className="log-form-carousel__actions log-form-carousel__actions--reflection-tight" layout="position">
                      <button
                        type="button"
                        className="ghost log-form-carousel__skip"
                        onClick={submitWithSaveHandler}
                        disabled={saving}
                      >
                        {t('intro.skip')}
                      </button>
                      <button
                        type="button"
                        className="save-button log-form-carousel__primary"
                        onClick={() => setCarouselPage(3)}
                        disabled={!hasAtLeastOneEvent}
                      >
                        {t('intro.next')}
                      </button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          {carouselPage === 3
            && (
              <motion.div
                key={3}
                className="log-form-carousel__slide log-form-carousel__slide--reflection"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                layout
                transition={slideTransition}
              >
                <div className="log-form-carousel__reflection-land">
                  <div className="log-form-carousel__reflection-cluster">
                    <div className="log-reflection-card log-reflection-block log-reflection-block--journal">
                      <header className="log-reflection-header">
                        <div className={classNames('log-reflection-icon', 'log-reflection-icon--journal')} aria-hidden="true">
                          <NotebookPen size={28} strokeWidth={2} />
                        </div>
                        <h2 className="log-reflection-title">{t('log.journalNotesTitle')}</h2>
                        <p className="log-reflection-subtitle">{t('log.journalPageSubtitle')}</p>
                      </header>

                      <div className="log-reflection-section log-reflection-diary">
                        <div className="log-diary-surface">
                          <div className="log-diary-rules" aria-hidden="true">
                            {Array.from({ length: JOURNAL_RULE_COUNT }).map((_, index) => (
                              <span key={`rule-${index}`} className="log-diary-rule" />
                            ))}
                          </div>
                          <div
                            ref={setNoteEditorRef}
                            className="log-diary-editor"
                            contentEditable
                            suppressContentEditableWarning
                            role="textbox"
                            aria-multiline="true"
                            data-empty={note.length === 0}
                            data-placeholder={t('log.journalThoughtsPlaceholder')}
                            aria-label={`${t('log.sectionThoughts')} (${t('log.optionalShort')})`}
                            onInput={handleNoteInput}
                          />
                        </div>
                        <div className="log-diary-footer">
                          <span>{t('log.characterCount', { count: note.length })}</span>
                        </div>
                      </div>
                    </div>
                    <motion.div className="log-form-carousel__actions log-form-carousel__actions--reflection-tight" layout="position">
                      <button
                        type="button"
                        className="ghost log-form-carousel__skip"
                        onClick={submitWithSaveHandler}
                        disabled={saving}
                      >
                        {t('intro.skip')}
                      </button>
                      <button
                        type="button"
                        className="save-button log-form-carousel__primary"
                        onClick={submitWithSaveHandler}
                        disabled={saving}
                      >
                        {saving
                          ? <span className="spinner" aria-label={t('log.saving')} />
                          : saved
                            ? t('log.saved')
                            : t('log.finish')}
                      </button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
        </AnimatePresence>
        <div className="intro-carousel__pagination log-form-carousel__pagination" aria-hidden="true">
          {[0, 1, 2, 3].map(page => (
            <span
              key={page}
              className={classNames('intro-carousel__dot', { 'is-active': page === carouselPage })}
            />
          ))}
        </div>
      </div>
    </form>
  )
}
