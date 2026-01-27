import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

if (
  !supabaseUrl ||
  !supabaseServiceRoleKey ||
  !stripeSecretKey ||
  !stripeWebhookSecret
) {
  throw new Error('Missing required environment variables.')
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
  cryptoProvider: Stripe.createSubtleCryptoProvider(),
})

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
  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      stripeWebhookSecret,
    )
  } catch (error) {
    return new Response(
      `Webhook signature verification failed. ${
        error instanceof Error ? error.message : ''
      }`,
      { status: 400 },
    )
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
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
