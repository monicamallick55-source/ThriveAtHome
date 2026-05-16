// Admin Supabase client — server-only. Bypasses all RLS. Never import in Client Components.
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireServerEnv } from '../env'

let _client: ReturnType<typeof createSupabaseClient> | null = null

export function createAdminClient() {
  if (!_client) {
    _client = createSupabaseClient(
      requireServerEnv('NEXT_PUBLIC_SUPABASE_URL'),
      requireServerEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
  }
  return _client
}
