import type { Metadata } from 'next'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import PlanCards from '@/components/pricing/PlanCards'

export const metadata: Metadata = { title: 'Pricing — ThriveAtHome' }
export const dynamic = 'force-dynamic'

// Premier is built but hidden — not shown on public pricing page
// Connect tier removed — final model is Basic ($39) / Complete ($79) only
const PLANS = [
  {
    tier: 'basic', name: 'Thrive Basic', monthlyPrice: 39, annualPrice: 33,
    highlighted: false,
    tagline: 'Daily AI check-ins and family peace of mind',
    features: [
      'Daily Aria AI check-in calls',
      'Family wellness dashboard',
      'Mood, energy & sleep tracking',
      'Fraud monitoring (7 categories)',
      'Missed call escalation',
      'Document vault',
      'Crisis phrase detection',
      'Family SMS alerts',
    ],
  },
  {
    tier: 'complete', name: 'Thrive Complete', monthlyPrice: 79, annualPrice: 63,
    highlighted: true,
    tagline: 'Everything in Basic plus human connection and dedicated support',
    features: [
      'Everything in Basic',
      'Matched Human Buddy (weekly calls)',
      '25+ communities access',
      'Community events & RSVP',
      'Dedicated navigator (2 hr/mo)',
      'Grief & transition support (9 pathways)',
      'Services marketplace access',
      'Celebrations & gift sending',
      'Family Events Calendar',
      'Paid companion booking',
      'Priority fraud escalation',
    ],
  },
]

type CellValue = boolean | string

interface ComparisonRow {
  feature: string
  basic: CellValue
  complete: CellValue
}

const COMPARISON: { category: string; rows: ComparisonRow[] }[] = [
  { category: 'AI & Automation', rows: [
    { feature: 'Daily Aria check-in calls', basic: true, complete: true },
    { feature: 'Mood, energy, sleep & pain tracking', basic: true, complete: true },
    { feature: 'Medication reminders', basic: true, complete: true },
    { feature: 'Missed call escalation protocol', basic: true, complete: true },
    { feature: 'AI agents', basic: '3', complete: '10' },
  ]},
  { category: 'Safety & Fraud', rows: [
    { feature: 'Fraud monitoring (7 categories)', basic: true, complete: true },
    { feature: 'Family SMS fraud alerts', basic: true, complete: true },
    { feature: 'Crisis phrase detection', basic: true, complete: true },
    { feature: 'Large purchase alerts', basic: true, complete: true },
    { feature: 'Priority navigator fraud escalation', basic: false, complete: true },
  ]},
  { category: 'Human Connection', rows: [
    { feature: 'Matched Human Buddy', basic: false, complete: true },
    { feature: 'Buddy call frequency', basic: '—', complete: 'Weekly' },
    { feature: 'Dedicated care navigator', basic: '—', complete: '2 hr/mo' },
    { feature: '25+ communities access', basic: false, complete: true },
    { feature: 'Community events & RSVP', basic: false, complete: true },
    { feature: 'Skill exchange & time banking', basic: false, complete: true },
    { feature: 'Benefits finder (15+ programs)', basic: false, complete: true },
  ]},
  { category: 'Family & Celebrations', rows: [
    { feature: 'Family wellness dashboard', basic: true, complete: true },
    { feature: 'Family Events Calendar', basic: false, complete: true },
    { feature: 'Celebrations & gift sending', basic: false, complete: true },
    { feature: 'Birthday/anniversary in Aria calls', basic: true, complete: true },
  ]},
  { category: 'Services', rows: [
    { feature: 'Services marketplace', basic: false, complete: true },
    { feature: 'Paid companion booking', basic: false, complete: true },
    { feature: 'Grief & transition support', basic: false, complete: true },
  ]},
]

function Tick({ value }: { value: CellValue }) {
  if (value === false) return <span style={{ color: 'var(--color-text-muted)', fontSize: '18px' }}>—</span>
  if (value === true) return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-label="Included">
      <circle cx="10" cy="10" r="10" fill="var(--color-teal)" opacity="0.15" />
      <path d="M6 10l3 3 5-5" stroke="var(--color-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  return <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)' }}>{value}</span>
}

const tiers = ['basic', 'complete'] as const
type Tier = typeof tiers[number]

export default async function PricingPage() {
  const user = await getCurrentUser()
  const signedIn = !!user

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', overflowX: 'clip' }}>

      {/* ── HERO ── */}
      <section style={{ padding: 'clamp(56px, 8vw, 96px) 24px 64px', textAlign: 'center' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ display: 'inline-block', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-teal)', backgroundColor: 'rgba(0,139,130,0.08)', border: '1px solid rgba(0,139,130,0.2)', borderRadius: '100px', padding: '4px 14px', marginBottom: '20px' }}>Pricing</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 500, color: 'var(--color-navy)', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '20px' }}>
            Simple, honest pricing
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '19px', color: 'var(--color-text-secondary)', lineHeight: 1.65, maxWidth: '500px', margin: '0 auto 12px' }}>
            No hidden fees, no long-term contracts. 14-day free trial on every plan.
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-teal)', fontWeight: 600, margin: 0 }}>
            Save 20% with annual billing
          </p>
        </div>
      </section>

      {/* ── PLAN CARDS ── */}
      <PlanCards signedIn={signedIn} />

      {/* ── COMPARISON TABLE ── */}
      <section style={{ padding: '0 24px 80px', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', padding: '64px 0 48px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '12px' }}>Full feature comparison</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--color-text-secondary)' }}>Everything that&apos;s included in each plan.</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: '14px', color: 'var(--color-text-muted)', borderBottom: '2px solid var(--color-warm-grey)', minWidth: '220px' }}>Feature</th>
                  {PLANS.map(p => (
                    <th key={p.tier} style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 700, fontSize: '15px', color: p.highlighted ? 'var(--color-teal)' : 'var(--color-navy)', borderBottom: '2px solid var(--color-warm-grey)', minWidth: '130px', whiteSpace: 'nowrap' }}>
                      {p.name.replace('Thrive ', '')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(group => (
                  <>
                    <tr key={group.category}>
                      <td colSpan={3} style={{ padding: '20px 16px 8px', fontWeight: 700, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-teal)', backgroundColor: 'rgba(0,139,130,0.04)' }}>
                        {group.category}
                      </td>
                    </tr>
                    {group.rows.map((row, i) => (
                      <tr key={row.feature} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)' }}>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-warm-grey)' }}>{row.feature}</td>
                        {tiers.map(tier => (
                          <td key={tier} style={{ textAlign: 'center', padding: '12px 16px', borderBottom: '1px solid var(--color-warm-grey)' }}>
                            <Tick value={row[tier]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── B2B NOTE ── */}
      <section style={{ padding: '64px 24px', backgroundColor: 'var(--color-cream)', textAlign: 'center' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>Employer &amp; partner plans</h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--color-text-secondary)', lineHeight: 1.65, marginBottom: '32px' }}>
            ThriveAtHome is available as an employee benefit, Medicare Advantage supplemental benefit, or through senior care partners. Volume pricing, SSO, and dedicated account management included.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/employers" style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '16px', padding: '14px 28px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-navy)', color: 'var(--color-cream)', textDecoration: 'none' }}>For Employers</Link>
            <Link href="/for-organizations" style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '16px', padding: '14px 28px', borderRadius: 'var(--radius-md)', backgroundColor: 'transparent', color: 'var(--color-navy)', border: '1.5px solid var(--color-navy)', textDecoration: 'none' }}>For Partners</Link>
          </div>
        </div>
      </section>

    </div>
  )
}
