import { PASSWORD_RECOVERY_PENDING_DOM_EVENT, PASSWORD_RECOVERY_SESSION_STORAGE_KEY } from './authCallbackUrl'
import { supabase } from './supabaseClient'

/**
 * Apply Supabase session from a redirect URL (hash fragment with access_token / refresh_token).
 * Used after password recovery and magic-link flows on native (appUrlOpen / cold start).
 * `setSession` does not emit `PASSWORD_RECOVERY` like the web flow, so we flag recovery from `type=recovery`.
 */
export function applySupabaseSessionFromAuthUrl(url: string): void {
  if (!url) return
  const hashIdx = url.indexOf('#')
  const fragment = hashIdx >= 0 ? url.slice(hashIdx + 1) : ''
  const params = new URLSearchParams(fragment)
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  if (accessToken && refreshToken) {
    const isRecovery = params.get('type') === 'recovery'
    if (isRecovery) {
      try {
        sessionStorage.setItem(PASSWORD_RECOVERY_SESSION_STORAGE_KEY, '1')
      }
      catch {
        // ignore
      }
    }
    void supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    }).then(() => {
      if (isRecovery && typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new CustomEvent(PASSWORD_RECOVERY_PENDING_DOM_EVENT))
        }
        catch {
          // ignore
        }
      }
    })
  }
}
