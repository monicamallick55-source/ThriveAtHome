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

  const { data: applications, error } = await getVolunteerApplications('pending')

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
            Pending applications
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'rgba(250,250,245,0.7)' }}>
            Review and process incoming volunteer applications
          </p>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', padding: '32px', width: '100%' }}>
        {error ? (
          <div style={{ padding: '24px', backgroundColor: '#FFF0F0', border: '1.5px solid var(--color-urgent-border)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-urgent-text)' }}>
            Failed to load applications: {error}
          </div>
        ) : (
          <AdminVolunteerQueue applications={applications ?? []} />
        )}
      </main>
    </div>
  )
}
