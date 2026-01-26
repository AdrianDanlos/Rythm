type PaywallModalProps = {
  isOpen: boolean
  onClose: () => void
  upgradeUrl?: string
}

const premiumFeatures = [
  'Export Full Report',
  'Weekly and Monthly rolling trends',
  '30/90/365 day history',
  'Your Personal Sleep Threshold',
  'Tag insights',
]

export const PaywallModal = ({
  isOpen,
  onClose,
  upgradeUrl,
}: PaywallModalProps) => {
  if (!isOpen) return null

  const canUpgrade = Boolean(upgradeUrl && upgradeUrl.trim())

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
        onClick={event => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Premium</p>
            <h2 id="paywall-title">Unlock Pro features</h2>
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
          Upgrade to access deeper insights.
        </p>
        <ul className="paywall-list">
          {premiumFeatures.map(feature => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        <div className="modal-actions">
          {canUpgrade
            ? (
                <a
                  className="primary-button"
                  href={upgradeUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Upgrade now
                </a>
              )
            : (
                <button type="button" className="primary-button" disabled>
                  Upgrade now
                </button>
              )}
          <button type="button" className="ghost" onClick={onClose}>
            Not now
          </button>
        </div>
        {!canUpgrade
          ? (
              <p className="helper">
                Set
                {' '}
                <code>VITE_UPGRADE_URL</code>
                {' '}
                to enable the upgrade link.
              </p>
            )
          : null}
      </div>
    </div>
  )
}
