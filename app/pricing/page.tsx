// Placeholder for Pricing — built in M11 (Billing).
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Pricing — ThriveAtHome' }

export default function PricingPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ backgroundColor: 'white', borderBottom: '1px solid var(--color-warm-grey)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', textDecoration: 'none', fontWeight: 500 }}>
          ThriveAtHome
        </Link>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link href="/login" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', textDecoration: 'none' }}>
            Sign in
          </Link>
          <Link href="/signup" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 500, color: 'var(--color-cream)', backgroundColor: 'var(--color-navy)', textDecoration: 'none', padding: '8px 20px', borderRadius: 'var(--radius-md)', minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}>
            Get started
          </Link>
        </div>
      </nav>
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 32px' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '42px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px', letterSpacing: '-0.01em' }}>
            Pricing
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '20px', color: 'var(--color-text-secondary)', lineHeight: 1.65, marginBottom: '40px' }}>
            Detailed pricing page coming soon. In the meantime, see our plans on the home page.
          </p>
          <Link
            href="/#pricing"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
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
            View plans
          </Link>
        </div>
      </main>
    </div>
  )
}
