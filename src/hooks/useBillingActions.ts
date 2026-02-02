import { Capacitor } from '@capacitor/core'
import { supabase } from '../lib/supabaseClient'

type UseBillingActionsParams = {
  trimmedUpgradeUrl?: string
  isPortalLoading: boolean
  setIsPortalLoading: (value: boolean) => void
}

export const useBillingActions = ({
  trimmedUpgradeUrl,
  isPortalLoading,
  setIsPortalLoading,
}: UseBillingActionsParams) => {
  const handleStartCheckout = async () => {
    try {
      const platform = Capacitor.isNativePlatform() ? 'mobile' : 'web'
      const { data, error } = await supabase.functions.invoke(
        'create-checkout-session',
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
  }

  const handleManageSubscription = async () => {
    if (isPortalLoading) return
    setIsPortalLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke(
        'create-portal-session',
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
      throw new Error('Missing portal URL.')
    }
    catch {
      window.alert('Unable to open subscription management.')
    }
    finally {
      setIsPortalLoading(false)
    }
  }

  return {
    handleStartCheckout,
    handleManageSubscription,
  }
}
