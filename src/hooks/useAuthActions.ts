import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { t } from 'i18next'
import { toast } from 'sonner'
import { SocialLogin } from '@capgo/capacitor-social-login'
import { supabase } from '../lib/supabaseClient'

type UseAuthActionsParams = {
  session: Session | null
  authMode: 'signin' | 'signup'
  authEmail: string
  authPassword: string
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>
  completePasswordRecovery: (newPassword: string) => Promise<{ error: Error | null }>
  signInAnonymously: () => Promise<{ error: Error | null }>
  setAuthError: (value: string | null) => void
}

export const useAuthActions = ({
  session,
  authMode,
  authEmail,
  authPassword,
  signIn,
  signUp,
  resetPasswordForEmail,
  completePasswordRecovery,
  signInAnonymously,
  setAuthError,
}: UseAuthActionsParams) => {
  const handleAuth = async (event: FormEvent) => {
    event.preventDefault()
    setAuthError(null)

    try {
      if (authMode === 'signup') {
        const { error } = await signUp(authEmail, authPassword)
        if (error) throw error
      }
      else {
        const { error } = await signIn(authEmail, authPassword)
        if (error) throw error
      }
    }
    catch {
      setAuthError(null)
    }
  }

  const handleTryWithoutAccount = async () => {
    setAuthError(null)
    try {
      const { error } = await signInAnonymously()
      if (error) throw error
    }
    catch {
      setAuthError(null)
    }
  }

  const handleForgotPassword = async (event: FormEvent) => {
    event.preventDefault()
    setAuthError(null)
    try {
      const { error } = await resetPasswordForEmail(authEmail.trim())
      if (error) throw error
    }
    catch {
      setAuthError(null)
    }
  }

  const handleSetNewPassword = async (event: FormEvent, newPassword: string) => {
    event.preventDefault()
    setAuthError(null)
    try {
      const { error } = await completePasswordRecovery(newPassword)
      if (error) throw error
    }
    catch {
      setAuthError(null)
    }
  }

  const handleGoogleSignIn = async () => {
    setAuthError(null)
    const linkGoogleToCurrentUser = Boolean(session?.user?.is_anonymous)

    try {
      await SocialLogin.initialize({
        google: {
          webClientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID,
          mode: 'online',
        },
      })

      const { rawNonce, nonceDigest } = await (async () => {
        const array = new Uint8Array(32)
        crypto.getRandomValues(array)
        const raw = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
        const encoder = new TextEncoder()
        const data = encoder.encode(raw)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const digest = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        return { rawNonce: raw, nonceDigest: digest }
      })()

      const response = await SocialLogin.login({
        provider: 'google',
        options: {
          scopes: ['email', 'profile'],
          nonce: nonceDigest,
        },
      })

      type GoogleLoginResponseOnline = {
        result: {
          responseType: 'online'
          idToken?: string
        }
      }

      const onlineResult = (response as GoogleLoginResponseOnline).result

      if (!onlineResult || onlineResult.responseType !== 'online') {
        throw new Error('Google login did not return an online response')
      }

      const { idToken } = onlineResult

      if (!idToken) {
        throw new Error('No ID token returned from Google')
      }

      const { error } = linkGoogleToCurrentUser
        ? await supabase.auth.linkIdentity({
            provider: 'google',
            token: idToken,
            nonce: rawNonce,
          })
        : await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: idToken,
            nonce: rawNonce,
          })

      if (error) {
        throw error
      }
    }
    catch (error) {
      console.error('Google sign-in failed', error)
      const message = error instanceof Error ? error.message : String(error)
      toast.error(`${t('errors.googleSignInStartFailed')}: ${message}`)
      setAuthError(null)
    }
  }

  return {
    handleAuth,
    handleGoogleSignIn,
    handleTryWithoutAccount,
    handleForgotPassword,
    handleSetNewPassword,
  }
}
