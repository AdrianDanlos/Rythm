import type { FormEvent } from 'react'
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
  const usedTags = parseTags(tags)
  const usedTagSet = new Set(usedTags)
  const lastCommaIndex = tags.lastIndexOf(',')
  const rawToken = lastCommaIndex === -1 ? tags : tags.slice(lastCommaIndex + 1)
  const token = rawToken.trim()
  const tokenLower = token.toLowerCase()
  const matchingSuggestions = tokenLower.length
    ? tagSuggestions.filter(tag =>
        tag.startsWith(tokenLower) && !usedTagSet.has(tag),
      )
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
          <input
            type="text"
            value={sleepHours}
            onChange={event => onSleepHoursChange(event.target.value)}
            placeholder="e.g., 7 or 7:30"
            required
          />
        </label>
        <div className="field">
          Mood today
          <div className="mood-row">
            {[1, 2, 3, 4, 5].map(value => (
              <button
                key={value}
                type="button"
                className={`mood-button ${mood === value ? 'active' : ''}`}
                onClick={() => onMoodChange(value)}
                style={{ borderColor: moodColors[value - 1] }}
              >
                {value}
              </button>
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
        <label
          className="field"
          onClick={() => {
            if (!isPro) {
              onOpenPaywall()
            }
          }}
        >
          Tags (Pro)
          <div className="tag-input">
            <input
              type="text"
              value={tags}
              onChange={event => onTagsChange(event.target.value)}
              placeholder="e.g., exercise, late screens"
              disabled={!isPro}
            />
            {isPro && matchingSuggestions.length > 0
              ? (
                  <div className="tag-suggestions" role="listbox">
                    {matchingSuggestions.map(suggestion => (
                      <button
                        key={suggestion}
                        type="button"
                        className="tag-suggestion"
                        onClick={() => handleSuggestionSelect(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )
              : null}
          </div>
          <p className="helper">
            {isPro
              ? `Up to ${maxTagsPerEntry} tags per entry. Separate tags with commas.`
              : 'Upgrade to Pro to add tags.'}
          </p>
        </label>
        {entriesError ? <p className="error">{entriesError}</p> : null}
        <button type="submit" disabled={saving} className="save-button">
          {saving ? <span className="spinner" aria-label="Saving" /> : saved ? 'Saved!' : 'Save entry'}
        </button>
      </form>
    </section>
  )
}
