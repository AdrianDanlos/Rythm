import '../types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('URL')
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('ANON_KEY')
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
const portalReturnUrl = Deno.env.get('STRIPE_PORTAL_RETURN_URL')

if (
  !supabaseUrl
  || !supabaseAnonKey
  || !stripeSecretKey
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
  if (typeof stripeCustomerId !== 'string' || !stripeCustomerId.trim()) {
    return new Response(JSON.stringify({ error: 'Missing Stripe customer.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const returnUrl = portalReturnUrl ?? req.headers.get('origin') ?? ''
  if (!returnUrl) {
    return new Response(JSON.stringify({ error: 'Missing return URL.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const body = new URLSearchParams({
    customer: stripeCustomerId,
    return_url: returnUrl,
  })
  const stripeResponse = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
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
