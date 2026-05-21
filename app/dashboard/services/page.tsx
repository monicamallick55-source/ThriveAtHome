// Placeholder for Services Marketplace — built in M17.
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Services — ThriveAtHome' }

export default function ServicesPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: 'white', borderBottom: '1px solid var(--color-warm-grey)', boxShadow: 'var(--shadow-sm)', height: '64px', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 500, color: 'var(--color-text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ← Dashboard
          </Link>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', fontWeight: 500 }}>ThriveAtHome</span>
          <div style={{ width: '120px' }} aria-hidden="true" />
        </div>
      </nav>
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 32px' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '42px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px', letterSpacing: '-0.01em' }}>
            Services
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '20px', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
            Local services marketplace for seniors is coming soon.
          </p>
        </div>
      </main>
    </div>
  )
}
