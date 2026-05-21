// Placeholder for Concierge Line — built in M9.
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Concierge Line — ThriveAtHome' }

export default function ConciergePage() {
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
            Concierge Line
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '20px', color: 'var(--color-text-secondary)', lineHeight: 1.65, marginBottom: '32px' }}>
            Our concierge team is here to help. This feature is coming soon — for urgent needs, contact us at support@thriveathome.com.
          </p>
          <Link
            href="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontFamily: 'var(--font-body)',
              fontSize: '18px',
              fontWeight: 500,
              color: 'var(--color-cream)',
              textDecoration: 'none',
              backgroundColor: 'var(--color-navy)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 24px',
              minHeight: '48px',
              transition: 'all 0.2s',
            }}
          >
            Return to dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}
