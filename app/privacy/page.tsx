// Placeholder for Privacy Policy — built in M12.
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Privacy Policy — ThriveAtHome' }

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ backgroundColor: 'white', borderBottom: '1px solid var(--color-warm-grey)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', textDecoration: 'none', fontWeight: 500 }}>
          ThriveAtHome
        </Link>
        <Link href="/login" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', textDecoration: 'none' }}>
          Sign in
        </Link>
      </nav>
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 32px' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '42px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px', letterSpacing: '-0.01em' }}>
            Privacy Policy
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '20px', color: 'var(--color-text-secondary)', lineHeight: 1.65, marginBottom: '40px' }}>
            Our full privacy policy is coming soon. ThriveAtHome is HIPAA-compliant and never sells your data.
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--font-body)',
              fontSize: '18px',
              fontWeight: 500,
              color: 'var(--color-navy)',
              textDecoration: 'none',
              border: '1.5px solid var(--color-navy)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 24px',
              minHeight: '48px',
              transition: 'all 0.2s',
            }}
          >
            ← Back to home
          </Link>
        </div>
      </main>
    </div>
  )
}
