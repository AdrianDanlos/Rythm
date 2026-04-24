import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'
import { t } from 'i18next'
import { toast } from 'sonner'
import {
  clearPasswordRecoverySessionFlag,
  isPasswordRecoveryInAuthUrl,
  PASSWORD_RECOVERY_PENDING_DOM_EVENT,
  PASSWORD_RECOVERY_SESSION_STORAGE_KEY,
  readPasswordRecoveryPendingFromStorage,
} from '../lib/authCallbackUrl'
import { supabase } from '../lib/supabaseClient'

/**
 * Password-reset / confirmation emails use this as `redirect_to` after Supabase verifies the link.
 * - **Web:** `window.location.origin` (e.g. dev server or Vercel).
 * - **Native:** Prefer `VITE_AUTH_EMAIL_REDIRECT_ORIGIN`; otherwise the hosted app origin must match
 *   Android App Links in `AndroidManifest` so the **same https URL opens the app** instead of Chrome.
 *   Add that exact URL under Supabase → Authentication → URL Configuration → Redirect URLs.
 */
function getEmailAuthRedirectUrl(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }
  const configured = (import.meta.env.VITE_AUTH_EMAIL_REDIRECT_ORIGIN as string | undefined)
    ?.trim()
  if (configured) {
    return configured.replace(/\/$/, '')
  }
  if (Capacitor.isNativePlatform()) {
    return 'https://rythm-one.vercel.app'
  }
  return window.location.origin
}

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authInitialized, setAuthInitialized] = useState(false)
  const [passwordRecoveryPending, setPasswordRecoveryPending] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return readPasswordRecoveryPendingFromStorage()
      || isPasswordRecoveryInAuthUrl(window.location.search, window.location.hash)
  })

  useEffect(() => {
    const syncFromStorage = () => {
      if (readPasswordRecoveryPendingFromStorage()) {
        setPasswordRecoveryPending(true)
      }
    }
    syncFromStorage()
    if (typeof window === 'undefined') {
      return
    }
    const onPending = () => {
      syncFromStorage()
    }
    window.addEventListener(PASSWORD_RECOVERY_PENDING_DOM_EVENT, onPending)
    return () => {
      window.removeEventListener(PASSWORD_RECOVERY_PENDING_DOM_EVENT, onPending)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return
        if (readPasswordRecoveryPendingFromStorage()) {
          setPasswordRecoveryPending(true)
        }
        setSession(data.session ?? null)
        setAuthInitialized(true)
      })
      .catch(() => {
        if (!isMounted) return
        setAuthInitialized(true)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return

      if (event === 'SIGNED_OUT') {
        clearPasswordRecoverySessionFlag()
        setPasswordRecoveryPending(false)
      }
      if (event === 'PASSWORD_RECOVERY') {
        try {
          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(PASSWORD_RECOVERY_SESSION_STORAGE_KEY, '1')
          }
        }
        catch {
          // ignore
        }
        setPasswordRecoveryPending(true)
      }

      if (!newSession && event !== 'SIGNED_OUT') {
        return
      }
      setSession(newSession)
      setAuthInitialized(true)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setAuthLoading(true)
    setAuthError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      toast.error(error.message ?? 'Unable to authenticate.')
      setAuthError(null)
    }
    setAuthLoading(false)
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    setAuthLoading(true)
    setAuthError(null)
    const redirectTo = getEmailAuthRedirectUrl()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      ...(redirectTo ? { options: { emailRedirectTo: redirectTo } } : {}),
    })
    if (error) {
      toast.error(error.message ?? 'Unable to authenticate.')
      setAuthError(null)
    }
    else if (!data.session) {
      toast.info(t('auth.confirmEmailSent'))
    }
    setAuthLoading(false)
    return {
      error,
      needsEmailConfirmation: Boolean(!error && !data.session),
    }
  }

  const resendVerificationEmail = async (email: string) => {
    const trimmed = email.trim()
    if (!trimmed) {
      return { error: new Error('Missing email') as Error | null }
    }
    setAuthLoading(true)
    setAuthError(null)
    const redirectTo = getEmailAuthRedirectUrl()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: trimmed,
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    })
    if (error) {
      toast.error(error.message ?? t('auth.resendVerificationError'))
    }
    else {
      toast.info(t('auth.confirmEmailSent'))
    }
    setAuthLoading(false)
    return { error }
  }

  const resetPasswordForEmail = async (email: string) => {
    setAuthLoading(true)
    setAuthError(null)
    const redirectTo = getEmailAuthRedirectUrl()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      ...(redirectTo ? { redirectTo } : {}),
    })
    if (error) {
      toast.error(error.message ?? t('auth.resetPasswordEmailError'))
    }
    else {
      toast.info(t('auth.resetPasswordEmailSent'))
    }
    setAuthLoading(false)
    return { error }
  }

  const completePasswordRecovery = async (newPassword: string) => {
    setAuthLoading(true)
    setAuthError(null)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      toast.error(error.message ?? t('auth.setNewPasswordError'))
    }
    else {
      setPasswordRecoveryPending(false)
      clearPasswordRecoverySessionFlag()
      toast.success(t('auth.passwordUpdated'))
      if (typeof window !== 'undefined') {
        window.history.replaceState(
          {},
          '',
          `${window.location.pathname}${window.location.search}`,
        )
      }
    }
    setAuthLoading(false)
    return { error }
  }

  const signInAnonymously = async () => {
    setAuthLoading(true)
    setAuthError(null)
    const { error } = await supabase.auth.signInAnonymously()
    if (error) {
      toast.error(error.message ?? 'Unable to start guest session.')
      setAuthError(null)
    }
    setAuthLoading(false)
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  // Updates the session to get Pro Features after payment is successful
  const refreshSession = useCallback(async () => {
    const { data, error } = await supabase.auth.refreshSession()
    if (!error) {
      setSession(data.session ?? null)
    }
    return { session: data.session ?? null, error }
  }, [])

  // Keep session fresh during long idle/background periods.
  useEffect(() => {
    if (!session?.user?.id) return

    let isMounted = true
    const refreshIfMounted = async () => {
      if (!isMounted) return
      await refreshSession()
    }

    void refreshIfMounted()

    const intervalId = window.setInterval(refreshIfMounted, 30 * 60 * 1000)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshIfMounted()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refreshSession, session?.user?.id])

  return {
    session,
    authLoading,
    authError,
    authInitialized,
    passwordRecoveryPending,
    signIn,
    signUp,
    resetPasswordForEmail,
    completePasswordRecovery,
    signInAnonymously,
    signOut,
    refreshSession,
    resendVerificationEmail,
    setAuthError,
  }
}
