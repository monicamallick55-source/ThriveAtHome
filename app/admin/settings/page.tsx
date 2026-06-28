import type { Metadata } from 'next'
import { ReferralPartnersSection } from '@/components/admin/ReferralPartnersSection'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Admin Settings — ThriveAtHome' }

export default function AdminSettingsPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', textDecoration: 'none', fontWeight: 500 }}>
          ThriveAtHome
        </Link>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(250,250,245,0.6)' }}>Admin Settings</span>
      </nav>
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '36px' }}>
          <Link href="/admin" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-teal)', textDecoration: 'none' }}>← Admin Console</Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>Settings</h1>
        </div>
        <ReferralPartnersSection />
      </main>
    </div>
  )
}
