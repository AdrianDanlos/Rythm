import type { Session } from '@supabase/supabase-js'

/** True for email accounts that have not completed the confirmation link flow. */
export function needsEmailVerification(session: Session | null): boolean {
  const user = session?.user
  if (!user?.email || user.is_anonymous) {
    return false
  }
  return user.email_confirmed_at == null
}
