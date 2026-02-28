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
  subscriptionSource?: 'stripe' | 'play'
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
  const handleStartCheckout = useCallback(async (): Promise<boolean> => {
    if (isAndroid()) {
      try {
        const supported = await NativePurchases.isBillingSupported()
        if (!supported?.isBillingSupported) {
          window.alert(t('errors.iapNotAvailable'))
          return false
        }
        const { subscriptionId, basePlanId } = BILLING.play
        const transaction = await NativePurchases.purchaseProduct({
          productIdentifier: subscriptionId,
          planIdentifier: basePlanId,
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

    try {
      const platform = Capacitor.isNativePlatform() ? 'mobile' : 'web'
      const { data, error } = await supabase.functions.invoke(
        'stripe-checkout-session',
        { body: { platform } },
      )
      if (error) {
        throw error
      }
      const checkoutUrl = data?.url as string | undefined
      if (checkoutUrl) {
        window.location.href = checkoutUrl
        return true
      }
    }
    catch {
      // Fall back to static upgrade URL if configured.
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
      const { data, error } = await supabase.functions.invoke(
        'stripe-portal-session',
        { body: {} },
      )
      if (error) {
        throw error
      }
      const portalUrl = data?.url as string | undefined
      if (portalUrl) {
        window.location.href = portalUrl
        return
      }
      throw new Error(t('errors.missingPortalUrl'))
    }
    catch {
      window.alert(t('errors.unableToOpenSubscriptionManagement'))
    }
    finally {
      setIsPortalLoading(false)
    }
  }, [isPortalLoading, setIsPortalLoading, subscriptionSource])

  return {
    handleStartCheckout,
    handleManageSubscription,
    handleRestorePurchases,
  }
}
