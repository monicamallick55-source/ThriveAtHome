import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAuth, getUserRole } from '@/lib/auth'
import AdminCreateEventClient from '@/components/events/AdminCreateEventClient'

export const metadata: Metadata = { title: 'Create Event — ThriveAtHome Admin' }

export default async function AdminCreateEventPage() {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (role !== 'admin' && role !== 'navigator') redirect('/dashboard')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 40,
        backgroundColor: 'white', borderBottom: '1px solid var(--color-warm-grey)',
        boxShadow: 'var(--shadow-sm)', height: '64px', display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/admin" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 500, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
            ← Admin
          </Link>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', fontWeight: 500 }}>ThriveAtHome</span>
          <div style={{ width: '80px' }} />
        </div>
      </nav>

      <div style={{ backgroundColor: 'var(--color-navy)', padding: '32px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'white', margin: 0 }}>
            Create Community Event
          </h1>
        </div>
      </div>

      <main style={{ flex: 1, maxWidth: '900px', margin: '0 auto', padding: '32px 24px', width: '100%' }}>
        <AdminCreateEventClient />
      </main>
    </div>
  )
}
