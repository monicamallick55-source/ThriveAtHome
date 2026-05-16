// Server-side auth helpers — getCurrentUser, getUserRole, requireAuth.
import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'
import { createAdminClient } from './supabase/admin'

export type UserRole = 'family' | 'navigator' | 'admin'

/** Returns the current authenticated Supabase user, or null if not signed in. */
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

/**
 * Returns the user_role for the given Supabase auth UUID by querying family_members.
 * Returns null if no matching row is found.
 */
export async function getUserRole(authUserId: string): Promise<UserRole | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('family_members')
    .select('role')
    .eq('supabase_auth_id', authUserId)
    .maybeSingle()
  if (error) console.error('[auth/getUserRole]', error)
  if (!data) return null
  return data.role as UserRole
}

/**
 * Asserts the current user is authenticated.
 * Redirects to /login if not. Returns the auth user on success.
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}
