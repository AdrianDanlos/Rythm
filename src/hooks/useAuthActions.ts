import type { FormEvent } from 'react'
import { Capacitor } from '@capacitor/core'
import { t } from 'i18next'
import { toast } from 'sonner'
import { SocialLogin } from '@capgo/capacitor-social-login'
import { supabase } from '../lib/supabaseClient'

type UseAuthActionsParams = {
  authMode: 'signin' | 'signup'
  authEmail: string
  authPassword: string
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  setAuthError: (value: string | null) => void
}

export const useAuthActions = ({
  authMode,
  authEmail,
  authPassword,
  signIn,
  signUp,
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

  const handleGoogleSignIn = async () => {
    setAuthError(null)

    try {
      if (Capacitor.isNativePlatform()) {
        // Native (Android/iOS): use Capacitor Social Login to get an ID token
        await SocialLogin.initialize({
          google: {
            // These client IDs must match what you configured in Google Cloud / Supabase
            webClientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID,
            // Optionally add iOS client if/when you support it:
            // iOSClientId: import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID,
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

        if (response.provider !== 'google') {
          throw new Error('Unexpected provider returned from Google login')
        }

        const googleResult = response.result
        const idToken = googleResult.responseType === 'online'
          ? googleResult.idToken
          : null

        if (!idToken) {
          throw new Error('No ID token returned from Google')
        }

        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
          nonce: rawNonce,
        })

        if (error) {
          throw error
        }
      }
      else {
        // Web: keep existing browser-based OAuth flow
        const redirectTo = window.location.origin
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
          },
        })
        if (error) {
          throw error
        }
      }
    }
    catch {
      toast.error(t('errors.googleSignInStartFailed'))
      setAuthError(null)
    }
  }

  return {
    handleAuth,
    handleGoogleSignIn,
  }
}
