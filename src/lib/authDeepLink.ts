import { supabase } from './supabaseClient'

/**
 * Apply Supabase session from a redirect URL (hash fragment with access_token / refresh_token).
 * Used after password recovery and magic-link flows on native (appUrlOpen / cold start).
 */
export function applySupabaseSessionFromAuthUrl(url: string): void {
  if (!url) return
  const hashIdx = url.indexOf('#')
  const fragment = hashIdx >= 0 ? url.slice(hashIdx + 1) : ''
  const params = new URLSearchParams(fragment)
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  if (accessToken && refreshToken) {
    void supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  }
}
