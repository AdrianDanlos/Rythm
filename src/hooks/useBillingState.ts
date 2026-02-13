import type { Session } from '@supabase/supabase-js'
import { PRICING } from '../billing/shared/pricing'

export type SubscriptionSource = 'play' | 'stripe' | undefined

export function useBillingState(session: Session | null) {
  const isPro = Boolean(session?.user?.app_metadata?.is_pro)
  const subscriptionSource: SubscriptionSource
    = session?.user?.app_metadata?.subscription_source === 'play'
      ? 'play'
      : (session?.user?.app_metadata?.subscription_source === 'stripe'
        || session?.user?.app_metadata?.stripe_customer_id
          ? 'stripe'
          : undefined)
  const hasStripe = Boolean(session?.user?.app_metadata?.stripe_customer_id)
  const subPlay = session?.user?.app_metadata?.subscription_source === 'play'
  const subStripe = session?.user?.app_metadata?.subscription_source === 'stripe'
  const canManageSubscription = isPro && (hasStripe || subPlay || subStripe)
  const upgradeUrl = import.meta.env.VITE_UPGRADE_URL as string | undefined
  const trimmedUpgradeUrl = upgradeUrl?.trim() ?? undefined
  const priceLabel = PRICING.pro.priceLabel

  return {
    isPro,
    subscriptionSource,
    canManageSubscription,
    trimmedUpgradeUrl,
    priceLabel,
  }
}
