/**
 * Billing config for Google Play (Android) and Stripe (web).
 * Set VITE_PLAY_SUBSCRIPTION_ID and VITE_PLAY_SUBSCRIPTION_BASE_PLAN_ID
 * to match your subscription in Google Play Console.
 */
const PLAY_SUBSCRIPTION_ID =
  (import.meta.env.VITE_PLAY_SUBSCRIPTION_ID as string | undefined)?.trim()
  || 'pro_monthly'
const PLAY_SUBSCRIPTION_BASE_PLAN_ID =
  (import.meta.env.VITE_PLAY_SUBSCRIPTION_BASE_PLAN_ID as string | undefined)?.trim()
  || 'default'

export const BILLING = Object.freeze({
  play: {
    subscriptionId: PLAY_SUBSCRIPTION_ID,
    basePlanId: PLAY_SUBSCRIPTION_BASE_PLAN_ID,
    productIdentifiers: [PLAY_SUBSCRIPTION_ID] as const,
  },
})
