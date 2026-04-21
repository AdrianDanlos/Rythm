import { useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import { t } from 'i18next'
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases'
import { Browser } from '@capacitor/browser'
import { supabase } from '../../lib/supabaseClient'
import { BILLING } from '../play/config'

const PLAY_SUBSCRIPTIONS_URL = 'https://play.google.com/store/account/subscriptions'

type UseBillingActionsParams = {
  trimmedUpgradeUrl?: string
  isPortalLoading: boolean
  setIsPortalLoading: (value: boolean) => void
  subscriptionSource?: 'play'
  refreshSession?: () => Promise<unknown>
}

function isAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

export const useBillingActions = ({
  trimmedUpgradeUrl,
  isPortalLoading,
  setIsPortalLoading,
  subscriptionSource,
  refreshSession,
}: UseBillingActionsParams) => {
  const handleStartCheckout = useCallback(async (basePlanIdOverride?: string): Promise<boolean> => {
    if (isAndroid()) {
      try {
        const supported = await NativePurchases.isBillingSupported()
        if (!supported?.isBillingSupported) {
          window.alert(t('errors.iapNotAvailable'))
          return false
        }
        const { subscriptionId, basePlanId } = BILLING.play
        const planIdentifier = (basePlanIdOverride?.trim() || basePlanId)
        const transaction = await NativePurchases.purchaseProduct({
          productIdentifier: subscriptionId,
          planIdentifier,
          productType: PURCHASE_TYPE.SUBS,
          quantity: 1,
        })
        const purchaseToken = transaction?.purchaseToken ?? transaction?.transactionId
        if (!purchaseToken || typeof purchaseToken !== 'string') {
          return false
        }
        const { data, error } = await supabase.functions.invoke('play-verify-purchase', {
          body: {
            purchaseToken,
            subscriptionId,
          },
        })
        if (error) {
          throw error
        }
        if (data?.ok && refreshSession) {
          await refreshSession()
          return true
        }
        return false
      }
      catch (err) {
        const message = err instanceof Error ? err.message : t('errors.purchaseFailed')
        if (!message.toLowerCase().includes('cancel')) {
          window.alert(message)
        }
        return false
      }
    }

    if (trimmedUpgradeUrl) {
      window.open(trimmedUpgradeUrl, '_blank', 'noreferrer')
      return true
    }
    return false
  }, [trimmedUpgradeUrl, refreshSession])

  const handleRestorePurchases = useCallback(async (): Promise<boolean> => {
    if (!isAndroid() || !refreshSession) return false
    try {
      const { purchases } = await NativePurchases.getPurchases({
        productType: PURCHASE_TYPE.SUBS,
      })
      const { subscriptionId: defaultSubId } = BILLING.play
      for (const p of purchases ?? []) {
        const token = p?.purchaseToken ?? p?.transactionId
        if (typeof token !== 'string') continue
        const subId = p?.productIdentifier ?? defaultSubId
        const { data } = await supabase.functions.invoke('play-verify-purchase', {
          body: { purchaseToken: token, subscriptionId: subId },
        })
        if (data?.ok) {
          await refreshSession()
          return true
        }
      }
    }
    catch {
      // ignore
    }
    return false
  }, [refreshSession])

  const handleManageSubscription = useCallback(async () => {
    if (isPortalLoading) return
    setIsPortalLoading(true)
    try {
      if (isAndroid() && subscriptionSource === 'play') {
        await Browser.open({ url: PLAY_SUBSCRIPTIONS_URL })
        return
      }
      if (trimmedUpgradeUrl) {
        window.open(trimmedUpgradeUrl, '_blank', 'noreferrer')
        return
      }
      window.alert(t('errors.unableToOpenSubscriptionManagement'))
    }
    catch {
      window.alert(t('errors.unableToOpenSubscriptionManagement'))
    }
    finally {
      setIsPortalLoading(false)
    }
  }, [isPortalLoading, setIsPortalLoading, subscriptionSource, trimmedUpgradeUrl])

  return {
    handleStartCheckout,
    handleManageSubscription,
    handleRestorePurchases,
  }
}
