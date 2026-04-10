import { beforeEach, describe, expect, it, vi } from 'vitest'

type Handler = (request: Request) => Promise<Response> | Response

const envBase: Record<string, string> = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({
    client_email: 'service@example.iam.gserviceaccount.com',
    private_key: '-----BEGIN PRIVATE KEY-----\\nAQID\\n-----END PRIVATE KEY-----\\n',
  }),
  PLAY_PACKAGE_NAME: 'com.rythm.app',
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const textResponse = (body: string, status = 200) => new Response(body, { status })

const parseJson = async (response: Response) => response.json() as Promise<Record<string, unknown>>

const setupEdgeFunction = async (
  fetchImpl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
  envOverrides: Record<string, string> = {},
) => {
  vi.resetModules()

  let capturedHandler: Handler | null = null
  const env = { ...envBase, ...envOverrides }

  vi.stubGlobal('Deno', {
    env: {
      get: (name: string) => env[name],
    },
    serve: (handler: Handler) => {
      capturedHandler = handler
    },
  })

  vi.stubGlobal('crypto', {
    subtle: {
      importKey: vi.fn(async () => ({})),
      sign: vi.fn(async () => new Uint8Array([1, 2, 3]).buffer),
    },
  })

  vi.stubGlobal('fetch', vi.fn(fetchImpl))

  await import('./index.ts')

  if (!capturedHandler) {
    throw new Error('Deno.serve handler was not captured.')
  }

  return { handler: capturedHandler, fetchMock: vi.mocked(fetch) }
}

describe('play-verify-purchase edge function', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns 401 when authorization header is missing', async () => {
    const { handler } = await setupEdgeFunction(async () => {
      throw new Error('fetch should not be called without auth header')
    })

    const response = await handler(new Request('https://example.com', { method: 'POST' }))
    const payload = await parseJson(response)

    expect(response.status).toBe(401)
    expect(payload.error).toBe('Missing authorization.')
  })

  it('returns 400 for invalid JSON body', async () => {
    const { handler } = await setupEdgeFunction(async (input) => {
      const url = String(input)
      if (url.endsWith('/auth/v1/user')) {
        return jsonResponse({ id: 'user-1' })
      }
      throw new Error(`Unexpected fetch call: ${url}`)
    })

    const response = await handler(new Request('https://example.com', {
      method: 'POST',
      headers: {
        'authorization': 'Bearer token',
        'Content-Type': 'application/json',
      },
      body: '{bad json',
    }))

    const payload = await parseJson(response)
    expect(response.status).toBe(400)
    expect(payload.error).toBe('Invalid JSON body.')
  })

  it('returns 400 when Play says subscription is not active/acknowledged', async () => {
    const { handler } = await setupEdgeFunction(async (input) => {
      const url = String(input)

      if (url.endsWith('/auth/v1/user')) {
        return jsonResponse({ id: 'user-1' })
      }
      if (url === 'https://oauth2.googleapis.com/token') {
        return jsonResponse({ access_token: 'google-access-token' })
      }
      if (url.includes('androidpublisher.googleapis.com')) {
        return jsonResponse({
          expiryTimeMillis: String(Date.now() + 60_000),
          paymentState: 0,
          acknowledgementState: 1,
        })
      }

      throw new Error(`Unexpected fetch call: ${url}`)
    })

    const response = await handler(new Request('https://example.com', {
      method: 'POST',
      headers: {
        'authorization': 'Bearer token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        purchaseToken: 'purchase-token',
        subscriptionId: 'sub-id',
      }),
    }))

    const payload = await parseJson(response)
    expect(response.status).toBe(400)
    expect(payload.valid).toBe(false)
    expect(payload.error).toBe('Subscription is not active or not acknowledged.')
  })

  it('returns ok and updates metadata when purchase is valid', async () => {
    const { handler, fetchMock } = await setupEdgeFunction(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/auth/v1/user')) {
        return jsonResponse({ id: 'user-1' })
      }
      if (url === 'https://oauth2.googleapis.com/token') {
        return jsonResponse({ access_token: 'google-access-token' })
      }
      if (url.includes('androidpublisher.googleapis.com')) {
        return jsonResponse({
          expiryTimeMillis: String(Date.now() + 60_000),
          paymentState: 1,
          acknowledgementState: 1,
        })
      }
      if (url.endsWith('/auth/v1/admin/users/user-1') && !init?.method) {
        return jsonResponse({ app_metadata: { existing: true } })
      }
      if (url.endsWith('/auth/v1/admin/users/user-1') && init?.method === 'PUT') {
        return jsonResponse({ ok: true })
      }
      if (url.endsWith('/rest/v1/play_subscription_user')) {
        return jsonResponse({ ok: true }, 201)
      }

      throw new Error(`Unexpected fetch call: ${url}`)
    })

    const response = await handler(new Request('https://example.com', {
      method: 'POST',
      headers: {
        'authorization': 'Bearer token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        purchaseToken: 'purchase-token',
        subscriptionId: 'sub-id',
      }),
    }))

    const payload = await parseJson(response)
    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)

    const metadataUpdateCall = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).endsWith('/auth/v1/admin/users/user-1')
        && init?.method === 'PUT',
    )

    expect(metadataUpdateCall).toBeTruthy()
    const updateBody = JSON.parse(String(metadataUpdateCall?.[1]?.body)) as Record<string, unknown>
    const appMetadata = updateBody.app_metadata as Record<string, unknown>

    expect(appMetadata.existing).toBe(true)
    expect(appMetadata.is_pro).toBe(true)
    expect(appMetadata.subscription_source).toBe('play')
    expect(appMetadata.play_subscription_token).toBe('purchase-token')
    expect(appMetadata.play_subscription_id).toBe('sub-id')
  })

  it('returns 502 when Google token request fails', async () => {
    const { handler } = await setupEdgeFunction(async (input) => {
      const url = String(input)
      if (url.endsWith('/auth/v1/user')) {
        return jsonResponse({ id: 'user-1' })
      }
      if (url === 'https://oauth2.googleapis.com/token') {
        return textResponse('bad credentials', 401)
      }
      throw new Error(`Unexpected fetch call: ${url}`)
    })

    const response = await handler(new Request('https://example.com', {
      method: 'POST',
      headers: {
        'authorization': 'Bearer token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        purchaseToken: 'purchase-token',
        subscriptionId: 'sub-id',
      }),
    }))

    const payload = await parseJson(response)
    expect(response.status).toBe(502)
    expect(String(payload.error)).toContain('Google token error: 401 bad credentials')
  })
})
