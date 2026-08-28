// Advisor listing application — public page (Phase 98, M24).
import type { Metadata } from 'next'
import Link from 'next/link'
import AdvisorApplyClient from '@/components/advisors/AdvisorApplyClient'
import { LISTING_TIERS } from '@/lib/advisors/types'

export const metadata: Metadata = { title: 'Join the ThriveAtHome Trusted Advisor Directory' }

export default function AdvisorApplyPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      <header style={{ backgroundColor: 'var(--color-navy)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-cream)', textDecoration: 'none', fontWeight: 500 }}>
          ThriveAtHome
        </Link>
        <Link href="/" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
          ← Home
        </Link>
      </header>

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 16px 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '34px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 10px' }}>
          Join the Trusted Advisor Directory
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--color-text-secondary)', margin: '0 0 24px' }}>
          ThriveAtHome connects older adults and their families with vetted elder law attorneys,
          financial advisors, benefits counselors, tax professionals, and care managers. Listed
          advisors receive warm, navigator-made introductions to families who need their help.
        </p>

        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '28px' }}>
          {LISTING_TIERS.map((t) => (
            <div key={t.value} style={{ backgroundColor: 'white', border: '1px solid var(--color-warm-grey)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--color-navy)', fontWeight: 600 }}>{t.label}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '22px', color: 'var(--color-navy)', fontWeight: 700 }}>
                ${t.annualFee.toLocaleString()}<span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--color-text-muted)' }}>/year</span>
              </div>
              <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                {t.perks.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <AdvisorApplyClient />

        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '20px' }}>
          Submitting an application does not guarantee a listing. Our partnerships team reviews
          credentials, disciplinary history, and client references before any advisor is listed.
        </p>
      </main>
    </div>
  )
}
