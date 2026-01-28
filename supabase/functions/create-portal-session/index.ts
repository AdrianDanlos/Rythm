import '../types.ts'
// @ts-expect-error Deno/Edge runtime URL import
import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'
// @ts-expect-error Deno/Edge runtime URL import
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
// @ts-expect-error Deno/Edge runtime URL import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

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

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
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

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    return new Response(JSON.stringify({ error: 'Invalid user session.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const stripeCustomerId = data.user.app_metadata?.stripe_customer_id
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

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  })

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
