import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth, getUserRole } from '@/lib/auth'
import { getVolunteerApplications } from '@/lib/data/volunteers'
import { AdminVolunteerQueue } from '@/components/admin/AdminVolunteerQueue'

export const metadata: Metadata = { title: 'Volunteer Applications — Admin' }

export default async function AdminVolunteersPage() {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (role !== 'admin') redirect('/dashboard')

  const [{ data: pending, error: pendingError }, { data: bgCheck, error: bgError }] = await Promise.all([
    getVolunteerApplications('pending'),
    getVolunteerApplications('background_check'),
  ])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: 'var(--color-navy)', height: '64px', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px', width: '100%', display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a href="/admin" style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(250,250,245,0.75)', textDecoration: 'none' }}>← Admin</a>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500 }}>Volunteer Applications</span>
        </div>
      </nav>

      <header style={{ backgroundColor: 'var(--color-navy)', padding: '24px 0 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', color: 'var(--color-cream)', fontWeight: 500, marginBottom: '8px' }}>
            Volunteer Applications
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'rgba(250,250,245,0.7)' }}>
            Review applications, run background checks, and activate volunteers
          </p>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', padding: '32px', width: '100%' }}>
        {/* Background check queue — shown first so admins don't forget to activate */}
        {(bgCheck && bgCheck.length > 0) && (
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--color-navy)', fontWeight: 500, margin: 0 }}>
                Background Check Complete
              </h2>
              <span style={{ padding: '3px 12px', backgroundColor: '#EBF0FF', color: '#2A5298', borderRadius: '999px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600 }}>
                {bgCheck.length} ready to activate
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
              These volunteers have been approved and are awaiting background check clearance. Click <strong>Activate</strong> once you have verified their background check passed.
            </p>
            <AdminVolunteerQueue applications={bgCheck} mode="background_check" />
          </div>
        )}

        {/* Pending applications */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--color-navy)', fontWeight: 500, marginBottom: '20px' }}>
            Pending Applications
          </h2>
          {pendingError ? (
            <div style={{ padding: '24px', backgroundColor: '#FFF0F0', border: '1.5px solid var(--color-urgent-border)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-urgent-text)' }}>
              Failed to load applications: {pendingError}
            </div>
          ) : (
            <AdminVolunteerQueue applications={pending ?? []} mode="pending" />
          )}
        </div>
      </main>
    </div>
  )
}
