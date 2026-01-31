import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authInitialized, setAuthInitialized] = useState(false)

  useEffect(() => {
    let isMounted = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return
        setSession(data.session ?? null)
        setAuthInitialized(true)
      })
      .catch(() => {
        if (!isMounted) return
        setAuthInitialized(true)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return
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
    signIn,
    signUp,
    signOut,
    refreshSession,
    setAuthError,
  }
}
