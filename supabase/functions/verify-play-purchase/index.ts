import '../types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('URL')
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('ANON_KEY')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY')
const packageName = Deno.env.get('PLAY_PACKAGE_NAME') || 'com.rythm.app'
const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error('Missing required Supabase environment variables.')
}

function base64urlEncode(input: string | ArrayBuffer): string {
  const bytes = typeof input === 'string'
    ? new TextEncoder().encode(input)
    : new Uint8Array(input)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function getGoogleAccessToken(): Promise<string> {
  if (!serviceAccountJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set.')
  }
  const sa = JSON.parse(serviceAccountJson) as {
    client_email: string
    private_key: string
  }
  const clientEmail = sa.client_email
  const privateKeyPem = sa.private_key.replace(/\\n/g, '\n')
  const pemContents = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
  }
  const headerB64 = base64urlEncode(JSON.stringify(header))
  const payloadB64 = base64urlEncode(JSON.stringify(payload))
  const signatureInput = `${headerB64}.${payloadB64}`
  const signatureInputBuffer = new TextEncoder().encode(signatureInput)
  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    signatureInputBuffer,
  )
  const signatureB64 = base64urlEncode(signatureBuffer)
  const jwt = `${signatureInput}.${signatureB64}`
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwt,
  })
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!tokenRes.ok) {
    const text = await tokenRes.text()
    throw new Error(`Google token error: ${tokenRes.status} ${text}`)
  }
  const tokenData = await tokenRes.json() as { access_token?: string }
  const accessToken = tokenData.access_token
  if (!accessToken) {
    throw new Error('Missing access_token in Google response.')
  }
  return accessToken
}

async function getSubscriptionFromPlay(
  accessToken: string,
  pkg: string,
  subscriptionId: string,
  token: string,
): Promise<{ valid: boolean; expiryTimeMillis?: string }> {
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(pkg)}/purchases/subscriptions/${encodeURIComponent(subscriptionId)}/tokens/${encodeURIComponent(token)}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Play API error: ${res.status} ${text}`)
  }
  const data = await res.json() as {
    expiryTimeMillis?: string
    paymentState?: number
    acknowledgementState?: number
  }
  const expiryMs = data.expiryTimeMillis ? Number(data.expiryTimeMillis) : 0
  const paymentState = data.paymentState ?? 0
  const acknowledged = (data.acknowledgementState ?? 0) === 1
  const valid = Number.isFinite(expiryMs) && expiryMs > Date.now() && paymentState === 1 && acknowledged
  return { valid, expiryTimeMillis: data.expiryTimeMillis }
}

async function updateUserAppMetadata(
  userId: string,
  updates: Record<string, unknown>,
): Promise<{ error: string | null }> {
  const adminHeaders = {
    Authorization: `Bearer ${supabaseServiceRoleKey}`,
    apikey: supabaseServiceRoleKey,
    'Content-Type': 'application/json',
  }
  const userRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    headers: adminHeaders,
  })
  if (!userRes.ok) {
    return { error: 'Unable to fetch user.' }
  }
  const userPayload = await userRes.json()
  const current = (userPayload?.app_metadata ?? {}) as Record<string, unknown>
  const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      app_metadata: { ...current, ...updates },
    }),
  })
  if (!updateRes.ok) {
    return { error: 'Failed to update user.' }
  }
  return { error: null }
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

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: authHeader,
      apikey: supabaseAnonKey,
    },
  })
  if (!userRes.ok) {
    return new Response(JSON.stringify({ error: 'Invalid user session.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userPayload = await userRes.json()
  const user = userPayload?.user ?? userPayload
  if (!user?.id) {
    return new Response(JSON.stringify({ error: 'Invalid user session.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: { purchaseToken?: string; subscriptionId?: string; packageName?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const purchaseToken = typeof body.purchaseToken === 'string' ? body.purchaseToken.trim() : undefined
  const subscriptionId = typeof body.subscriptionId === 'string' ? body.subscriptionId.trim() : undefined
  const pkg = typeof body.packageName === 'string' ? body.packageName.trim() : packageName

  if (!purchaseToken || !subscriptionId) {
    return new Response(
      JSON.stringify({ error: 'Missing purchaseToken or subscriptionId.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  try {
    const accessToken = await getGoogleAccessToken()
    const { valid, expiryTimeMillis } = await getSubscriptionFromPlay(
      accessToken,
      pkg,
      subscriptionId,
      purchaseToken,
    )

    if (!valid) {
      return new Response(
        JSON.stringify({ error: 'Subscription is not active or not acknowledged.', valid: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const updates: Record<string, unknown> = {
      is_pro: true,
      subscription_source: 'play',
      play_subscription_token: purchaseToken,
      play_subscription_id: subscriptionId,
    }
    if (expiryTimeMillis) {
      updates.play_subscription_expiry_time_millis = expiryTimeMillis
    }

    const { error } = await updateUserAppMetadata(user.id, updates)
    if (error) {
      return new Response(JSON.stringify({ error }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Store purchase_token -> user_id for RTDN so we can revoke is_pro when subscription ends.
    const now = new Date().toISOString()
    const upsertRes = await fetch(`${supabaseUrl}/rest/v1/play_subscription_user`, {
      method: 'POST',
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        purchase_token: purchaseToken,
        user_id: user.id,
        subscription_id: subscriptionId,
        updated_at: now,
      }),
    })
    if (!upsertRes.ok) {
      // Log but do not fail the request; user is already marked Pro.
      console.error('play_subscription_user upsert failed:', await upsertRes.text())
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed.'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
