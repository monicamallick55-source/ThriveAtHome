import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth, getUserRole } from '@/lib/auth'
import {
  getOrgForAdmin,
  getOrgPrograms,
  getMemberNeedsForOrg,
  getOrgMemberships,
  getOrgStats,
  getOrgMembershipTiers,
} from '@/lib/data/communityOrgs'
import OrgAdminPortal from '@/components/org/OrgAdminPortal'

export const metadata: Metadata = { title: 'Community Org Admin — ThriveAtHome' }

export default async function OrgAdminPage() {
  const user = await requireAuth()
  const role = await getUserRole(user.id)

  if (role !== 'org_admin' && role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: org, error: orgError } = await getOrgForAdmin(user.id)

  if (orgError || !org) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
        <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500 }}>ThriveAtHome</span>
        </nav>
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 32px' }}>
          <div style={{ textAlign: 'center', maxWidth: '520px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏘️</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>
              Community Organization Portal
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
              Your account is not yet linked to a community organization. Contact ThriveAtHome to set up your organization account.
            </p>
            <p style={{ marginTop: '16px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              In Supabase, set <strong>org_id</strong> on your <strong>family_members</strong> row to activate this portal.
            </p>
          </div>
        </main>
      </div>
    )
  }

  const [programsRes, needsRes, membershipsRes, statsRes, tiersRes] = await Promise.all([
    getOrgPrograms(org.id),
    getMemberNeedsForOrg(org.id),
    getOrgMemberships(org.id),
    getOrgStats(org.id),
    getOrgMembershipTiers(org.id),
  ])

  return (
    <OrgAdminPortal
      org={org}
      programs={programsRes.data}
      memberNeeds={needsRes.data}
      memberships={membershipsRes.data}
      stats={statsRes.data}
      initialTiers={tiersRes.data ?? []}
    />
  )
}
