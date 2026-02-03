import { useState } from 'react'

type PaywallModalProps = {
  isOpen: boolean
  onClose: () => void
  upgradeUrl?: string
  onUpgrade?: () => Promise<boolean> | boolean
  priceLabel?: string
}

const premiumFeatures = [
  'Tag insights',
  'Personalized sleep target based on your history',
  'Weekly and Monthly trends',
  '30/90/365 day history',
  'Export Rythm Report',
]

export const PaywallModal = ({
  isOpen,
  onClose,
  upgradeUrl,
  onUpgrade,
  priceLabel,
}: PaywallModalProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const canUpgrade = Boolean(onUpgrade || (upgradeUrl && upgradeUrl.trim()))

  if (!isOpen) return null

  const handleUpgrade = async () => {
    if (!canUpgrade || isLoading) return
    if (!onUpgrade) {
      window.open(upgradeUrl, '_blank', 'noreferrer')
      return
    }
    setIsLoading(true)
    try {
      const didStartCheckout = await onUpgrade()
      if (didStartCheckout) {
        return
      }
      setIsLoading(false)
    }
    catch {
      setIsLoading(false)
    }
  }

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
        {priceLabel
          ? <p className="paywall-price">{priceLabel}</p>
          : null}
        <p className="muted">
          Upgrade to access deeper insights.
        </p>
        <ul className="paywall-list">
          {premiumFeatures.map(feature => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        <div className="modal-actions">
          <button
            type="button"
            className="primary-button cta-button"
            disabled={!canUpgrade || isLoading}
            onClick={handleUpgrade}
          >
            {isLoading ? 'Opening checkout...' : 'Upgrade now'}
          </button>
          <button type="button" className="ghost" onClick={onClose}>
            Not now
          </button>
        </div>
        {!canUpgrade
          ? (
              <p className="helper">
                Set <code>VITE_UPGRADE_URL</code> to enable the upgrade link.
              </p>
            )
          : null}
      </div>
    </div>
  )
}
