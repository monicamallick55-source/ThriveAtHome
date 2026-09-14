import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import DirectoryClient from '@/components/directory/DirectoryClient'

export const metadata: Metadata = { title: 'Community Directory — ThriveAtHome' }

export default async function DirectoryPage() {
  await requireAuth()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 40, backgroundColor: 'white',
        borderBottom: '1px solid var(--color-warm-grey)', height: '64px', display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 500, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>← Dashboard</Link>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', fontWeight: 500 }}>ThriveAtHome</span>
        </div>
      </nav>

      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>Community Directory</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '28px', lineHeight: 1.6 }}>
          Members of your community organization who have chosen to share a short profile. Listing is always opt-in.
        </p>
        <DirectoryClient />
      </main>
    </div>
  )
}
