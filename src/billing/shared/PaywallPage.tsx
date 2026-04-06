import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  X,
  Crown,
  Sun,
  Moon,
  LineChart,
  TrendingUp,
  Calendar,
  FileDown,
  Check,
  Shield,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  getPlayFreeTrialDays,
  getPlayPlansForPicker,
  hasPlayYearlyBasePlan,
  isAndroidPlayBilling,
  type PlayPlanPickerKey,
} from '../play/config'

type PaywallPageProps = {
  onClose: () => void
  upgradeUrl?: string
  onUpgrade?: (basePlanId?: string) => Promise<boolean> | boolean
  onRestore?: () => Promise<boolean>
  showRestore?: boolean
}

const premiumFeatures: { key: string, Icon: LucideIcon }[] = [
  { key: 'dailyImpact', Icon: Sun },
  { key: 'sleepTarget', Icon: Moon },
  { key: 'sleepMoodChart', Icon: LineChart },
  { key: 'weeklyMonthlyTrends', Icon: TrendingUp },
  { key: 'historyRanges', Icon: Calendar },
  { key: 'exportReports', Icon: FileDown },
]

function splitPriceLabel(label: string): { amount: string, periodPart: string } {
  const t = label.trim()
  const idx = t.indexOf('/')
  if (idx >= 0) {
    return {
      amount: t.slice(0, idx).trim(),
      periodPart: t.slice(idx).trim(),
    }
  }
  return { amount: t, periodPart: '' }
}

