import React, { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import type { Session } from '@supabase/supabase-js'
import { useAuth } from '../useAuth'

type AuthChangeCallback = (event: string, session: Session | null) => void

const getSessionMock = vi.fn()
const onAuthStateChangeMock = vi.fn()
const signInWithPasswordMock = vi.fn()
const signUpMock = vi.fn()
const signInAnonymouslyMock = vi.fn()
const signOutMock = vi.fn()
const refreshSessionMock = vi.fn()
const unsubscribeMock = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => getSessionMock(...args),
      onAuthStateChange: (...args: unknown[]) => onAuthStateChangeMock(...args),
      signInWithPassword: (...args: unknown[]) => signInWithPasswordMock(...args),
      signUp: (...args: unknown[]) => signUpMock(...args),
      signInAnonymously: (...args: unknown[]) => signInAnonymouslyMock(...args),
      signOut: (...args: unknown[]) => signOutMock(...args),
      refreshSession: (...args: unknown[]) => refreshSessionMock(...args),
    },
  },
}))

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type HookValue = ReturnType<typeof useAuth>

describe('useAuth', () => {
  let container: HTMLDivElement
  let root: Root
  let latest: HookValue | null
  let authCallback: AuthChangeCallback | null

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    latest = null
    authCallback = null

    getSessionMock.mockReset()
    onAuthStateChangeMock.mockReset()
    signInWithPasswordMock.mockReset()
    signUpMock.mockReset()
    signInAnonymouslyMock.mockReset()
    signOutMock.mockReset()
    refreshSessionMock.mockReset()
    unsubscribeMock.mockReset()
    vi.mocked(toast.error).mockReset()

    getSessionMock.mockResolvedValue({ data: { session: null } })
    onAuthStateChangeMock.mockImplementation((cb: AuthChangeCallback) => {
      authCallback = cb
      return { data: { subscription: { unsubscribe: unsubscribeMock } } }
    })
    signInWithPasswordMock.mockResolvedValue({ error: null })
    signUpMock.mockResolvedValue({ error: null })
    signInAnonymouslyMock.mockResolvedValue({ error: null })
    signOutMock.mockResolvedValue({ error: null })
    refreshSessionMock.mockResolvedValue({ data: { session: null }, error: null })
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
  })

  const renderHook = async () => {
    function Harness() {
      const value = useAuth()
      useEffect(() => {
        latest = value
      }, [value])
      return null
    }

    await act(async () => {
      root.render(<Harness />)
    })
  }

  it('initializes with current session and marks authInitialized', async () => {
    const session = { user: { id: 'user-1' } } as Session
    getSessionMock.mockResolvedValueOnce({ data: { session } })
    refreshSessionMock.mockResolvedValue({ data: { session }, error: null })

    await renderHook()

    expect(latest?.authInitialized).toBe(true)
    expect(latest?.session?.user.id).toBe('user-1')
    expect(onAuthStateChangeMock).toHaveBeenCalledTimes(1)
  })

  it('ignores null auth events except SIGNED_OUT', async () => {
    const session = { user: { id: 'user-1' } } as Session
    getSessionMock.mockResolvedValueOnce({ data: { session } })
    refreshSessionMock.mockResolvedValue({ data: { session }, error: null })

    await renderHook()
    expect(latest?.session?.user.id).toBe('user-1')
    expect(authCallback).toBeTypeOf('function')

    await act(async () => {
      authCallback?.('TOKEN_REFRESHED', null)
    })
    expect(latest?.session?.user.id).toBe('user-1')

    await act(async () => {
      authCallback?.('SIGNED_OUT', null)
    })
    expect(latest?.session).toBeNull()
  })

  it('shows toast on signIn error and leaves authError null', async () => {
    await renderHook()
    signInWithPasswordMock.mockResolvedValueOnce({ error: { message: 'Invalid credentials' } })

    await act(async () => {
      await latest?.signIn('user@example.com', 'bad-pass')
    })

    expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Invalid credentials')
    expect(latest?.authLoading).toBe(false)
    expect(latest?.authError).toBeNull()
  })

  it('refreshes session immediately and on visibility change when logged in', async () => {
    vi.useFakeTimers()
    const session = { user: { id: 'user-1' } } as Session
    getSessionMock.mockResolvedValueOnce({ data: { session } })
    refreshSessionMock.mockResolvedValue({ data: { session }, error: null })

    await renderHook()

    expect(refreshSessionMock).toHaveBeenCalledTimes(1)

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(refreshSessionMock).toHaveBeenCalledTimes(2)

    await act(async () => {
      vi.advanceTimersByTime(30 * 60 * 1000)
    })
    expect(refreshSessionMock).toHaveBeenCalledTimes(3)
    vi.useRealTimers()
  })
})
