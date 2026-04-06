import { Capacitor } from '@capacitor/core'

/**
 * Google Play (Android) subscription config.
 * Set VITE_PLAY_SUBSCRIPTION_ID and VITE_PLAY_SUBSCRIPTION_BASE_PLAN_ID
 * to match your subscription in Google Play Console.
 * Optional VITE_PLAY_SUBSCRIPTION_YEARLY_BASE_PLAN_ID enables a yearly base plan + paywall picker.
 */
const PLAY_SUBSCRIPTION_ID
  = (import.meta.env.VITE_PLAY_SUBSCRIPTION_ID as string | undefined)?.trim()
    || 'pro_monthly'
const PLAY_SUBSCRIPTION_BASE_PLAN_ID
  = (import.meta.env.VITE_PLAY_SUBSCRIPTION_BASE_PLAN_ID as string | undefined)?.trim()
    || 'default'
const PLAY_SUBSCRIPTION_YEARLY_BASE_PLAN_ID
  = (import.meta.env.VITE_PLAY_SUBSCRIPTION_YEARLY_BASE_PLAN_ID as string | undefined)?.trim()
    || ''

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

export type PlayPlanPickerKey = 'monthly' | 'yearly'

export type PlaySubscriptionPlanOption = {
  key: PlayPlanPickerKey
  basePlanId: string
}

/** True when yearly base plan id is set — paywall shows monthly vs yearly on Android. */
export function hasPlayYearlyBasePlan(): boolean {
  return PLAY_SUBSCRIPTION_YEARLY_BASE_PLAN_ID.length > 0
}

/** Plans shown in the Android paywall picker (always includes monthly; yearly if configured). */
export function getPlayPlansForPicker(): readonly PlaySubscriptionPlanOption[] {
  const monthly: PlaySubscriptionPlanOption = {
    key: 'monthly',
    basePlanId: PLAY_SUBSCRIPTION_BASE_PLAN_ID,
  }
  if (!PLAY_SUBSCRIPTION_YEARLY_BASE_PLAN_ID) {
    return [monthly] as const
  }
  return [
    monthly,
    { key: 'yearly', basePlanId: PLAY_SUBSCRIPTION_YEARLY_BASE_PLAN_ID },
  ] as const
}

export const PLAY_SUBSCRIPTION_PLANS = Object.freeze({
  monthly: Object.freeze({
    key: 'monthly' as const,
    basePlanId: PLAY_SUBSCRIPTION_BASE_PLAN_ID,
  }),
  ...(PLAY_SUBSCRIPTION_YEARLY_BASE_PLAN_ID
    ? {
        yearly: Object.freeze({
          key: 'yearly' as const,
          basePlanId: PLAY_SUBSCRIPTION_YEARLY_BASE_PLAN_ID,
        }),
      }
    : {}),
})

export const BILLING = Object.freeze({
  play: {
    subscriptionId: PLAY_SUBSCRIPTION_ID,
    /** Default / monthly base plan (backward compatible). */
    basePlanId: PLAY_SUBSCRIPTION_BASE_PLAN_ID,
    productIdentifiers: [PLAY_SUBSCRIPTION_ID] as const,
  },
})
