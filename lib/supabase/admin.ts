// Admin Supabase client — server-only. Bypasses all RLS. Never import in Client Components.
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireServerEnv } from '../env'
import type { Database } from '@/types/database'

let _client: ReturnType<typeof createSupabaseClient<Database>> | null = null

export function createAdminClient() {
  if (!_client) {
    _client = createSupabaseClient<Database>(
      requireServerEnv('NEXT_PUBLIC_SUPABASE_URL'),
      requireServerEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
  }
  return _client
}
