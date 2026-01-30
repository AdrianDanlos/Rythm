type WelcomeModalProps = {
  isOpen: boolean
  onClose: () => void
}

export const WelcomeModal = ({ isOpen, onClose }: WelcomeModalProps) => {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card modal-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        onClick={event => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Getting started</p>
            <h2 id="welcome-title">Welcome to Rythm</h2>
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
          Start by logging your sleep hours, mood, and tags. Your insights will show up right away.
        </p>
        <div className="modal-actions">
          <button type="button" className="primary-button" onClick={onClose}>
            Get started
          </button>
        </div>
      </div>
    </div>
  )
}
