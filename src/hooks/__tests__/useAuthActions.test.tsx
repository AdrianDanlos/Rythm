import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { useAuthActions } from '../useAuthActions'
import { supabase } from '../../lib/supabaseClient'
import { SocialLogin } from '@capgo/capacitor-social-login'

const setAuthError = vi.fn()
const signIn = vi.fn()
const signUp = vi.fn()
const resetPasswordForEmail = vi.fn()
const completePasswordRecovery = vi.fn()
const signInAnonymously = vi.fn()

vi.mock('i18next', () => ({
  t: (key: string) => key,
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

const { supabaseAuthMock, mockIsNativePlatform } = vi.hoisted(() => ({
  supabaseAuthMock: {
    linkIdentity: vi.fn(),
    signInWithIdToken: vi.fn(),
    signInWithOAuth: vi.fn(),
  },
  mockIsNativePlatform: vi.fn(() => true),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => mockIsNativePlatform(),
  },
}))

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    auth: supabaseAuthMock,
  },
}))

vi.mock('@capgo/capacitor-social-login', () => ({
  SocialLogin: {
    initialize: vi.fn(),
    login: vi.fn(),
  },
}))

const makeParams = (overrides?: Partial<Parameters<typeof useAuthActions>[0]>) => ({
  session: null as Session | null,
  authMode: 'signin' as const,
  authEmail: 'user@example.com',
  authPassword: 'secret',
  signIn,
  signUp,
  resetPasswordForEmail,
  completePasswordRecovery,
  signInAnonymously,
  setAuthError,
  ...overrides,
})

async function setupGoogleSignInTest() {
  vi.mocked(SocialLogin.login).mockResolvedValue({
    result: {
      responseType: 'online',
      idToken: 'test-id-token',
    },
  } as Awaited<ReturnType<typeof SocialLogin.login>>)

  const digestBuffer = Uint8Array.from({ length: 32 }, (_, index) => index + 1).buffer
  vi.stubGlobal('crypto', {
    getRandomValues: (array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = i + 1
      }
      return array
    },
    subtle: {
      digest: vi.fn(async () => digestBuffer),
    },
  })
}

describe('useAuthActions', () => {
  beforeEach(() => {
    setAuthError.mockReset()
    signIn.mockReset()
    signUp.mockReset()
    resetPasswordForEmail.mockReset()
    completePasswordRecovery.mockReset()
    signInAnonymously.mockReset()

    mockIsNativePlatform.mockReturnValue(true)
    supabaseAuthMock.linkIdentity.mockReset()
    supabaseAuthMock.signInWithIdToken.mockReset()
    supabaseAuthMock.signInWithOAuth.mockReset()

    vi.mocked(SocialLogin.initialize).mockReset()
    vi.mocked(SocialLogin.login).mockReset()
    vi.mocked(toast.error).mockReset()

    signIn.mockResolvedValue({ error: null })
    signUp.mockResolvedValue({ error: null, needsEmailConfirmation: false })
    resetPasswordForEmail.mockResolvedValue({ error: null })
    completePasswordRecovery.mockResolvedValue({ error: null })
    signInAnonymously.mockResolvedValue({ error: null })
    supabaseAuthMock.linkIdentity.mockResolvedValue({ data: { url: 'https://auth.example' }, error: null })
    supabaseAuthMock.signInWithIdToken.mockResolvedValue({ error: null })
    supabaseAuthMock.signInWithOAuth.mockResolvedValue({ data: { provider: 'google' }, error: null })
  })

  it('handles signup mode with signUp', async () => {
    const { handleAuth } = useAuthActions(makeParams({ authMode: 'signup' }))
    const event = { preventDefault: vi.fn() } as unknown as FormEvent

    await handleAuth(event)

    expect(event.preventDefault).toHaveBeenCalledTimes(1)
    expect(signUp).toHaveBeenCalledWith('user@example.com', 'secret')
    expect(signIn).not.toHaveBeenCalled()
  })

  it('handles guest flow via signInAnonymously', async () => {
    const { handleTryWithoutAccount } = useAuthActions(makeParams())

    await handleTryWithoutAccount()

    expect(setAuthError).toHaveBeenCalledWith(null)
    expect(signInAnonymously).toHaveBeenCalledTimes(1)
  })

  it('uses Social Login + id token flow for Google sign-in', async () => {
    await setupGoogleSignInTest()
    const { handleGoogleSignIn } = useAuthActions(makeParams())

    await handleGoogleSignIn()
    vi.unstubAllGlobals()

    expect(SocialLogin.initialize).toHaveBeenCalledTimes(1)
    expect(SocialLogin.login).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        scopes: ['email', 'profile'],
        nonce: expect.any(String),
      },
    })
    expect(supabase.auth.signInWithIdToken).toHaveBeenCalledWith({
      provider: 'google',
      token: 'test-id-token',
      nonce: expect.any(String),
    })
    expect(supabase.auth.linkIdentity).not.toHaveBeenCalled()
  })

  it('uses linkIdentity when session is anonymous', async () => {
    await setupGoogleSignInTest()
    const anonymousSession = { user: { is_anonymous: true } } as Session
    const { handleGoogleSignIn } = useAuthActions(makeParams({ session: anonymousSession }))

    await handleGoogleSignIn()
    vi.unstubAllGlobals()

    expect(supabase.auth.linkIdentity).toHaveBeenCalledWith({
      provider: 'google',
      token: 'test-id-token',
      nonce: expect.any(String),
    })
    expect(supabase.auth.signInWithIdToken).not.toHaveBeenCalled()
  })

  it('shows toast when Google login does not return id token', async () => {
    vi.mocked(SocialLogin.login).mockResolvedValue({
      result: {
        responseType: 'online',
      },
    } as Awaited<ReturnType<typeof SocialLogin.login>>)
    vi.stubGlobal('crypto', {
      getRandomValues: (array: Uint8Array) => array,
      subtle: {
        digest: vi.fn(async () => new Uint8Array(32).buffer),
      },
    })

    const { handleGoogleSignIn } = useAuthActions(makeParams())
    await handleGoogleSignIn()

    expect(vi.mocked(toast.error)).toHaveBeenCalled()
    expect(supabase.auth.signInWithIdToken).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('on web, uses signInWithOAuth for Google sign-in', async () => {
    mockIsNativePlatform.mockReturnValue(false)
    vi.stubGlobal('window', {
      ...window,
      location: { origin: 'http://localhost:5173', pathname: '/' },
    })
    const { handleGoogleSignIn } = useAuthActions(makeParams())

    await handleGoogleSignIn()
    vi.unstubAllGlobals()

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:5173',
        queryParams: { prompt: 'select_account' },
      },
    })
    expect(supabase.auth.signInWithIdToken).not.toHaveBeenCalled()
    expect(SocialLogin.initialize).not.toHaveBeenCalled()
  })

  it('on web, uses linkIdentity (OAuth) when session is anonymous', async () => {
    mockIsNativePlatform.mockReturnValue(false)
    vi.stubGlobal('window', {
      ...window,
      location: { origin: 'http://localhost:5173', pathname: '/settings' },
    })
    const anonymousSession = { user: { is_anonymous: true } } as Session
    const { handleGoogleSignIn } = useAuthActions(makeParams({ session: anonymousSession }))

    await handleGoogleSignIn()
    vi.unstubAllGlobals()

    expect(supabase.auth.linkIdentity).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'http://localhost:5173/settings' },
    })
    expect(supabase.auth.signInWithIdToken).not.toHaveBeenCalled()
    expect(SocialLogin.initialize).not.toHaveBeenCalled()
  })
})
