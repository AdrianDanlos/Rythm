import { useEffect, useRef, useState, type ComponentType, type CSSProperties, type FormEvent, type ChangeEvent } from 'react'
import { DayPicker } from 'react-day-picker'
import { useTranslation } from 'react-i18next'
import { Angry, Frown, Laugh, Meh, Moon, Smile } from 'lucide-react'
import 'react-day-picker/dist/style.css'
import { MAX_TAG_LENGTH, parseTags } from '../lib/utils/stringUtils'
import { Tooltip } from './Tooltip'

const MOOD_ICONS: Record<1 | 2 | 3 | 4 | 5, ComponentType<{ 'className'?: string, 'size'?: number, 'aria-hidden'?: boolean }>> = {
  1: Angry,
  2: Frown,
  3: Meh,
  4: Smile,
  5: Laugh,
}

const QUICK_SLEEP_HOUR_OPTIONS = [4, 5, 6, 7, 8, 9, 10]
const MAX_SLEEP_MINUTES = 12 * 60

const getReadableTextColor = (bg: string | undefined): string | undefined => {
  if (!bg || !bg.startsWith('#')) return undefined
  const hex = bg.slice(1)
  if (hex.length !== 6) return undefined
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return undefined
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 140 ? '#000000' : '#ffffff'
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
  entriesError: string | null
  moodColors: string[]
  isMobile?: boolean
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
  entriesError,
  moodColors,
  isMobile = false,
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
  const parsedSleepHours = Number(sleepHours)
  const hasSleepValue = sleepHours.trim().length > 0 && Number.isFinite(parsedSleepHours)
  const totalSleepMinutes = hasSleepValue ? Math.round(parsedSleepHours * 60) : 8 * 60
  const sleepHourNumber = Math.floor(totalSleepMinutes / 60)
  const sleepMinuteNumber = totalSleepMinutes % 60
  const noteTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const tagDropdownWrapRef = useRef<HTMLDivElement | null>(null)
  const tagInputRef = useRef<HTMLInputElement | null>(null)
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const [tagInputValue, setTagInputValue] = useState('')
  const [tagPlaceholderOverride, setTagPlaceholderOverride] = useState<string | null>(null)

  const usedTags = parseTags(tags)
  const usedTagSet = new Set(usedTags)
  const sortedTagSuggestions = [...tagSuggestions].sort((a, b) =>
    a.localeCompare(b),
  )
  const suggestionsWithinLength = sortedTagSuggestions.filter(
    tag => tag.length <= MAX_TAG_LENGTH,
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

  const updateSleepFromMinutes = (nextMinutes: number) => {
    const clampedMinutes = Math.max(0, Math.min(MAX_SLEEP_MINUTES, nextMinutes))
    const nextValue = clampedMinutes / 60
    const formatted = nextValue.toFixed(2).replace(/\.?0+$/, '')
    onSleepHoursChange(formatted)
  }

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
    textarea.style.height = '0px'
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  useEffect(() => {
    autoResizeNote()
  }, [note])

  const handleNoteChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onNoteChange(event.target.value.slice(0, 300))
  }

  return (
    <section className="card">
      <form onSubmit={onSave} className="stack log-form-stack">
        <div className="field">
          <div id="log-calendar" className="date-picker">
            <DayPicker
              mode="single"
              weekStartsOn={1}
              selected={selectedDate}
              onSelect={(date: Date | undefined) => {
                if (!date) return
                onEntryDateChange(formatLocalDate(date))
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
        </div>
        <div className="field">
          <div className="sleep-duration-picker">
            <div className="sleep-duration-picker__hero" aria-hidden="true">
              <Moon size={20} />
            </div>
            <div className="sleep-duration-picker__title-row">
              <p className="sleep-duration-picker__title">{t('log.sleepQuestion')}</p>
              <Tooltip label={t('log.sleepTooltip')}>
                <span className="tooltip-trigger">
                  <span className="tooltip-icon" aria-hidden="true">i</span>
                </span>
              </Tooltip>
            </div>
            <p className="sleep-duration-picker__subtitle">
              {t('log.sleepSubtitle', { defaultValue: 'Track your rest' })}
            </p>
            <div className="sleep-duration-picker__value" role="status" aria-live="polite">
              <span className="sleep-duration-picker__value-main">{sleepHourNumber}</span>
              <span className="sleep-duration-picker__value-unit">{t('log.hours').charAt(0).toLowerCase()}</span>
              <span className="sleep-duration-picker__value-main">{String(sleepMinuteNumber).padStart(2, '0')}</span>
              <span className="sleep-duration-picker__value-unit">{t('log.minutes').charAt(0).toLowerCase()}</span>
            </div>
            <div className="sleep-duration-picker__section">
              <p className="sleep-duration-picker__section-label">
                {t('log.quickSelect', { defaultValue: 'Quick select' })}
              </p>
              <div className="sleep-duration-picker__quick-grid">
                {QUICK_SLEEP_HOUR_OPTIONS.map(hours => (
                  <button
                    key={hours}
                    type="button"
                    className={`sleep-duration-picker__quick-option${sleepHourNumber === hours && sleepMinuteNumber === 0 ? ' is-active' : ''}`}
                    onClick={() => updateSleepFromMinutes(hours * 60)}
                  >
                    {hours}
                  </button>
                ))}
              </div>
            </div>
            <div className="sleep-duration-picker__section">
              <p className="sleep-duration-picker__section-label">
                {t('log.fineTune', { defaultValue: 'Fine-tune' })}
              </p>
              <div className="sleep-duration-picker__fine-tune-grid">
                <div className="sleep-duration-picker__fine-tune-block">
                  <span className="sleep-duration-picker__fine-tune-label">{t('log.hours')}</span>
                  <div className="sleep-duration-picker__stepper">
                    <button
                      type="button"
                      className="sleep-duration-picker__stepper-button"
                      onClick={() => updateSleepFromMinutes(totalSleepMinutes - 60)}
                      aria-label={t('log.decreaseHours', { defaultValue: 'Decrease hours slept' })}
                    >
                      -
                    </button>
                    <button
                      type="button"
                      className="sleep-duration-picker__stepper-button"
                      onClick={() => updateSleepFromMinutes(totalSleepMinutes + 60)}
                      aria-label={t('log.increaseHours', { defaultValue: 'Increase hours slept' })}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="sleep-duration-picker__fine-tune-block">
                  <span className="sleep-duration-picker__fine-tune-label">
                    {t('log.minutesStep', { defaultValue: 'Minutes (+15)' })}
                  </span>
                  <div className="sleep-duration-picker__stepper">
                    <button
                      type="button"
                      className="sleep-duration-picker__stepper-button"
                      onClick={() => updateSleepFromMinutes(totalSleepMinutes - 15)}
                      aria-label={t('log.decreaseMinutes', { defaultValue: 'Decrease minutes slept' })}
                    >
                      -
                    </button>
                    <button
                      type="button"
                      className="sleep-duration-picker__stepper-button"
                      onClick={() => updateSleepFromMinutes(totalSleepMinutes + 15)}
                      aria-label={t('log.increaseMinutes', { defaultValue: 'Increase minutes slept' })}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {!hasSleepValue
              ? (
                  <button
                    type="button"
                    className="sleep-duration-picker__use-default"
                    onClick={() => updateSleepFromMinutes(totalSleepMinutes)}
                  >
                    {t('log.useDefaultSleep', { defaultValue: 'Use 8h 00m' })}
                  </button>
                )
              : null}
          </div>
        </div>
        <div className="field field--tags">
          <div className="field-title">
            <span className="label--with-tooltip">
              {t('log.eventsQuestion')}
              <Tooltip label={t('log.eventsTooltip')}>
                <span className="tooltip-trigger">
                  <span className="tooltip-icon" aria-hidden="true">i</span>
                </span>
              </Tooltip>
            </span>
            <span className="field-hint-pill field-hint-pill--plain" aria-label={t('log.recommended')}>{t('log.recommended')}</span>
          </div>
          <div className="tag-control-row">
            <div className="tag-dropdown-wrap" ref={tagDropdownWrapRef}>
              <input
                ref={tagInputRef}
                type="text"
                className="tag-dropdown-trigger"
                aria-haspopup="listbox"
                aria-expanded={tagDropdownOpen}
                aria-label={t('log.addEventsAria')}
                placeholder={
                  atMaxTags
                    ? t('log.maxReached', { count: maxTagsPerEntry })
                    : tagPlaceholderOverride ?? t('log.eventsPlaceholder')
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
              {tagDropdownOpen && (dropdownOptions.length > 0 || !isMobile) && (
                <div className="tag-suggestions" role="listbox">
                  {dropdownOptions.length > 0
                    ? dropdownOptions.map((suggestion) => {
                        const isAdded = usedTagSet.has(suggestion.toLowerCase())
                        return (
                          <button
                            key={suggestion}
                            type="button"
                            className={`tag-suggestion${isAdded ? ' tag-suggestion--added' : ''}`}
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
                                  suggestion
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
                className="tag-add-button"
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
                const textColor = getReadableTextColor(tagColor)
                return (
                  <span
                    key={tag}
                    className="tag-pill"
                    data-color-index={index}
                    style={tagColor ? { backgroundColor: tagColor, color: textColor } : undefined}
                  >
                    {tag}
                    <button
                      type="button"
                      className="tag-badge-remove"
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
        <div className="field field-mood">
          {t('log.moodQuestion')}
          <div className="mood-row">
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
                  aria-label={String(value)}
                >
                  <Icon className="mood-button-icon" size={28} aria-hidden />
                </button>
              )
            })}
          </div>
        </div>
        <label className="field">
          {t('log.journalOptional')}
          <textarea
            ref={noteTextareaRef}
            value={note}
            onChange={handleNoteChange}
            onInput={autoResizeNote}
            placeholder={t('log.journalPlaceholder')}
            maxLength={300}
            rows={1}
          />
        </label>
        {entriesError ? <p className="error">{entriesError}</p> : null}
        <button type="submit" disabled={saving} className="save-button">
          {saving
            ? <span className="spinner" aria-label={t('log.saving')} />
            : saved
              ? t('log.saved')
              : t('log.save')}
        </button>
      </form>
    </section>
  )
}
