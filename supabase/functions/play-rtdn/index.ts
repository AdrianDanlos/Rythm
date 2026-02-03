import '../types.ts'

/**
 * Real-time developer notifications (RTDN) from Google Play via Cloud Pub/Sub.
 * Configure a Pub/Sub push subscription to POST to this function's URL.
 * Payload: { message: { data: "<base64 DeveloperNotification>", messageId, publishTime }, subscription: "..." }
 * @see https://developer.android.com/google/play/billing/rtdn-reference
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('URL')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY')

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing required Supabase environment variables.')
}

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
    Authorization: `Bearer ${supabaseServiceRoleKey}`,
    apikey: supabaseServiceRoleKey,
    'Content-Type': 'application/json',
  }
  const userRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    headers: adminHeaders,
  })
  if (!userRes.ok) return
  const userPayload = await userRes.json()
  const current = (userPayload?.app_metadata ?? {}) as Record<string, unknown>
  const {
    subscription_source,
    play_subscription_token: _pt,
    play_subscription_id: _pid,
    play_subscription_expiry_time_millis: _exp,
    ...rest
  } = current
  const updates: Record<string, unknown> = {
    ...rest,
    is_pro: false,
  }
  if (subscription_source !== 'play') {
    updates.subscription_source = subscription_source
  }
  await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ app_metadata: updates }),
  })
}

async function findUserIdByPurchaseToken(purchaseToken: string): Promise<string | null> {
  const url = `${supabaseUrl}/rest/v1/play_subscription_user?purchase_token=eq.${encodeURIComponent(purchaseToken)}&select=user_id`
  const res = await fetch(url, {
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
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

  let body: PubSubMessage
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const dataB64 = body.message?.data
  if (!dataB64 || typeof dataB64 !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing message.data' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let notification: DeveloperNotification
  try {
    const decoded = atob(dataB64)
    notification = JSON.parse(decoded) as DeveloperNotification
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid base64 or JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Test notification from Play Console – acknowledge only.
  if (notification.testNotification) {
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let purchaseToken: string | undefined

  if (notification.subscriptionNotification) {
    const sub = notification.subscriptionNotification
    const notificationType = sub.notificationType ?? 0
    if (REVOKE_SUBSCRIPTION_TYPES.has(notificationType)) {
      purchaseToken = sub.purchaseToken
    }
  } else if (notification.voidedPurchaseNotification) {
    const voided = notification.voidedPurchaseNotification
    if (voided.productType === 1) {
      purchaseToken = voided.purchaseToken
    }
  }

  if (purchaseToken) {
    const userId = await findUserIdByPurchaseToken(purchaseToken)
    if (userId) {
      await revokeProForUser(userId)
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
