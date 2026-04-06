import { Capacitor } from '@capacitor/core'

/**
 * Google Play (Android) subscription config.
 * Set VITE_PLAY_SUBSCRIPTION_ID and VITE_PLAY_SUBSCRIPTION_BASE_PLAN_ID
 * to match your subscription in Google Play Console.
 */
const PLAY_SUBSCRIPTION_ID
  = (import.meta.env.VITE_PLAY_SUBSCRIPTION_ID as string | undefined)?.trim()
    || 'pro_monthly'
const PLAY_SUBSCRIPTION_BASE_PLAN_ID
  = (import.meta.env.VITE_PLAY_SUBSCRIPTION_BASE_PLAN_ID as string | undefined)?.trim()
    || 'default'

const DEFAULT_PLAY_TRIAL_DAYS = 7

function parsePlayFreeTrialDaysFromEnv(): number {
  const raw = (import.meta.env.VITE_PLAY_TRIAL_DAYS as string | undefined)?.trim()
  if (raw === '0') return 0
  if (!raw) return DEFAULT_PLAY_TRIAL_DAYS
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_PLAY_TRIAL_DAYS
  return Math.min(Math.floor(n), 365)
}

/** Android app using Google Play Billing (not web/PWA). */
export function isAndroidPlayBilling(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

/**
 * Free-trial length (days) for paywall copy. Must match the free-trial phase on your
 * subscription base plan in Play Console. Set VITE_PLAY_TRIAL_DAYS to override the default (7), or `0` to hide trial messaging.
 */
export function getPlayFreeTrialDays(): number {
  return parsePlayFreeTrialDaysFromEnv()
}

export const BILLING = Object.freeze({
  play: {
    subscriptionId: PLAY_SUBSCRIPTION_ID,
    basePlanId: PLAY_SUBSCRIPTION_BASE_PLAN_ID,
    productIdentifiers: [PLAY_SUBSCRIPTION_ID] as const,
  },
})
