import { useEffect, useRef, useState, type FormEvent } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

export type LogFormProps = {
  selectedDate: Date
  todayDate: Date
  highlightedDates: Date[]
  sleepHours: string
  mood: number | null
  note: string
  saving: boolean
  saved?: boolean
  entriesError: string | null
  moodColors: string[]
  formatLocalDate: (date: Date) => string
  onEntryDateChange: (value: string) => void
  onSleepHoursChange: (value: string) => void
  onMoodChange: (value: number) => void
  onNoteChange: (value: string) => void
  onSave: (event: FormEvent<HTMLFormElement>) => void
}

export const LogForm = ({
  selectedDate,
  todayDate,
  highlightedDates,
  sleepHours,
  mood,
  note,
  saving,
  entriesError,
  moodColors,
  formatLocalDate,
  onEntryDateChange,
  onSleepHoursChange,
  onMoodChange,
  onNoteChange,
  onSave,
}: LogFormProps) => {
  const [saved, setSaved] = useState(false)
  const wasSavingRef = useRef(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (entriesError) {
      setSaved(false)
    }

    if (wasSavingRef.current && !saving && !entriesError) {
      setSaved(true)
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
      timerRef.current = window.setTimeout(() => setSaved(false), 2000)
    }

    wasSavingRef.current = saving

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [saving, entriesError])

  return (
    <section className="card">
      <h2>Log today</h2>
      <form onSubmit={onSave} className="stack">
        <div className="field">
          Date
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
            type="number"
            min={0}
            max={12}
            step={0.1}
            value={sleepHours}
            onChange={(event) => onSleepHoursChange(event.target.value)}
            placeholder="0-12"
            required
          />
        </label>
        <div className="field">
          Mood
          <div className="mood-row">
            {[1, 2, 3, 4, 5].map((value) => (
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
            onChange={(event) => onNoteChange(event.target.value)}
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
