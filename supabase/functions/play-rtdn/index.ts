import '../types.ts'

/**
 * Real-time developer notifications (RTDN) from Google Play via Cloud Pub/Sub.
 * Configure a Pub/Sub push subscription to POST to this function's URL.
 * Payload: { message: { data: "<base64 DeveloperNotification>", messageId, publishTime }, subscription: "..." }
 * @see https://developer.android.com/google/play/billing/rtdn-reference
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-rtdn-secret',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('URL')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY')
const rtdnSharedSecret = (Deno.env.get('RTDN_SHARED_SECRET') ?? '').trim()

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing required Supabase environment variables.')
}

const validatedSupabaseUrl: string = supabaseUrl
const validatedServiceRoleKey: string = supabaseServiceRoleKey

// Subscription notification types that mean the user should lose Pro access.
const REVOKE_SUBSCRIPTION_TYPES = new Set([3, 12, 13]) // CANCELED, REVOKED, EXPIRED

type PubSubMessage = {
  message?: {
    data?: string
    messageId?: string
    publishTime?: string
  }
  subscription?: string
}

type DeveloperNotification = {
  version?: string
  packageName?: string
  eventTimeMillis?: number
  subscriptionNotification?: {
    version?: string
    notificationType?: number
    purchaseToken?: string
  }
  voidedPurchaseNotification?: {
    purchaseToken?: string
    orderId?: string
    productType?: number
  }
  testNotification?: { version?: string }
}

async function revokeProForUser(userId: string): Promise<void> {
  const adminHeaders = {
    'Authorization': `Bearer ${validatedServiceRoleKey}`,
    'apikey': validatedServiceRoleKey,
    'Content-Type': 'application/json',
  }
  const userRes = await fetch(`${validatedSupabaseUrl}/auth/v1/admin/users/${userId}`, {
    headers: adminHeaders,
  })
  if (!userRes.ok) return
  const userPayload = await userRes.json()
  const current = (userPayload?.app_metadata ?? {}) as Record<string, unknown>
  const subscriptionSource = current.subscription_source
  const updates: Record<string, unknown> = {
    ...current,
    is_pro: false,
  }
  delete updates.play_subscription_token
  delete updates.play_subscription_id
  delete updates.play_subscription_expiry_time_millis
  if (subscriptionSource !== 'play') {
    updates.subscription_source = subscriptionSource
  }
  else {
    delete updates.subscription_source
  }
  await fetch(`${validatedSupabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ app_metadata: updates }),
  })
}

async function findUserIdByPurchaseToken(purchaseToken: string): Promise<string | null> {
  const url = `${validatedSupabaseUrl}/rest/v1/play_subscription_user?purchase_token=eq.${encodeURIComponent(purchaseToken)}&select=user_id`
  const res = await fetch(url, {
    headers: {
      apikey: validatedServiceRoleKey,
      Authorization: `Bearer ${validatedServiceRoleKey}`,
    },
  })
  if (!res.ok) return null
  const rows = await res.json() as { user_id: string }[]
  return rows?.[0]?.user_id ?? null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' }
  const reqUrl = new URL(req.url)
  const providedSecret = req.headers.get('x-rtdn-secret') ?? reqUrl.searchParams.get('secret') ?? ''

  if (rtdnSharedSecret && providedSecret !== rtdnSharedSecret) {
    console.warn('[play-rtdn] Ignored request from untrusted sender')
    return new Response(JSON.stringify({ received: true, ignored: 'unauthorized_sender' }), {
      status: 200,
      headers: jsonHeaders,
    })
  }

  let rawBody = ''
  try {
    rawBody = await req.text()
  }
  catch (error) {
    console.error('[play-rtdn] Failed to read request body', error)
    return new Response(JSON.stringify({ received: true, ignored: 'body_read_error' }), {
      status: 200,
      headers: jsonHeaders,
    })
  }

  if (!rawBody.trim()) {
    console.warn('[play-rtdn] Ignored empty request body')
    return new Response(JSON.stringify({ received: true, ignored: 'empty_body' }), {
      status: 200,
      headers: jsonHeaders,
    })
  }

  let body: PubSubMessage & Record<string, unknown>
  try {
    body = JSON.parse(rawBody) as PubSubMessage & Record<string, unknown>
  }
  catch {
    console.warn('[play-rtdn] Ignored invalid JSON body')
    return new Response(JSON.stringify({ received: true, ignored: 'invalid_json' }), {
      status: 200,
      headers: jsonHeaders,
    })
  }

  if ('hello' in body) {
    console.log('[play-rtdn] Hello test payload received', body.hello)
    return new Response(JSON.stringify({ received: true, hello: body.hello ?? true }), {
      status: 200,
      headers: jsonHeaders,
    })
  }

  let notification: DeveloperNotification

  const maybeDirectNotification = body as DeveloperNotification
  if (
    maybeDirectNotification.subscriptionNotification
    || maybeDirectNotification.voidedPurchaseNotification
    || maybeDirectNotification.testNotification
  ) {
    notification = maybeDirectNotification
  }
  else {
    const dataB64 = body.message?.data
    if (!dataB64 || typeof dataB64 !== 'string') {
      console.warn('[play-rtdn] Ignored message without Pub/Sub payload')
      return new Response(JSON.stringify({ received: true, ignored: 'missing_message_data' }), {
        status: 200,
        headers: jsonHeaders,
      })
    }

    try {
      const decoded = atob(dataB64)
      notification = JSON.parse(decoded) as DeveloperNotification
    }
    catch {
      console.warn('[play-rtdn] Ignored invalid Pub/Sub payload')
      return new Response(JSON.stringify({ received: true, ignored: 'invalid_message_data' }), {
        status: 200,
        headers: jsonHeaders,
      })
    }
  }

  const hasKnownNotification = Boolean(
    notification.testNotification
    || notification.subscriptionNotification
    || notification.voidedPurchaseNotification,
  )
  if (!hasKnownNotification) {
    const notificationKeys = Object.keys(notification ?? {}).slice(0, 10)
    console.warn('[play-rtdn] Ignored unknown notification shape', {
      messageId: body.message?.messageId ?? null,
      keys: notificationKeys,
    })
    return new Response(JSON.stringify({ received: true, ignored: 'unknown_notification_shape' }), {
      status: 200,
      headers: jsonHeaders,
    })
  }

  let notificationKind: 'test' | 'subscription' | 'voided_purchase'
  if (notification.testNotification) {
    notificationKind = 'test'
  }
  else if (notification.subscriptionNotification) {
    notificationKind = 'subscription'
  }
  else {
    notificationKind = 'voided_purchase'
  }

  console.log('[play-rtdn] Received RTDN', {
    kind: notificationKind,
    messageId: body.message?.messageId ?? null,
  })

  // Test notification from Play Console – acknowledge only.
  if (notification.testNotification) {
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: jsonHeaders,
    })
  }

  let purchaseToken: string | undefined

  if (notification.subscriptionNotification) {
    const sub = notification.subscriptionNotification
    const notificationType = sub.notificationType ?? 0
    if (REVOKE_SUBSCRIPTION_TYPES.has(notificationType)) {
      purchaseToken = sub.purchaseToken
    }
  }
  else if (notification.voidedPurchaseNotification) {
    const voided = notification.voidedPurchaseNotification
    if (voided.productType === 1) {
      purchaseToken = voided.purchaseToken
    }
  }

  if (purchaseToken) {
    const userId = await findUserIdByPurchaseToken(purchaseToken)
    if (userId) {
      await revokeProForUser(userId)
      console.log('[play-rtdn] Revoked Pro due to RTDN event', { userId })
    }
    else {
      console.warn('[play-rtdn] No user found for RTDN purchase token')
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: jsonHeaders,
  })
})
