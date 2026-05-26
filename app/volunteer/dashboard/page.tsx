import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth'
import { getVolunteerByAuthId, getVolunteerMatchedMembers, getVolunteerVisits, getVolunteerMembersHelpedCount } from '@/lib/data/volunteers'
import { VolunteerDashboard } from '@/components/volunteer/VolunteerDashboard'

export const metadata: Metadata = { title: 'Volunteer Dashboard — ThriveAtHome' }

export default async function VolunteerDashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { data: volunteer, error: volError } = await getVolunteerByAuthId(user.id)
  if (volError || !volunteer) redirect('/login')
  if (volunteer.status !== 'active') {
    // Volunteer exists but is not yet active — show pending message
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', color: 'var(--color-navy)', fontWeight: 500, marginBottom: '16px' }}>
            Application under review
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
            Your volunteer application is being reviewed. You&apos;ll receive an email once your background check is cleared and your account is activated.
          </p>
        </div>
      </div>
    )
  }

  const [{ data: matchedMembers }, { data: recentVisits }, membersHelpedCount] = await Promise.all([
    getVolunteerMatchedMembers(volunteer.id),
    getVolunteerVisits(volunteer.id, 20),
    getVolunteerMembersHelpedCount(volunteer.id),
  ])

  return (
    <VolunteerDashboard
      volunteer={volunteer}
      matchedMembers={matchedMembers ?? []}
      recentVisits={recentVisits ?? []}
      membersHelpedCount={membersHelpedCount}
    />
  )
}
