import '../types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('URL')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY')
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

if (
  !supabaseUrl
  || !supabaseServiceRoleKey
  || !stripeWebhookSecret
) {
  throw new Error('Missing required environment variables.')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing Stripe signature.', { status: 400 })
  }

  const body = await req.text()
  let event: { type: string, data: { object: Record<string, unknown> } }

  try {
    const signatureParts = signature.split(',').map(part => part.trim())
    let timestamp: string | null = null
    const signatures: string[] = []

    for (const part of signatureParts) {
      const [key, value] = part.split('=')
      if (key === 't') {
        timestamp = value ?? null
      }
      else if (key === 'v1' && value) {
        signatures.push(value)
      }
    }

    if (!timestamp || !signatures.length) {
      return new Response('Invalid Stripe signature header.', { status: 400 })
    }

    const timestampSeconds = Number(timestamp)
    if (!Number.isFinite(timestampSeconds)) {
      return new Response('Invalid Stripe signature timestamp.', { status: 400 })
    }

    const nowSeconds = Math.floor(Date.now() / 1000)
    if (Math.abs(nowSeconds - timestampSeconds) > 300) {
      return new Response('Stripe signature timestamp is outside tolerance.', {
        status: 400,
      })
    }

    const signedPayload = `${timestamp}.${body}`
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(stripeWebhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(signedPayload),
    )
    const signatureHex = Array.from(new Uint8Array(signatureBuffer))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')

    const matches = signatures.some((candidate) => {
      if (candidate.length !== signatureHex.length) return false
      let result = 0
      for (let i = 0; i < candidate.length; i += 1) {
        result |= candidate.charCodeAt(i) ^ signatureHex.charCodeAt(i)
      }
      return result === 0
    })

    if (!matches) {
      return new Response('Webhook signature verification failed.', {
        status: 400,
      })
    }

    event = JSON.parse(body) as {
      type: string
      data: { object: Record<string, unknown> }
    }
  }
  catch (error) {
    return new Response(
      `Webhook signature verification failed. ${
        error instanceof Error ? error.message : ''
      }`,
      { status: 400 },
    )
  }

  const updateUserMetadata = async (
    userId: string,
    updatesOrFn:
      | Record<string, unknown>
      | ((current: Record<string, unknown>) => Record<string, unknown>),
  ) => {
    const adminHeaders = {
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      apikey: supabaseServiceRoleKey,
      'Content-Type': 'application/json',
    }
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      headers: adminHeaders,
    })
    if (!userResponse.ok) {
      return { error: 'Unable to fetch user.' }
    }

    const userPayload = await userResponse.json()
    const currentMetadata = userPayload?.app_metadata ?? {}
    const updates =
      typeof updatesOrFn === 'function'
        ? updatesOrFn(currentMetadata)
        : updatesOrFn
    const updateResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        app_metadata: { ...currentMetadata, ...updates },
      }),
    })
    if (!updateResponse.ok) {
      return { error: 'Failed to update user.' }
    }
    return { error: null }
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as {
      metadata?: Record<string, string>
      customer?: string | null
      subscription?: string | null
    }
    const userId = session.metadata?.supabase_user_id
    if (!userId) {
      return new Response('Missing supabase_user_id metadata.', { status: 400 })
    }

    const updates: Record<string, unknown> = {
      is_pro: true,
      subscription_source: 'stripe',
    }
    if (typeof session.customer === 'string') {
      updates.stripe_customer_id = session.customer
    }
    if (typeof session.subscription === 'string') {
      updates.stripe_subscription_id = session.subscription
    }

    const { error } = await updateUserMetadata(userId, updates)
    if (error) {
      return new Response(error, { status: 500 })
    }
  }

  if (
    event.type === 'customer.subscription.updated'
    || event.type === 'customer.subscription.deleted'
  ) {
    const subscription = event.data.object as {
      id?: string
      status?: string
      metadata?: Record<string, string>
      customer?: string | null
    }
    const userId = subscription.metadata?.supabase_user_id
    if (!userId) {
      return new Response('Missing supabase_user_id metadata.', { status: 200 })
    }

    const status = subscription.status ?? ''
    const isActive = status === 'active' || status === 'trialing'
    const shouldEnable = event.type === 'customer.subscription.updated'
      ? isActive
      : false

    const { error } = await updateUserMetadata(userId, (current) => {
      const updates: Record<string, unknown> = {
        is_pro: shouldEnable,
      }
      if (shouldEnable) {
        updates.subscription_source = 'stripe'
      }
      else {
        // Users are Stripe OR Play, but a delayed/replayed Stripe webhook could
        // run after they subscribed on Play; avoid overwriting subscription_source.
        if (current.subscription_source !== 'play') {
          updates.subscription_source = null
        }
      }
      if (typeof subscription.customer === 'string') {
        updates.stripe_customer_id = subscription.customer
      }
      if (typeof subscription.id === 'string') {
        updates.stripe_subscription_id = subscription.id
      }
      return updates
    })
    if (error) {
      return new Response(error, { status: 500 })
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