export const PaywallPage = ({
  onClose,
  upgradeUrl,
  onUpgrade,
  onRestore,
  showRestore,
}: PaywallPageProps) => {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [selectedPlayPlanKey, setSelectedPlayPlanKey] = useState<PlayPlanPickerKey>('monthly')
  const canUpgrade = Boolean(onUpgrade || (upgradeUrl && upgradeUrl.trim()))
  const androidPicker = isAndroidPlayBilling() && hasPlayYearlyBasePlan()
  const priceLabelKey = androidPicker
    ? (selectedPlayPlanKey === 'yearly' ? 'paywall.proPriceLabelYearly' : 'paywall.proPriceLabelMonthly')
    : isAndroidPlayBilling()
      ? 'paywall.proPriceLabelMonthly'
      : 'paywall.proPriceLabel'
  const { amount, periodPart } = splitPriceLabel(t(priceLabelKey))
  const trialDays = getPlayFreeTrialDays()
  const showTrialOffer = isAndroidPlayBilling() && trialDays > 0
  const fullPriceLabel = [amount, periodPart].filter(Boolean).join(' ')

  const handleUpgrade = async () => {
    if (!canUpgrade || isLoading) return
    if (!onUpgrade) {
      window.open(upgradeUrl, '_blank', 'noreferrer')
      return
    }
    setIsLoading(true)
    try {
      const playPlans = getPlayPlansForPicker()
      const selectedPlan = playPlans.find(p => p.key === selectedPlayPlanKey) ?? playPlans[0]
      const basePlanIdForPurchase = isAndroidPlayBilling() ? selectedPlan.basePlanId : undefined
      const didStartCheckout = await onUpgrade(basePlanIdForPurchase)
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
      <section className="paywall-page__hero" aria-labelledby="paywall-title">
        <button
          type="button"
          className="paywall-page__close"
          onClick={onClose}
          aria-label={t('common.close')}
        >
          <X className="paywall-page__close-icon" strokeWidth={2.5} aria-hidden="true" />
        </button>
        <div className="paywall-page__crown-ring" aria-hidden="true">
          <Crown className="paywall-page__crown-icon" strokeWidth={1.75} />
        </div>
        <h1 className="paywall-page__brand" id="paywall-title">
          {t('paywall.unlockPro')}
        </h1>
        <p className="paywall-page__tagline">{t('paywall.upgradeToAccess')}</p>
      </section>

      <div className="paywall-page__panel">
        <div className="paywall-page__panel-inner">
          {amount
            ? (
                androidPicker
                  ? (
                      <div className="paywall-page__price-block paywall-page__price-block--plans">
                        {showTrialOffer
                          ? (
                              <p className="paywall-page__trial-pill">
                                {t('paywall.trialPill', { days: trialDays })}
                              </p>
                            )
                          : null}
                        <fieldset className="paywall-page__plans">
                          <legend className="paywall-page__plans-legend">{t('paywall.choosePlan')}</legend>
                          {getPlayPlansForPicker().map((plan) => {
                            const label = t(
                              plan.key === 'yearly' ? 'paywall.proPriceLabelYearly' : 'paywall.proPriceLabelMonthly',
                            )
                            const { amount: planAmount, periodPart: planPeriod } = splitPriceLabel(label)
                            return (
                              <label
                                key={plan.key}
                                className={
                                  selectedPlayPlanKey === plan.key
                                    ? 'paywall-page__plan-option paywall-page__plan-option--selected'
                                    : 'paywall-page__plan-option'
                                }
                              >
                                <input
                                  type="radio"
                                  className="paywall-page__plan-radio"
                                  name="play-subscription-plan"
                                  value={plan.key}
                                  checked={selectedPlayPlanKey === plan.key}
                                  onChange={() => setSelectedPlayPlanKey(plan.key)}
                                />
                                <span className="paywall-page__plan-option-body">
                                  <span className="paywall-page__plan-option-title">
                                    {plan.key === 'yearly' ? t('paywall.planYearly') : t('paywall.planMonthly')}
                                  </span>
                                  <span className="paywall-page__plan-option-price">
                                    {planAmount}
                                    {planPeriod
                                      ? <span className="paywall-page__plan-option-period"> {planPeriod}</span>
                                      : null}
                                  </span>
                                </span>
                              </label>
                            )
                          })}
                        </fieldset>
                        <p className="paywall-page__price-note paywall-page__price-note--below-plans">
                          {showTrialOffer
                            ? t('paywall.trialFootnote', { price: fullPriceLabel })
                            : t('paywall.cancelAnytime')}
                        </p>
                      </div>
                    )
                  : (
                      <div className="paywall-page__price-block">
                        {showTrialOffer
                          ? (
                              <p className="paywall-page__trial-pill">
                                {t('paywall.trialPill', { days: trialDays })}
                              </p>
                            )
                          : null}
                        <p className="paywall-page__price-row">
                          <span className="paywall-page__price-amount">{amount}</span>
                          {periodPart
                            ? <span className="paywall-page__price-period"> {periodPart}</span>
                            : null}
                        </p>
                        <p className="paywall-page__price-note">
                          {showTrialOffer
                            ? t('paywall.trialFootnote', { price: fullPriceLabel })
                            : t('paywall.cancelAnytime')}
                        </p>
                      </div>
                    )
              )
            : null}

          <div className="paywall-page__divider" role="presentation" />

          <p className="paywall-page__features-eyebrow">{t('paywall.premiumFeaturesSection')}</p>

          <ul className="paywall-page__features" aria-label={t('paywall.premiumFeaturesSection')}>
            {premiumFeatures.map(({ key, Icon }) => (
              <li key={key} className="paywall-feature">
                <div className="paywall-feature__icon-wrap" aria-hidden="true">
                  <Icon className="paywall-feature__icon" strokeWidth={2} />
                </div>
                <p className="paywall-feature__text">{t(`paywall.features.${key}`)}</p>
                <span className="paywall-feature__check" aria-hidden="true">
                  <Check className="paywall-feature__check-mark" strokeWidth={3} />
                </span>
              </li>
            ))}
          </ul>

          <div className="paywall-page__actions">
            <button
              type="button"
              className="paywall-page__cta"
              disabled={!canUpgrade || isLoading}
              onClick={handleUpgrade}
            >
              {isLoading
                ? t('paywall.openingCheckout')
                : showTrialOffer
                  ? t('paywall.startFreeTrial')
                  : t('paywall.upgradeNow')}
            </button>
            {showRestore && onRestore
              ? (
                  <button
                    type="button"
                    className="paywall-page__restore"
                    disabled={isRestoring}
                    onClick={handleRestore}
                  >
                    {isRestoring ? t('paywall.restoring') : t('paywall.restorePurchases')}
                  </button>
                )
              : null}
          </div>

          <p className="paywall-page__trust">
            <Shield className="paywall-page__trust-icon" strokeWidth={2} aria-hidden="true" />
            <span>{t('paywall.secureFooter')}</span>
          </p>

          {!canUpgrade
            ? (
                <p className="paywall-page__helper">
                  {t('paywall.configureUpgradeUrl')}
                </p>
              )
            : null}
        </div>
      </div>
    </div>
  )
}
