import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'

type PaywallPageProps = {
  onClose: () => void
  upgradeUrl?: string
  onUpgrade?: () => Promise<boolean> | boolean
  priceLabel?: string
  onRestore?: () => Promise<boolean>
  showRestore?: boolean
}

const premiumFeatures = [
  'dailyImpact',
  'sleepTarget',
  'sleepMoodChart',
  'weeklyMonthlyTrends',
  'historyRanges',
  'exportReports',
]

export const PaywallPage = ({
  onClose,
  upgradeUrl,
  onUpgrade,
  priceLabel,
  onRestore,
  showRestore,
}: PaywallPageProps) => {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const canUpgrade = Boolean(onUpgrade || (upgradeUrl && upgradeUrl.trim()))

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
    <div className="paywall-page">
      <header className="paywall-page__header">
        <button
          type="button"
          className="ghost icon-button paywall-page__back"
          onClick={onClose}
          aria-label={t('common.back')}
        >
          <ChevronLeft className="icon" aria-hidden="true" />
        </button>
        <div className="paywall-page__header-text">
          <p className="eyebrow">{t('paywall.premium')}</p>
          <h1 className="paywall-page__title" id="paywall-title">
            {t('paywall.unlockPro')}
          </h1>
        </div>
      </header>

      <div className="paywall-page__body">
        {priceLabel ? <p className="paywall-price">{priceLabel}</p> : null}
        <p className="muted">{t('paywall.upgradeToAccess')}</p>
        <ul className="paywall-list">
          {premiumFeatures.map(key => (
            <li key={key}>{t(`paywall.features.${key}`)}</li>
          ))}
        </ul>
        <div className="paywall-page__actions">
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
          <button
            type="button"
            className="primary-button cta-button paywall-page__cta"
            disabled={!canUpgrade || isLoading}
            onClick={handleUpgrade}
          >
            {isLoading ? t('paywall.openingCheckout') : t('paywall.upgradeNow')}
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
