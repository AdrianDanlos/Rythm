import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { useAuthActions } from '../useAuthActions'
import { supabase } from '../../lib/supabaseClient'
import { Capacitor } from '@capacitor/core'
import { SocialLogin } from '@capgo/capacitor-social-login'

const setAuthError = vi.fn()
const signIn = vi.fn()
const signUp = vi.fn()
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

const { supabaseAuthMock } = vi.hoisted(() => ({
  supabaseAuthMock: {
    linkIdentity: vi.fn(),
    signInWithOAuth: vi.fn(),
    signInWithIdToken: vi.fn(),
  },
}))

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    auth: supabaseAuthMock,
  },
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
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
  signInAnonymously,
  setAuthError,
  ...overrides,
})

describe('useAuthActions', () => {
  beforeEach(() => {
    setAuthError.mockReset()
    signIn.mockReset()
    signUp.mockReset()
    signInAnonymously.mockReset()

    supabaseAuthMock.linkIdentity.mockReset()
    supabaseAuthMock.signInWithOAuth.mockReset()
    supabaseAuthMock.signInWithIdToken.mockReset()

    vi.mocked(Capacitor.isNativePlatform).mockReset()
    vi.mocked(SocialLogin.initialize).mockReset()
    vi.mocked(SocialLogin.login).mockReset()
    vi.mocked(toast.error).mockReset()

    signIn.mockResolvedValue({ error: null })
    signUp.mockResolvedValue({ error: null })
    signInAnonymously.mockResolvedValue({ error: null })
    supabaseAuthMock.linkIdentity.mockResolvedValue({ error: null })
    supabaseAuthMock.signInWithOAuth.mockResolvedValue({ error: null })
    supabaseAuthMock.signInWithIdToken.mockResolvedValue({ error: null })
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
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

  it('uses OAuth web flow when not native', async () => {
    const { handleGoogleSignIn } = useAuthActions(makeParams())

    await handleGoogleSignIn()

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
    expect(supabase.auth.linkIdentity).not.toHaveBeenCalled()
  })

  it('uses linkIdentity in web flow when session is anonymous', async () => {
    const anonymousSession = { user: { is_anonymous: true } } as Session
    const { handleGoogleSignIn } = useAuthActions(makeParams({ session: anonymousSession }))

    await handleGoogleSignIn()

    expect(supabase.auth.linkIdentity).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
    expect(supabase.auth.signInWithOAuth).not.toHaveBeenCalled()
  })

  it('uses native id-token flow when on native platform', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    vi.mocked(SocialLogin.login).mockResolvedValue({
      result: {
        responseType: 'online',
        idToken: 'native-id-token',
      },
    })

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

    const { handleGoogleSignIn } = useAuthActions(makeParams())
    await handleGoogleSignIn()

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
      token: 'native-id-token',
      nonce: expect.any(String),
    })
    vi.unstubAllGlobals()
  })

  it('shows toast when native Google login does not return id token', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    vi.mocked(SocialLogin.login).mockResolvedValue({
      result: {
        responseType: 'online',
      },
    })
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
})
