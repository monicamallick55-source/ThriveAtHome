// Server-side auth helpers — getCurrentUser, getUserRole, requireAuth.
import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'
import { createAdminClient } from './supabase/admin'

export type UserRole = 'family' | 'navigator' | 'admin' | 'volunteer' | 'student' | 'university_admin' | 'employer_admin' | 'agency_admin' | 'aaa_admin' | 'org_admin' | 'senior_center_admin' | 'network_admin' | 'member' | 'care_worker' | 'vso_admin' | 'school_admin'

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
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('family_members')
    .select('role')
    .eq('supabase_auth_id', authUserId)
    .single()
  if (error || !data) return null
  return data.role as UserRole
}

/**
 * Returns the currently authenticated user's role, or null.
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser()
  if (!user) return null
  return getUserRole(user.id)
}

/**
 * Redirect to /login if no session, return user otherwise.
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

/**
 * Redirect to /login if no session, redirect to / if role not in allowed list.
 */
export async function requireRole(...allowed: UserRole[]) {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (!role || !allowed.includes(role)) redirect('/')
  return { user, role }
}
