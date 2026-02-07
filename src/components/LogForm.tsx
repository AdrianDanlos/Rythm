import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { parseTags } from '../lib/utils/stringUtils'
import { Tooltip } from './Tooltip'

export type LogFormProps = {
  selectedDate: Date
  todayDate: Date
  highlightedDates: Date[]
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
  isPro: boolean
  isMobile?: boolean
  formatLocalDate: (date: Date) => string
  onEntryDateChange: (value: string) => void
  onSleepHoursChange: (value: string) => void
  onMoodChange: (value: number) => void
  onNoteChange: (value: string) => void
  onTagsChange: (value: string) => void
  onSave: (event: FormEvent<HTMLFormElement>) => void
  onOpenPaywall: () => void
}

export const LogForm = ({
  selectedDate,
  todayDate,
  highlightedDates,
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
  isPro,
  isMobile = false,
  formatLocalDate,
  onEntryDateChange,
  onSleepHoursChange,
  onMoodChange,
  onNoteChange,
  onTagsChange,
  onSave,
  onOpenPaywall,
}: LogFormProps) => {
  const sleepHourOptions = Array.from({ length: 13 }, (_, index) => index)
  const sleepMinuteOptions = [0, 15, 30, 45]
  const parsedSleepHours = Number(sleepHours)
  const hasSleepValue = sleepHours.trim().length > 0 && Number.isFinite(parsedSleepHours)
  const totalSleepMinutes = hasSleepValue ? Math.round(parsedSleepHours * 60) : 0
  const sleepHourValue = hasSleepValue ? String(Math.floor(totalSleepMinutes / 60)) : ''
  const sleepMinuteValue = hasSleepValue ? String(totalSleepMinutes % 60) : ''
  const sleepMenuRef = useRef<HTMLDivElement | null>(null)
  const [sleepMenu, setSleepMenu] = useState<'hours' | 'minutes' | null>(null)

  const updateSleepHours = (hourValue: string, minuteValue: string) => {
    if (!hourValue) {
      onSleepHoursChange('')
      return
    }
    const minutes = minuteValue ? Number(minuteValue) : 0
    const nextValue = Number(hourValue) + minutes / 60
    const formatted = nextValue.toFixed(2).replace(/\.?0+$/, '')
    onSleepHoursChange(formatted)
  }

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!sleepMenuRef.current) return
      if (event.target instanceof Node && sleepMenuRef.current.contains(event.target)) {
        return
      }
      setSleepMenu(null)
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])
  const tagAreaRef = useRef<HTMLDivElement | null>(null)
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const [tagInputValue, setTagInputValue] = useState('')

  const usedTags = parseTags(tags)
  const usedTagSet = new Set(usedTags)
  const sortedTagSuggestions = [...tagSuggestions].sort((a, b) =>
    a.localeCompare(b),
  )
  const availableSuggestions = sortedTagSuggestions.filter(
    tag => !usedTagSet.has(tag),
  )
  const token = tagInputValue.trim().toLowerCase()
  const matchingSuggestions = token
    ? availableSuggestions.filter(s => s.startsWith(token))
    : availableSuggestions
  const atMaxTags = usedTags.length >= maxTagsPerEntry

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!tagAreaRef.current) return
      if (event.target instanceof Node && tagAreaRef.current.contains(event.target)) {
        return
      }
      setTagDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const addTag = (tag: string) => {
    const normalized = tag.trim().toLowerCase()
    if (!normalized || usedTagSet.has(normalized) || atMaxTags) return
    const nextList = [...usedTags, normalized]
    onTagsChange(nextList.join(', '))
    setTagInputValue('')
    setTagDropdownOpen(false)
  }

  const removeTag = (tag: string) => {
    const nextList = usedTags.filter(t => t !== tag)
    onTagsChange(nextList.join(', '))
  }

  const submitTagInput = () => {
    if (!tagInputValue.trim() || atMaxTags) return
    addTag(tagInputValue)
  }

  return (
    <section className="card">
      <form onSubmit={onSave} className="stack log-form-stack">
        <div className="field">
          <div className="date-picker">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(date: Date | undefined) => {
                if (!date) return
                onEntryDateChange(formatLocalDate(date))
              }}
              disabled={{ after: todayDate }}
              modifiers={{ logged: highlightedDates }}
              modifiersClassNames={{ logged: 'rdp-day-logged' }}
            />
          </div>
        </div>
        <label className="field">
          Sleep hours
          <div className="sleep-hours-row" ref={sleepMenuRef}>
            <div className="sleep-select">
              <button
                type="button"
                className="sleep-select-button"
                aria-haspopup="listbox"
                aria-expanded={sleepMenu === 'hours'}
                onClick={() => setSleepMenu(sleepMenu === 'hours' ? null : 'hours')}
              >
                {sleepHourValue ? `${sleepHourValue}h` : 'Hours'}
              </button>
              {sleepMenu === 'hours'
                ? (
                    <div className="tag-suggestions sleep-select-menu" role="listbox">
                      {sleepHourOptions.map(value => (
                        <button
                          key={value}
                          type="button"
                          className="tag-suggestion"
                          onMouseDown={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            updateSleepHours(String(value), sleepMinuteValue)
                            setSleepMenu('minutes')
                          }}
                        >
                          {value}h
                        </button>
                      ))}
                    </div>
                  )
                : null}
            </div>
            <div className="sleep-select">
              <button
                type="button"
                className="sleep-select-button"
                aria-haspopup="listbox"
                aria-expanded={sleepMenu === 'minutes'}
                onClick={() => setSleepMenu(sleepMenu === 'minutes' ? null : 'minutes')}
                disabled={!sleepHourValue}
              >
                {sleepMinuteValue ? `${String(sleepMinuteValue).padStart(2, '0')}m` : 'Minutes'}
              </button>
              {sleepMenu === 'minutes' && sleepHourValue
                ? (
                    <div className="tag-suggestions sleep-select-menu" role="listbox">
                      {sleepMinuteOptions.map(value => (
                        <button
                          key={value}
                          type="button"
                          className="tag-suggestion"
                          onMouseDown={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            updateSleepHours(sleepHourValue, String(value))
                            setSleepMenu(null)
                          }}
                        >
                          {String(value).padStart(2, '0')}m
                        </button>
                      ))}
                    </div>
                  )
                : null}
            </div>
          </div>
        </label>
        <div className="field">
          Mood today
          <div className="mood-row">
            {([1, 2, 3, 4, 5] as const).map(value => (
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
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <div
          className="field"
          ref={tagAreaRef}
          onClick={() => {
            if (!isPro) {
              onOpenPaywall()
            }
          }}
        >
          <div className="field-title">
            <span>
              {isPro ? 'Tags' : 'Tags (Pro)'}
              {isPro && (
                <Tooltip label="We suggest to add tags in the evening, as they help identify today's mood and tonight's sleep.">
                  <span className="tooltip-trigger" style={{ marginLeft: '0.25em' }}>
                    <span className="tooltip-icon" aria-hidden="true">i</span>
                  </span>
                </Tooltip>
              )}
            </span>
            <span className="field-hint">
              {isPro
                ? `Up to ${maxTagsPerEntry} tags`
                : 'Upgrade to Pro to add tags'}
            </span>
          </div>
          <div
            className={`tag-control-row${!isPro ? ' tag-control-row--disabled' : ''}`}
            aria-disabled={!isPro}
          >
            <div className="tag-dropdown-wrap">
              <input
                type="text"
                className="tag-dropdown-trigger"
                aria-haspopup="listbox"
                aria-expanded={isPro ? tagDropdownOpen : false}
                aria-label="Type or select tags"
                placeholder="Type or select tags"
                value={tagInputValue}
                disabled={atMaxTags || !isPro}
                onChange={(e) => {
                  setTagInputValue(e.target.value)
                  setTagDropdownOpen(true)
                }}
                onFocus={() => setTagDropdownOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    submitTagInput()
                  }
                }}
              />
              {isPro && tagDropdownOpen && (matchingSuggestions.length > 0 || !isMobile) && (
                <div className="tag-suggestions" role="listbox">
                  {matchingSuggestions.length > 0
                    ? matchingSuggestions.map(suggestion => (
                        <button
                          key={suggestion}
                          type="button"
                          className="tag-suggestion"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => addTag(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))
                    : (
                        <span className="tag-suggestions-empty">
                          {token
                            ? 'Press Enter to add as new tag'
                            : 'No suggestions'}
                        </span>
                      )}
                </div>
              )}
            </div>
            <div className="tag-add-wrap">
              <button
                type="button"
                className="tag-add-button"
                disabled={atMaxTags || !isPro}
                onClick={submitTagInput}
              >
                + Add
              </button>
            </div>
          </div>
          <div className="tag-pills-row">
            {usedTags.map((tag, index) => (
              <span
                key={tag}
                className="tag-pill"
                data-color-index={index}
              >
                {tag}
                <button
                  type="button"
                  className="tag-badge-remove"
                  aria-label={`Remove ${tag}`}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => removeTag(tag)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        <label className="field">
          Note (optional)
          <input
            type="text"
            value={note}
            onChange={event => onNoteChange(event.target.value)}
            placeholder="Short reflection..."
            maxLength={140}
          />
        </label>
        {entriesError ? <p className="error">{entriesError}</p> : null}
        <button type="submit" disabled={saving} className="save-button">
          {saving ? <span className="spinner" aria-label="Saving" /> : saved ? 'Saved!' : 'Save entry'}
        </button>
      </form>
    </section>
  )
}
