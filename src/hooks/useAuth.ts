import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
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
      setAuthError('Unable to authenticate. Check your details.')
    }
    setAuthLoading(false)
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    setAuthLoading(true)
    setAuthError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) {
      setAuthError('Unable to authenticate. Check your details.')
    }
    setAuthLoading(false)
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return {
    session,
    authLoading,
    authError,
    signIn,
    signUp,
    signOut,
    setAuthError,
  }
}
