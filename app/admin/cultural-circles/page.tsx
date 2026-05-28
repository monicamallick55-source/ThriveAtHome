import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAuth, getUserRole } from '@/lib/auth'
import { getAllCircles } from '@/lib/data/circles'
import AdminCirclesClient from '@/components/admin/AdminCirclesClient'

export const metadata: Metadata = { title: 'Communities Admin — ThriveAtHome' }

export default async function AdminCulturalCirclesPage() {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (role !== 'admin' && role !== 'navigator') redirect('/dashboard')

  const circles = await getAllCircles()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 40, backgroundColor: 'white',
        borderBottom: '1px solid var(--color-warm-grey)', boxShadow: 'var(--shadow-sm)',
        height: '64px', display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto', padding: '0 24px', width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link href="/navigator" style={{
            fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 500,
            color: 'var(--color-text-secondary)', textDecoration: 'none',
          }}>
            ← Navigator Console
          </Link>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '22px',
            color: 'var(--color-navy)', fontWeight: 500,
          }}>ThriveAtHome</span>
          <div style={{ width: '160px' }} aria-hidden="true" />
        </div>
      </nav>

      <AdminCirclesClient circles={circles} />
    </div>
  )
}
