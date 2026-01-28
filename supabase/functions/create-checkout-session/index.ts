import '../types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('URL')
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('ANON_KEY')
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
const stripePriceId = Deno.env.get('STRIPE_PRICE_ID')
const successUrl = Deno.env.get('STRIPE_SUCCESS_URL')
const cancelUrl = Deno.env.get('STRIPE_CANCEL_URL')

if (
  !supabaseUrl
  || !supabaseAnonKey
  || !stripeSecretKey
  || !stripePriceId
  || !successUrl
  || !cancelUrl
) {
  throw new Error('Missing required environment variables.')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: authHeader,
      apikey: supabaseAnonKey,
    },
  })
  if (!userResponse.ok) {
    return new Response(JSON.stringify({ error: 'Invalid user session.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userPayload = await userResponse.json()
  const user = userPayload?.user ?? userPayload
  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid user session.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const stripeCustomerId = user.app_metadata?.stripe_customer_id
  const body = new URLSearchParams({
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
  })
  body.append('line_items[0][price]', stripePriceId)
  body.append('line_items[0][quantity]', '1')
  body.append('subscription_data[metadata][supabase_user_id]', user.id)
  body.append('metadata[supabase_user_id]', user.id)
  if (typeof stripeCustomerId === 'string') {
    body.append('customer', stripeCustomerId)
  } else if (user.email) {
    body.append('customer_email', user.email)
  }

  const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })
  if (!stripeResponse.ok) {
    const errorPayload = await stripeResponse.text()
    return new Response(JSON.stringify({ error: 'Stripe error.', details: errorPayload }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const session = await stripeResponse.json()

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
