import type { FormEvent } from 'react'
import { Capacitor } from '@capacitor/core'
import { toast } from 'sonner'
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
    const redirectTo = Capacitor.isNativePlatform()
      ? 'capacitor://localhost'
      : window.location.origin
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    })
    if (error) {
      toast.error('Unable to start Google sign-in.')
      setAuthError(null)
    }
  }

  return {
    handleAuth,
    handleGoogleSignIn,
  }
}
