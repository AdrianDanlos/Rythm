import '../types.ts'
// @ts-expect-error Deno/Edge runtime URL import
import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'
// @ts-expect-error Deno/Edge runtime URL import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const resendApiKey = Deno.env.get('RESEND_API_KEY')
const feedbackFromEmail = Deno.env.get('FEEDBACK_FROM_EMAIL')
const feedbackToEmail = Deno.env.get('FEEDBACK_TO_EMAIL') ?? 'danlosadrian@gmail.com'

if (
  !supabaseUrl
  || !supabaseAnonKey
  || !supabaseServiceRoleKey
  || !resendApiKey
  || !feedbackFromEmail
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

  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let message: string | null = null
  try {
    const body = await req.json() as { message?: unknown }
    if (typeof body.message === 'string') {
      message = body.message.trim()
    }
  }
  catch {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!message) {
    return new Response(JSON.stringify({ error: 'Message is required.' }), {
      status: 400,
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

  const userEmail = data.user.email
  if (!userEmail) {
    return new Response(JSON.stringify({ error: 'User email is required.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { error: insertError } = await supabaseAdmin
    .from('feedback')
    .insert({
      email: userEmail,
      message,
      user_id: data.user.id,
    })

  if (insertError) {
    return new Response(JSON.stringify({ error: 'Failed to save feedback.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const emailPromise = fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: feedbackFromEmail,
      to: feedbackToEmail,
      subject: 'New Rythm feedback',
      text: `From: ${userEmail}\nUser ID: ${data.user.id}\n\n${message}`,
    }),
  })

  const waitUntil = (
    globalThis as { EdgeRuntime?: { waitUntil: (promise: Promise<unknown>) => void } }
  ).EdgeRuntime?.waitUntil

  if (waitUntil) {
    waitUntil(emailPromise.catch(() => null))
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const emailResponse = await emailPromise
  if (!emailResponse.ok) {
    const errorText = await emailResponse.text()
    return new Response(
      JSON.stringify({
        error: 'Failed to send feedback email.',
        details: errorText,
      }),
      {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
