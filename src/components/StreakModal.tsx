type StreakModalProps = {
  isOpen: boolean
  onClose: () => void
}

export const StreakModal = ({ isOpen, onClose }: StreakModalProps) => {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="streak-title"
        onClick={event => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Milestone</p>
            <h2 id="streak-title">Congratulations — 1 week in a row!</h2>
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
        <p className="muted">
          You logged 7 days straight. Keep the streak going.
        </p>
        <div className="modal-actions">
          <button type="button" className="primary-button" onClick={onClose}>
            Nice!
          </button>
        </div>
      </div>
    </div>
  )
}
