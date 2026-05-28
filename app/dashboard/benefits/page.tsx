import type { Metadata } from 'next'
import Link from 'next/link'
import BenefitsClient from '@/components/benefits/BenefitsClient'

export const metadata: Metadata = { title: 'Benefits Navigator — ThriveAtHome' }

export default function BenefitsPage() {
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
          <Link href="/dashboard" style={{
            fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 500,
            color: 'var(--color-text-secondary)', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            ← Dashboard
          </Link>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '22px',
            color: 'var(--color-navy)', fontWeight: 500,
          }}>ThriveAtHome</span>
          <div style={{ width: '120px' }} aria-hidden="true" />
        </div>
      </nav>

      <div style={{ flex: 1 }}>
        {/* Page header */}
        <div style={{
          maxWidth: '800px', margin: '0 auto', padding: '48px 24px 0',
        }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '38px', fontWeight: 500,
            color: 'var(--color-navy)', marginBottom: '12px', letterSpacing: '-0.01em',
          }}>
            Benefits Navigator
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: '18px',
            color: 'var(--color-text-secondary)', lineHeight: 1.65, maxWidth: '560px',
            marginBottom: '0',
          }}>
            Answer 4 quick questions and we&apos;ll show you government programs and benefits that may be available for your loved one.
          </p>
        </div>

        <BenefitsClient />
      </div>
    </div>
  )
}
