/** `sessionStorage` + event name when recovery must show before Supabase has processed the link (native) or as a backstop. */
export const PASSWORD_RECOVERY_SESSION_STORAGE_KEY = 'rythm-password-recovery-pending'
export const PASSWORD_RECOVERY_PENDING_DOM_EVENT = 'rythm:password-recovery-pending'

/** Set from the URL before `createClient` (see `supabaseClient`) so the fragment is not stripped before we read `type=recovery`. */
export function capturePasswordRecoveryFlagFromUrl(): void {
  if (typeof window === 'undefined') {
    return
  }
  if (isPasswordRecoveryInAuthUrl(window.location.search, window.location.hash)) {
    try {
      sessionStorage.setItem(PASSWORD_RECOVERY_SESSION_STORAGE_KEY, '1')
    }
    catch {
      // ignore
    }
  }
}

export function isPasswordRecoveryInAuthUrl(search: string, hash: string): boolean {
  try {
    for (const raw of [search, hash.startsWith('#') ? hash.slice(1) : hash]) {
      if (!raw) {
        continue
      }
      const s = raw.startsWith('?') ? raw.slice(1) : raw
      const q = new URLSearchParams(s)
      if (q.get('type') === 'recovery') {
        return true
      }
    }
  }
  catch {
    // ignore
  }
  return false
}

export function readPasswordRecoveryPendingFromStorage(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  try {
    return sessionStorage.getItem(PASSWORD_RECOVERY_SESSION_STORAGE_KEY) === '1'
  }
  catch {
    return false
  }
}

export function clearPasswordRecoverySessionFlag(): void {
  if (typeof window === 'undefined') {
    return
  }
  try {
    sessionStorage.removeItem(PASSWORD_RECOVERY_SESSION_STORAGE_KEY)
  }
  catch {
    // ignore
  }
}

/** True while the URL still carries tokens from an OAuth redirect (must not navigate away before Supabase reads them). */
export function hasSupabaseAuthCallbackPayload(search: string, hash: string): boolean {
  try {
    const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
    if (q.has('code') || q.has('error')) {
      return true
    }
    const fragment = hash.startsWith('#') ? hash.slice(1) : hash
    if (!fragment) {
      return false
    }
    if (fragment.includes('access_token') || fragment.includes('error=')) {
      return true
    }
    const hp = new URLSearchParams(fragment)
    return hp.has('access_token') || hp.has('error')
  }
  catch {
    return false
  }
}
