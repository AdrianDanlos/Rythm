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
