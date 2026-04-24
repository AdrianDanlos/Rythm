import { createClient } from '@supabase/supabase-js'
import { capturePasswordRecoveryFlagFromUrl } from './authCallbackUrl'

if (typeof window !== 'undefined') {
  // Before createClient: detectSessionInUrl would otherwise strip the hash before we can read `type=recovery`.
  capturePasswordRecoveryFlagFromUrl()
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'rythm-auth',
  },
})
