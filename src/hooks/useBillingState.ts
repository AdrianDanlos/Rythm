import type { Session } from '@supabase/supabase-js'

export type SubscriptionSource = 'play' | undefined

export function useBillingState(session: Session | null) {
  const isPro = Boolean(session?.user?.app_metadata?.is_pro)
  const subscriptionSource: SubscriptionSource
    = session?.user?.app_metadata?.subscription_source === 'play' ? 'play' : undefined
  const subPlay = session?.user?.app_metadata?.subscription_source === 'play'
  const canManageSubscription = isPro && subPlay
  const upgradeUrl = import.meta.env.VITE_UPGRADE_URL as string | undefined
  const trimmedUpgradeUrl = upgradeUrl?.trim() ?? undefined
  const playIntroOfferConsumed = Boolean(
    (session?.user?.app_metadata as { play_intro_offer_consumed?: unknown } | undefined)
      ?.play_intro_offer_consumed,
  )

  return {
    isPro,
    subscriptionSource,
    canManageSubscription,
    trimmedUpgradeUrl,
    playIntroOfferConsumed,
  }
}
