// Central role map — the single source of truth for (a) where each role lands
// after login and (b) which roles a given role is allowed to invite.
// Used by the login landing resolver, the /select-role switcher, and the
// invitation API. No server-only imports here so it is safe on the client.

import type { UserRole } from './auth'

/** Every role and the path it should land on after signing in. */
export const ROLE_HOME: Record<UserRole, string> = {
  family: '/dashboard',
  navigator: '/navigator',
  admin: '/admin',
  volunteer: '/volunteer/dashboard',
  student: '/student',
  university_admin: '/university-admin',
  employer_admin: '/employer-admin',
  agency_admin: '/agency-admin',
  aaa_admin: '/aaa-admin',
  org_admin: '/org-admin',
  senior_center_admin: '/senior-center-admin',
  network_admin: '/network-admin',
}

/** Human-readable label for a role, for UI copy. */
export const ROLE_LABEL: Record<UserRole, string> = {
  family: 'Family member',
  navigator: 'Care Navigator',
  admin: 'Platform Admin',
  volunteer: 'Volunteer',
  student: 'Student Volunteer',
  university_admin: 'University Partner Admin',
  employer_admin: 'Employer Admin',
  agency_admin: 'Home-Care Agency Admin',
  aaa_admin: 'Area Agency on Aging Admin',
  org_admin: 'Community Org Admin',
  senior_center_admin: 'Senior Center Admin',
  network_admin: 'Network Admin',
}

/**
 * Which roles each role may invite.
 * Platform admins can invite every staff / partner role.
 * Navigators and community-org admins can invite volunteers into their orbit.
 */
export const INVITABLE_BY: Partial<Record<UserRole, UserRole[]>> = {
  admin: [
    'navigator', 'admin', 'org_admin', 'agency_admin', 'aaa_admin',
    'senior_center_admin', 'network_admin', 'university_admin', 'employer_admin',
    'volunteer',
  ],
  navigator: ['volunteer'],
  org_admin: ['volunteer'],
}

export function roleHome(role: UserRole | null | undefined): string {
  if (!role) return '/dashboard'
  return ROLE_HOME[role] ?? '/dashboard'
}

export function canInvite(inviter: UserRole | null | undefined, target: string): target is UserRole {
  if (!inviter) return false
  return (INVITABLE_BY[inviter] ?? []).includes(target as UserRole)
}
