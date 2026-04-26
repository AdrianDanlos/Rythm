import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
  type FormEvent,
} from 'react'
import classNames from 'classnames'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { PluginRegistry, TimepickerUI } from 'timepicker-ui'
import { WheelPlugin } from 'timepicker-ui/plugins/wheel'
import 'react-day-picker/dist/style.css'
import 'timepicker-ui/main.css'
import { getInitialLogCarouselPageFromSession, useScrollToLogDailyEventsOnMount } from '../hooks/useScrollToLogDailyEventsOnMount'
import { motionTransition } from '../lib/motion'
import {
  DEFAULT_LOG_SLEEP_HOURS,
  MAX_LOG_SLEEP_MINUTES,
} from '../lib/utils/sleepHours'
import { MAX_TAG_LENGTH, parseTags } from '../lib/utils/stringUtils'
import type { EventTagOption } from './EventTagSelector'
import { LogFormFirstEntryDonePage } from './logForm/LogFormFirstEntryDonePage'
import { LogFormJournalPage } from './logForm/LogFormJournalPage'
import { LogFormMoodPage } from './logForm/LogFormMoodPage'
import { LogFormSleepPage } from './logForm/LogFormSleepPage'
import { LogFormTagsPage } from './logForm/LogFormTagsPage'
import type { LogCarouselPage, LogFormSlideTransition } from './logForm/types'

PluginRegistry.register(WheelPlugin)

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
  firstEntrySaveSignal: number
  isFirstEntryFlow: boolean
  isFirstEntryTipActive: boolean
  onFirstEntryTipSignalConsumed: () => void
  onFirstEntryTipContinueToSummary: () => void
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
  firstEntrySaveSignal,
  isFirstEntryFlow,
  isFirstEntryTipActive,
  onFirstEntryTipSignalConsumed,
  onFirstEntryTipContinueToSummary,
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
  const slideTransition: LogFormSlideTransition = reduceMotion
    ? { duration: 0 }
    : motionTransition
  const entryDateKey = formatLocalDate(selectedDate)
  const [carouselState, setCarouselState] = useState<{
    entryDateKey: string
    page: LogCarouselPage
  }>(() => ({
    entryDateKey,
    page: getInitialLogCarouselPageFromSession(),
  }))
  const firstEntrySaveHandledRef = useRef(0)
  const carouselPage = carouselState.entryDateKey === entryDateKey
    ? carouselState.page
    : 0
  const totalCarouselPages = isFirstEntryFlow || isFirstEntryTipActive || carouselPage === 4
    ? 5
    : 4
  const setCarouselPage = useCallback((page: LogCarouselPage) => {
    setCarouselState({
      entryDateKey,
      page,
    })
  }, [entryDateKey])
  useEffect(() => {
    if (firstEntrySaveSignal <= firstEntrySaveHandledRef.current) return
    firstEntrySaveHandledRef.current = firstEntrySaveSignal
    startTransition(() => {
      setCarouselPage(4)
    })
    onFirstEntryTipSignalConsumed()
  }, [carouselPage, carouselState.entryDateKey, entryDateKey, firstEntrySaveSignal, onFirstEntryTipSignalConsumed, setCarouselPage])

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
          {carouselPage === 0 && (
            <motion.div
              key={0}
              className="log-form-carousel__slide log-form-carousel__slide--sleep"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={slideTransition}
            >
              <LogFormSleepPage
                isEntryToday={isEntryToday}
                selectedDate={selectedDate}
                todayDate={todayDate}
                highlightedDates={highlightedDates}
                incompleteHighlightedDates={incompleteHighlightedDates}
                onEntryDateChange={onEntryDateChange}
                formatLocalDate={formatLocalDate}
                calendarOpen={calendarOpen}
                setCalendarOpen={setCalendarOpen}
                calendarWrapRef={calendarWrapRef}
                sleepHourNumber={sleepHourNumber}
                sleepMinuteNumber={sleepMinuteNumber}
                sleepTimeInputRef={sleepTimeInputRef}
                sleepTimepickerRef={sleepTimepickerRef}
                onNext={() => setCarouselPage(1)}
                t={t}
              />
            </motion.div>
          )}
          {carouselPage === 1 && (
            <motion.div
              key={1}
              className="log-form-carousel__slide log-form-carousel__slide--reflection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={slideTransition}
            >
              <LogFormMoodPage
                mood={mood}
                moodColors={moodColors}
                onMoodChange={onMoodChange}
                saving={saving}
                onNext={() => setCarouselPage(2)}
                onSkip={submitWithSaveHandler}
                t={t}
              />
            </motion.div>
          )}
          {carouselPage === 2 && (
            <motion.div
              key={2}
              className="log-form-carousel__slide log-form-carousel__slide--reflection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={slideTransition}
            >
              <LogFormTagsPage
                tagInputValue={tagInputValue}
                setTagInputValue={setTagInputValue}
                atMaxTags={atMaxTags}
                maxTagsPerEntry={maxTagsPerEntry}
                visibleTagOptions={visibleTagOptions}
                usedTagSet={usedTagSet}
                toggleTagOption={toggleTagOption}
                tagColors={tagColors}
                tagInputRef={tagInputRef}
                showCreateTagSuggestion={showCreateTagSuggestion}
                addTag={addTag}
                hasAtLeastOneEvent={hasAtLeastOneEvent}
                saving={saving}
                onNext={() => setCarouselPage(3)}
                onSkip={submitWithSaveHandler}
                t={t}
              />
            </motion.div>
          )}
          {carouselPage === 3 && (
            <motion.div
              key={3}
              className="log-form-carousel__slide log-form-carousel__slide--reflection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={slideTransition}
            >
              <LogFormJournalPage
                note={note}
                setNoteEditorRef={setNoteEditorRef}
                onNoteInput={handleNoteInput}
                saving={saving}
                saved={saved}
                onSave={submitWithSaveHandler}
                onSkip={submitWithSaveHandler}
                t={t}
              />
            </motion.div>
          )}
          {carouselPage === 4 && (
            <motion.div
              key={4}
              className="log-form-carousel__slide log-form-carousel__slide--reflection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={slideTransition}
            >
              <LogFormFirstEntryDonePage
                t={t}
                onContinue={onFirstEntryTipContinueToSummary}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="intro-carousel__pagination log-form-carousel__pagination" aria-hidden="true">
          {Array.from(
            { length: totalCarouselPages },
            (_, page) => page,
          ).map(page => (
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
