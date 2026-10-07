import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth, getUserRole } from '@/lib/auth'
import { getUnmatchedBuddyMembers, getActiveBuddyAssignment } from '@/lib/data/buddies'
import { getActiveVolunteers } from '@/lib/data/volunteers'
import { AdminBuddyMatching } from '@/components/admin/AdminBuddyMatching'

export const metadata: Metadata = { title: 'Buddy Matching — Admin' }

export default async function AdminBuddyMatchingPage() {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (role !== 'admin' && role !== 'navigator') redirect('/dashboard')

  const [{ data: unmatchedMembers }, { data: rawVolunteers }] = await Promise.all([
    getUnmatchedBuddyMembers(),
    getActiveVolunteers(),
  ])

  // Normalise volunteers so buddy_capacity / buddy_active_count always exist
  const volunteers = (rawVolunteers ?? []).map((v: any) => ({
    ...v,
    buddy_capacity: (v as unknown as { buddy_capacity?: number }).buddy_capacity ?? 3,
    buddy_active_count: (v as unknown as { buddy_active_count?: number }).buddy_active_count ?? 0,
    buddy_preferences: (v as unknown as { buddy_preferences?: Record<string, unknown> }).buddy_preferences ?? null,
    buddy_bio: (v as unknown as { buddy_bio?: string }).buddy_bio ?? null,
  }))

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: 'var(--color-navy)', height: '64px', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px', width: '100%', display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a href="/admin" style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(250,250,245,0.75)', textDecoration: 'none' }}>← Admin</a>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500 }}>Human Buddy Matching</span>
        </div>
      </nav>

      <header style={{ backgroundColor: 'var(--color-navy)', padding: '24px 0 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', color: 'var(--color-cream)', fontWeight: 500, marginBottom: '8px' }}>
            Assign Human Buddies
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'rgba(250,250,245,0.7)' }}>
            Connect+ and above members waiting for a buddy. Matches scored by location, shared interests, language, and availability.
          </p>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', padding: '32px', width: '100%' }}>
        <AdminBuddyMatching
          unmatchedMembers={unmatchedMembers ?? []}
          volunteers={volunteers as any}
        />
      </main>
    </div>
  )
}
