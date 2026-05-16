// Browser-side Supabase client — safe to use in Client Components and hooks.
import { createBrowserClient } from '@supabase/ssr'
import { requireEnv } from '../env'

export function createClient() {
  return createBrowserClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  )
}
