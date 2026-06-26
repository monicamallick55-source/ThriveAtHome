import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth, getUserRole } from '@/lib/auth'
import {
  getAgencyForAdmin,
  getCareWorkersForAgency,
  getUpcomingVisitsForAgency,
  getRecentVisitsForAgency,
  getMembersForAgency,
  getPendingReferralsForAgency,
  getLocationsForAgency,
} from '@/lib/data/agencies'
import AgencyDashboardClient from '@/components/agency/AgencyDashboardClient'

export const metadata: Metadata = { title: 'Agency Admin — ThriveAtHome' }

export default async function AgencyAdminPage() {
  const user = await requireAuth()

  const role = await getUserRole(user.id)
  if (role !== 'agency_admin' && role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: agency, error: agencyError } = await getAgencyForAdmin(user.id)

  if (agencyError || !agency) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
        <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500 }}>ThriveAtHome</span>
        </nav>
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 32px' }}>
          <div style={{ textAlign: 'center', maxWidth: '520px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏠</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>
              Agency Admin Portal
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
              Your account is not yet linked to a care agency. Contact ThriveAtHome to set up your agency account.
            </p>
            <p style={{ marginTop: '16px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              In Supabase, set <strong>agency_id</strong> on your <strong>family_members</strong> row to activate this portal.
            </p>
          </div>
        </main>
      </div>
    )
  }

  const [workersRes, upcomingRes, recentRes, membersRes, referralsRes, locationsRes] = await Promise.all([
    getCareWorkersForAgency(agency.id),
    getUpcomingVisitsForAgency(agency.id),
    getRecentVisitsForAgency(agency.id),
    getMembersForAgency(agency.id),
    getPendingReferralsForAgency(agency.id),
    getLocationsForAgency(agency.id),
  ])

  return (
    <AgencyDashboardClient
      agency={agency}
      workers={workersRes.data ?? []}
      upcomingVisits={upcomingRes.data ?? []}
      recentVisits={recentRes.data ?? []}
      members={membersRes.data ?? []}
      pendingReferrals={referralsRes.data ?? []}
      initialLocations={locationsRes.data ?? []}
    />
  )
}
