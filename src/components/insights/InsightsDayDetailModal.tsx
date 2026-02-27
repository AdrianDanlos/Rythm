import type { Entry } from '../../lib/entries'
import { formatLongDate } from '../../lib/utils/dateFormatters'
import { formatSleepHours } from '../../lib/utils/sleepHours'

type InsightsDayDetailModalProps = {
  isOpen: boolean
  dateKey: string
  entry: Entry | null
  moodColors: string[]
  onClose: () => void
}

export const InsightsDayDetailModal = ({
  isOpen,
  dateKey,
  entry,
  moodColors,
  onClose,
}: InsightsDayDetailModalProps) => {
  if (!isOpen) return null

  const date = new Date(`${dateKey}T00:00:00`)
  const moodValue = entry?.mood === null || entry?.mood === undefined
    ? Number.NaN
    : Number(entry.mood)
  const moodIndex = Number.isFinite(moodValue) ? Math.min(4, Math.max(0, Math.round(moodValue) - 1)) : -1
  const moodColor = moodIndex >= 0 ? moodColors[moodIndex] ?? undefined : undefined

  const sleepValue = entry?.sleep_hours === null || entry?.sleep_hours === undefined
    ? Number.NaN
    : Number(entry.sleep_hours)

  const tags = entry?.tags?.filter(Boolean) ?? []
  const note = entry?.note?.trim() ?? ''

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card insights-day-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="insights-day-modal-title"
        onClick={event => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Daily details</p>
            <h2 id="insights-day-modal-title">{formatLongDate(date)}</h2>
          </div>
          <button
            type="button"
            className="ghost icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {entry
          ? (
              <div className="insights-day-modal__content">
                <div className="insights-day-modal__row">
                  <p className="label">Sleep</p>
                  <p className="value">
                    {Number.isFinite(sleepValue) ? formatSleepHours(sleepValue) : 'No sleep logged'}
                  </p>
                </div>

                <div className="insights-day-modal__row">
                  <p className="label">Mood</p>
                  <p className="value insights-day-modal__mood-value">
                    <span
                      className="insights-day-modal__mood-dot"
                      style={moodColor ? { backgroundColor: moodColor } : undefined}
                      aria-hidden="true"
                    />
                    {Number.isFinite(moodValue) ? `${Math.round(moodValue)} / 5` : 'No mood logged'}
                  </p>
                </div>

                <div className="insights-day-modal__row">
                  <p className="label">Daily events</p>
                  {tags.length
                    ? (
                        <div className="insights-day-modal__tags">
                          {tags.map((tag, index) => (
                            <span className="tag-pill" data-color-index={index % 8} key={tag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )
                    : <p className="muted">No daily events logged</p>}
                </div>

                <div className="insights-day-modal__row">
                  <p className="label">Journal</p>
                  {note ? <p>{note}</p> : <p className="muted">No journal entry for this day</p>}
                </div>
              </div>
            )
          : (
              <div className="insights-day-modal__content">
                <p className="muted">No entry for this day.</p>
              </div>
            )}
      </div>
    </div>
  )
}
