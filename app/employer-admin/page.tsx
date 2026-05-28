import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Employer Admin — ThriveAtHome' }

export default function EmployerAdminPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', textDecoration: 'none', fontWeight: 500 }}>
          ThriveAtHome
        </Link>
        <Link href="/login" style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'rgba(250,250,245,0.7)', textDecoration: 'none' }}>
          Sign in
        </Link>
      </nav>
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 32px' }}>
        <div style={{ textAlign: 'center', maxWidth: '520px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏢</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px', letterSpacing: '-0.01em' }}>
            Employer Admin Portal
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', lineHeight: 1.65, marginBottom: '32px' }}>
            Contact us to set up your employer account. Your team will have access to utilisation reporting, seat management, and employee invitation tools.
          </p>
          <Link
            href="/employers#demo-form"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--font-body)',
              fontSize: '17px',
              fontWeight: 600,
              color: 'white',
              backgroundColor: 'var(--color-navy)',
              textDecoration: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '12px 28px',
              minHeight: '48px',
            }}
          >
            Request a demo →
          </Link>
          <div style={{ marginTop: '16px' }}>
            <Link
              href="/"
              style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', textDecoration: 'none' }}
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
