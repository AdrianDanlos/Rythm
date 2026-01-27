import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

if (
  !supabaseUrl ||
  !supabaseServiceRoleKey ||
  !stripeWebhookSecret
) {
  throw new Error('Missing required environment variables.')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing Stripe signature.', { status: 400 })
  }

  const body = await req.text()
  let event: { type: string; data: { object: Record<string, unknown> } }

  try {
    const signatureParts = signature.split(',').map(part => part.trim())
    let timestamp: string | null = null
    const signatures: string[] = []

    for (const part of signatureParts) {
      const [key, value] = part.split('=')
      if (key === 't') {
        timestamp = value ?? null
      } else if (key === 'v1' && value) {
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
  } catch (error) {
    return new Response(
      `Webhook signature verification failed. ${
        error instanceof Error ? error.message : ''
      }`,
      { status: 400 },
    )
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as {
      metadata?: Record<string, string>
    }
    const userId = session.metadata?.supabase_user_id
    if (!userId) {
      return new Response('Missing supabase_user_id metadata.', { status: 400 })
    }

    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (error || !data?.user) {
      return new Response('Unable to fetch user.', { status: 500 })
    }

    const currentMetadata = data.user.app_metadata ?? {}
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: { ...currentMetadata, is_pro: true },
      })

    if (updateError) {
      return new Response('Failed to update user.', { status: 500 })
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
