// Placeholder for Navigator Console — built in M7.
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Navigator Console — ThriveAtHome' }

export default function NavigatorPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500 }}>
          ThriveAtHome
        </span>
        <Link href="/login" style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'rgba(250,250,245,0.7)', textDecoration: 'none' }}>
          Sign out
        </Link>
      </nav>
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 32px' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '42px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px', letterSpacing: '-0.01em' }}>
            Navigator Console
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '20px', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
            The care navigator console is coming soon. It will give navigators a complete view of all members and alerts.
          </p>
        </div>
      </main>
    </div>
  )
}
