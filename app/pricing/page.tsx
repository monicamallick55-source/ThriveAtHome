import type { Metadata } from 'next'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'Pricing — ThriveAtHome' }
export const dynamic = 'force-dynamic'

const PLANS = [
  {
    tier: 'basics', name: 'Thrive Basics', monthlyPrice: 29, annualPrice: 23,
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
    tier: 'connect', name: 'Thrive Connect', monthlyPrice: 49, annualPrice: 39,
    highlighted: false,
    tagline: 'Everything in Basics plus real human connection',
    features: [
      'Everything in Basics',
      'Matched Human Buddy (weekly calls)',
      '25+ communities access',
      'Community events & RSVP',
      'Skill exchange & time banking',
      'Benefits finder (15+ programs)',
      'Cultural & heritage circles',
      'Age-stage community groups',
    ],
  },
  {
    tier: 'complete', name: 'Thrive Complete', monthlyPrice: 99, annualPrice: 79,
    highlighted: true,
    tagline: 'Everything in Connect plus dedicated human support',
    features: [
      'Everything in Connect',
      'Dedicated navigator (2 hr/mo)',
      'Grief & transition support (9 pathways)',
      'Services marketplace access',
      'Celebrations & gift sending',
      'Family Events Calendar',
      'Paid companion booking',
      'Priority fraud escalation',
    ],
  },
  {
    tier: 'premier', name: 'Thrive Premier', monthlyPrice: 199, annualPrice: 159,
    highlighted: false,
    tagline: 'Concierge-level care for complex needs',
    features: [
      'Everything in Complete',
      'Priority navigator (8 hr/mo)',
      'Bi-weekly priority Buddy calls',
      'Thrive Device included',
      'Concierge line (direct line)',
      'Companion credits included',
      'Medicare Advantage eligible',
      'Corporate & employer billing',
    ],
  },
]

const COMPARISON = [
  { category: 'AI & Automation', rows: [
    { feature: 'Daily Aria check-in calls', basics: true, connect: true, complete: true, premier: true },
    { feature: 'Mood, energy, sleep & pain tracking', basics: true, connect: true, complete: true, premier: true },
    { feature: 'Medication reminders', basics: true, connect: true, complete: true, premier: true },
    { feature: 'Missed call escalation protocol', basics: true, connect: true, complete: true, premier: true },
    { feature: 'Aria call frequency (daily/3x/weekly)', basics: true, connect: true, complete: true, premier: true },
    { feature: 'AI agents (12 total)', basics: '3', connect: '6', complete: '10', premier: '12' },
  ]},
  { category: 'Safety & Fraud', rows: [
    { feature: 'Fraud monitoring (7 categories)', basics: true, connect: true, complete: true, premier: true },
    { feature: 'Family SMS fraud alerts', basics: true, connect: true, complete: true, premier: true },
    { feature: 'Crisis phrase detection', basics: true, connect: true, complete: true, premier: true },
    { feature: 'Large purchase alerts', basics: true, connect: true, complete: true, premier: true },
    { feature: 'Priority navigator fraud escalation', basics: false, connect: false, complete: true, premier: true },
  ]},
  { category: 'Human Connection', rows: [
    { feature: 'Matched Human Buddy', basics: false, connect: true, complete: true, premier: true },
    { feature: 'Buddy call frequency', basics: '—', connect: 'Weekly', complete: 'Weekly', premier: 'Bi-weekly' },
    { feature: 'Dedicated care navigator', basics: false, connect: false, complete: '2 hr/mo', premier: '8 hr/mo' },
    { feature: 'Concierge line', basics: false, connect: false, complete: false, premier: true },
  ]},
  { category: 'Community', rows: [
    { feature: '25+ communities access', basics: false, connect: true, complete: true, premier: true },
    { feature: 'Community events & RSVP', basics: false, connect: true, complete: true, premier: true },
    { feature: 'Skill exchange & time banking', basics: false, connect: true, complete: true, premier: true },
    { feature: 'Benefits finder (15+ programs)', basics: false, connect: true, complete: true, premier: true },
  ]},
  { category: 'Family & Celebrations', rows: [
    { feature: 'Family wellness dashboard', basics: true, connect: true, complete: true, premier: true },
    { feature: 'Family Events Calendar', basics: false, connect: false, complete: true, premier: true },
    { feature: 'Celebrations & gift sending', basics: false, connect: false, complete: true, premier: true },
    { feature: 'Birthday/anniversary injection into Aria', basics: true, connect: true, complete: true, premier: true },
  ]},
  { category: 'Services & Device', rows: [
    { feature: 'Services marketplace', basics: false, connect: false, complete: true, premier: true },
    { feature: 'Paid companion booking', basics: false, connect: false, complete: true, premier: true },
    { feature: 'Companion credits', basics: false, connect: false, complete: false, premier: true },
    { feature: 'Thrive Device', basics: false, connect: false, complete: false, premier: true },
    { feature: 'Medicare Advantage eligible', basics: false, connect: false, complete: false, premier: true },
  ]},
]

