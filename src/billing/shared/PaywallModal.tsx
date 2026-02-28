import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type PaywallModalProps = {
  isOpen: boolean
  onClose: () => void
  upgradeUrl?: string
  onUpgrade?: () => Promise<boolean> | boolean
  priceLabel?: string
  onRestore?: () => Promise<boolean>
  showRestore?: boolean
}

const premiumFeatures = [
  'Discover how what happens during the day influences your mood and sleep',
  'Your recommended sleep target based on your history',
  'See how sleep and mood connect in one simple chart',
  'Weekly and monthly trends',
  '30/90/365 day history',
  'Export Rythm\'s custom PDF reports',
]

export const PaywallModal = ({
  isOpen,
  onClose,
  upgradeUrl,
  onUpgrade,
  priceLabel,
  onRestore,
  showRestore,
}: PaywallModalProps) => {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
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

  const handleRestore = async () => {
    if (!onRestore || isRestoring) return
    setIsRestoring(true)
    try {
      const restored = await onRestore()
      if (restored) {
        onClose()
      }
    }
    finally {
      setIsRestoring(false)
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
            <p className="eyebrow">{t('paywall.premium')}</p>
            <h2 id="paywall-title">{t('paywall.unlockPro')}</h2>
          </div>
          <button
            type="button"
            className="ghost icon-button"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>
        {priceLabel
          ? <p className="paywall-price">{priceLabel}</p>
          : null}
        <p className="muted">
          {t('paywall.upgradeToAccess')}
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
            {isLoading ? t('paywall.openingCheckout') : t('paywall.upgradeNow')}
          </button>
          {showRestore && onRestore
            ? (
                <button
                  type="button"
                  className="ghost"
                  disabled={isRestoring}
                  onClick={handleRestore}
                >
                  {isRestoring ? t('paywall.restoring') : t('paywall.restorePurchases')}
                </button>
              )
            : null}
          <button type="button" className="ghost" onClick={onClose}>
            {t('paywall.notNow')}
          </button>
        </div>
        {!canUpgrade
          ? (
              <p className="helper">
                {t('paywall.configureUpgradeUrl')}
              </p>
            )
          : null}
      </div>
    </div>
  )
}
