// Server-side auth helpers — getCurrentUser, getUserRole, requireAuth.
import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'
import { createAdminClient } from './supabase/admin'

export type UserRole = 'family' | 'navigator' | 'admin' | 'volunteer' | 'student' | 'university_admin' | 'employer_admin' | 'agency_admin' | 'aaa_admin' | 'org_admin' | 'senior_center_admin' | 'network_admin'

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
 * True if the user should be treated as a navigator or an admin.
 *
 * Navigator accounts are identified by their `care_navigators.supabase_auth_id`
 * row, which is the source of truth. The `family_members.role` column is often
 * unset for navigator logins, so a plain `getUserRole()` check wrongly returns
 * 403 "Forbidden" for a real navigator. This helper checks both.
 */
export async function isNavigatorOrAdmin(authUserId: string): Promise<boolean> {
  const role = await getUserRole(authUserId)
  if (role === 'admin' || role === 'navigator') return true
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('care_navigators')
    .select('id')
    .eq('supabase_auth_id', authUserId)
    .maybeSingle()
  if (error) console.error('[auth/isNavigatorOrAdmin]', error)
  return Boolean(data)
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

/**
 * Returns every role a Supabase auth user holds. Most people have exactly one.
 * A user can legitimately hold several — e.g. a navigator who is also a volunteer,
 * or a staff member who also has a family dashboard. Checks each role's source of
 * truth table so nothing is missed.
 */
export async function getAllRolesForAuth(authUserId: string): Promise<UserRole[]> {
  const admin = createAdminClient()
  const db = admin as any
  const roles = new Set<UserRole>()

  const { data: fm } = await db.from('family_members')
    .select('role').eq('supabase_auth_id', authUserId).maybeSingle()
  if (fm?.role) roles.add(fm.role as UserRole)

  // Direct senior login (members.supabase_auth_id) → treated as a family portal user.
  const { data: memberRow } = await db.from('members')
    .select('id').eq('supabase_auth_id', authUserId).maybeSingle()
  if (memberRow) roles.add('family')

  const { data: nav } = await db.from('care_navigators')
    .select('id').eq('supabase_auth_id', authUserId).maybeSingle()
  if (nav) roles.add('navigator')

  const { data: vol } = await db.from('volunteers')
    .select('id').eq('supabase_auth_id', authUserId).maybeSingle()
  if (vol) roles.add('volunteer')

  const { data: stu } = await db.from('student_volunteers')
    .select('id').eq('supabase_auth_id', authUserId).maybeSingle()
  if (stu) roles.add('student')

  return [...roles]
}
