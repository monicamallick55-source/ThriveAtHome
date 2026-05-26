import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth, getUserRole } from '@/lib/auth'
import { getPendingMatchRequests } from '@/lib/data/volunteers'
import { AdminVolunteerMatching } from '@/components/admin/AdminVolunteerMatching'

export const metadata: Metadata = { title: 'Volunteer Matching — Admin' }

export default async function AdminVolunteerMatchingPage() {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (role !== 'admin' && role !== 'navigator') redirect('/dashboard')

  const { data: pendingMembers, error } = await getPendingMatchRequests()

  const members = (pendingMembers ?? []).map(r => r.member)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: 'var(--color-navy)', height: '64px', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px', width: '100%', display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a href="/admin" style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(250,250,245,0.75)', textDecoration: 'none' }}>← Admin</a>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500 }}>Volunteer Matching</span>
        </div>
      </nav>

      <header style={{ backgroundColor: 'var(--color-navy)', padding: '24px 0 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', color: 'var(--color-cream)', fontWeight: 500, marginBottom: '8px' }}>
            Match volunteers to members
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'rgba(250,250,245,0.7)' }}>
            Review suggested matches and confirm pairings. Matches are scored by location, interests, and language.
          </p>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', padding: '32px', width: '100%' }}>
        {error ? (
          <div style={{ padding: '24px', backgroundColor: '#FFF0F0', border: '1.5px solid var(--color-urgent-border)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-urgent-text)' }}>
            Failed to load pending requests: {error}
          </div>
        ) : (
          <AdminVolunteerMatching pendingMembers={members} />
        )}
      </main>
    </div>
  )
}
