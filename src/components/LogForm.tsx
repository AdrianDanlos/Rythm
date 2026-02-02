import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { parseTags } from '../lib/utils/stringUtils'

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
  const [isTagInputFocused, setIsTagInputFocused] = useState(false)
  const usedTags = parseTags(tags)
  const usedTagSet = new Set(usedTags)
  const sortedTagSuggestions = [...tagSuggestions].sort((a, b) =>
    a.localeCompare(b),
  )
  const lastCommaIndex = tags.lastIndexOf(',')
  const rawToken = lastCommaIndex === -1 ? tags : tags.slice(lastCommaIndex + 1)
  const token = rawToken.trim()
  const tokenLower = token.toLowerCase()
  const matchingSuggestions = tokenLower.length
    ? sortedTagSuggestions.filter(tag =>
        tag.startsWith(tokenLower) && !usedTagSet.has(tag),
      )
    : isTagInputFocused
      ? sortedTagSuggestions.filter(tag => !usedTagSet.has(tag))
      : []

  const handleSuggestionSelect = (suggestion: string) => {
    const prefix = lastCommaIndex === -1 ? '' : tags.slice(0, lastCommaIndex + 1)
    const spacer = rawToken.startsWith(' ') ? ' ' : ''
    const baseValue = `${prefix}${spacer}${suggestion}`
    const nextTagList = parseTags(baseValue)
    const shouldAppendComma = nextTagList.length < maxTagsPerEntry
      && !baseValue.trim().endsWith(',')
    const nextValue = shouldAppendComma ? `${baseValue}, ` : baseValue
    onTagsChange(nextValue)
  }

  return (
    <section className="card">
      <form onSubmit={onSave} className="stack">
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
                title={`Mood: ${value}`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <label
          className="field"
          onClick={() => {
            if (!isPro) {
              onOpenPaywall()
            }
          }}
        >
          <div className="field-title">
            <span>Tags (Pro)</span>
            <span className="field-hint">
              {isPro
                ? 'Separate tags with commas.'
                : 'Upgrade to Pro to add tags.'}
            </span>
          </div>
          <div className="tag-input">
            <input
              type="text"
              value={tags}
              onChange={event => onTagsChange(event.target.value)}
              placeholder="Suggested: exercise, late screens, caffeine, insomnia..."
              disabled={!isPro}
              onFocus={() => setIsTagInputFocused(true)}
              onBlur={() => setIsTagInputFocused(false)}
            />
            {isPro && matchingSuggestions.length > 0
              ? (
                  <div className="tag-suggestions" role="listbox">
                    {matchingSuggestions.map(suggestion => (
                      <button
                        key={suggestion}
                        type="button"
                        className="tag-suggestion"
                        onMouseDown={event => event.preventDefault()}
                        onClick={() => handleSuggestionSelect(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )
              : null}
          </div>
        </label>
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