function Tick({ value }: { value: boolean | string }) {
  if (value === false) return <span style={{ color: 'var(--color-text-muted)', fontSize: '18px' }}>—</span>
  if (value === true) return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-label="Included">
      <circle cx="10" cy="10" r="10" fill="var(--color-teal)" opacity="0.15" />
      <path d="M6 10l3 3 5-5" stroke="var(--color-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  return <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)' }}>{value}</span>
}

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
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '19px', color: 'var(--color-text-secondary)', lineHeight: 1.65, maxWidth: '500px', margin: '0 auto 16px' }}>
            No hidden fees, no long-term contracts. 14-day free trial on every plan.
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-teal)', fontWeight: 600, margin: 0 }}>
            Save 20% with annual billing
          </p>
        </div>
      </section>

      {/* ── PLAN CARDS ── */}
      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Annual toggle note */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '40px' }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Prices shown monthly · <span style={{ color: 'var(--color-teal)', fontWeight: 600 }}>Annual plan saves 20%</span> · Contact us for Medicare Advantage or employer billing
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: '20px' }}>
            {PLANS.map(plan => (
              <div key={plan.tier} style={{
                backgroundColor: plan.highlighted ? 'var(--color-navy)' : 'white',
                borderRadius: 'var(--radius-xl)',
                border: plan.highlighted ? 'none' : '1.5px solid var(--color-warm-grey)',
                padding: '32px 24px',
                display: 'flex', flexDirection: 'column',
                boxShadow: plan.highlighted ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
                position: 'relative',
              }}>
                {plan.highlighted && (
                  <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--color-teal)', color: 'white', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, padding: '4px 16px', borderRadius: '999px', whiteSpace: 'nowrap', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Most popular
                  </div>
                )}
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: plan.highlighted ? 'white' : 'var(--color-navy)', marginBottom: '6px' }}>
                  {plan.name}
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: plan.highlighted ? 'rgba(255,255,255,0.65)' : 'var(--color-text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
                  {plan.tagline}
                </p>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '40px', fontWeight: 700, color: plan.highlighted ? 'white' : 'var(--color-navy)', letterSpacing: '-0.02em' }}>
                    ${plan.monthlyPrice}
                  </span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: plan.highlighted ? 'rgba(255,255,255,0.6)' : 'var(--color-text-secondary)' }}>/mo</span>
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: plan.highlighted ? 'rgba(255,255,255,0.55)' : 'var(--color-text-muted)', marginBottom: '24px' }}>
                  or ${plan.annualPrice}/mo billed annually
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <circle cx="9" cy="9" r="9" fill={plan.highlighted ? 'rgba(255,255,255,0.15)' : 'var(--color-teal)'} opacity={plan.highlighted ? 1 : 0.15} />
                        <path d="M5 9l3 3 5-5" stroke={plan.highlighted ? 'white' : 'var(--color-teal)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: plan.highlighted ? 'rgba(255,255,255,0.88)' : 'var(--color-text-primary)', lineHeight: 1.5 }}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={signedIn ? '/dashboard/billing' : `/signup?plan=${plan.tier}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600,
                    textDecoration: 'none', borderRadius: 'var(--radius-md)',
                    padding: '14px 24px', minHeight: '52px',
                    backgroundColor: plan.highlighted ? 'white' : 'var(--color-teal)',
                    color: plan.highlighted ? 'var(--color-navy)' : 'white',
                  }}
                >
                  {signedIn ? 'Choose this plan' : 'Start free trial'}
                </Link>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', marginTop: '32px', fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)' }}>
            All plans include a 14-day free trial. No credit card required to start.
          </p>
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section style={{ padding: '0 24px 80px', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', padding: '64px 0 48px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '12px' }}>
              Full feature comparison
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--color-text-secondary)' }}>
              Everything that&apos;s included in each plan.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: '14px', color: 'var(--color-text-muted)', borderBottom: '2px solid var(--color-warm-grey)', minWidth: '220px' }}>Feature</th>
                  {PLANS.map(p => (
                    <th key={p.tier} style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 700, fontSize: '15px', color: p.highlighted ? 'var(--color-teal)' : 'var(--color-navy)', borderBottom: '2px solid var(--color-warm-grey)', minWidth: '110px', whiteSpace: 'nowrap' }}>
                      {p.name.replace('Thrive ', '')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(group => (
                  <>
                    <tr key={group.category}>
                      <td colSpan={5} style={{ padding: '20px 16px 8px', fontWeight: 700, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-teal)', backgroundColor: 'rgba(0,139,130,0.04)' }}>
                        {group.category}
                      </td>
                    </tr>
                    {group.rows.map((row, i) => (
                      <tr key={row.feature} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)' }}>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-warm-grey)' }}>{row.feature}</td>
                        {(['basics', 'connect', 'complete', 'premier'] as const).map(tier => (
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
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>
            Employer &amp; partner plans
          </h2>
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
