'use client'
import Link from 'next/link'
import { useState } from 'react'

const PLANS = [
  {
    tier: 'basic', name: 'Thrive Basic', monthlyPrice: 39, annualPrice: 33,
    annualTotal: 421, highlighted: false,
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
    annualTotal: 853, highlighted: true,
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

export default function PlanCards({ signedIn }: { signedIn: boolean }) {
  const [annual, setAnnual] = useState(false)

  return (
    <section style={{ padding: '0 24px 80px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '40px' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: !annual ? 'var(--color-navy)' : 'var(--color-text-muted)', fontWeight: !annual ? 600 : 400 }}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual(a => !a)}
            aria-label="Toggle annual billing"
            style={{
              position: 'relative', width: '48px', height: '26px', borderRadius: '999px',
              backgroundColor: annual ? 'var(--color-teal)' : 'var(--color-warm-grey)',
              border: 'none', cursor: 'pointer', transition: 'background 0.2s', padding: 0,
            }}
          >
            <span style={{
              position: 'absolute', top: '3px',
              left: annual ? '25px' : '3px',
              width: '20px', height: '20px', borderRadius: '50%',
              backgroundColor: 'white',
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: annual ? 'var(--color-navy)' : 'var(--color-text-muted)', fontWeight: annual ? 600 : 400 }}>
            Annual
            <span style={{ marginLeft: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--color-teal)', backgroundColor: 'rgba(0,139,130,0.1)', borderRadius: '999px', padding: '2px 8px' }}>
              Save 20%
            </span>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '24px' }}>
          {PLANS.map(plan => (
            <div key={plan.tier} style={{
              backgroundColor: plan.highlighted ? 'var(--color-navy)' : 'white',
              borderRadius: 'var(--radius-xl)',
              border: plan.highlighted ? 'none' : '1.5px solid var(--color-warm-grey)',
              padding: '32px 24px', display: 'flex', flexDirection: 'column',
              boxShadow: plan.highlighted ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
              position: 'relative',
            }}>
              {plan.highlighted && (
                <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--color-teal)', color: 'white', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, padding: '4px 16px', borderRadius: '999px', whiteSpace: 'nowrap', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Most popular
                </div>
              )}
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: plan.highlighted ? 'white' : 'var(--color-navy)', marginBottom: '6px' }}>{plan.name}</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: plan.highlighted ? 'rgba(255,255,255,0.65)' : 'var(--color-text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>{plan.tagline}</p>
              <div style={{ marginBottom: '6px' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '40px', fontWeight: 700, color: plan.highlighted ? 'white' : 'var(--color-navy)', letterSpacing: '-0.02em' }}>
                  ${annual ? plan.annualPrice : plan.monthlyPrice}
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: plan.highlighted ? 'rgba(255,255,255,0.6)' : 'var(--color-text-secondary)' }}>/mo</span>
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: plan.highlighted ? 'rgba(255,255,255,0.55)' : 'var(--color-text-muted)', marginBottom: '24px', minHeight: '20px' }}>
                {annual ? `Billed $${plan.annualTotal}/yr` : `or $${plan.annualPrice}/mo billed annually`}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: '2px' }}>
                      <circle cx="9" cy="9" r="9" fill={plan.highlighted ? 'rgba(255,255,255,0.15)' : 'var(--color-teal)'} opacity={plan.highlighted ? 1 : 0.15} />
                      <path d="M5 9l3 3 5-5" stroke={plan.highlighted ? 'white' : 'var(--color-teal)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: plan.highlighted ? 'rgba(255,255,255,0.88)' : 'var(--color-text-primary)', lineHeight: 1.5 }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={signedIn ? `/dashboard/billing?plan=${plan.tier}&billing=${annual ? 'annual' : 'monthly'}` : `/signup?plan=${plan.tier}&billing=${annual ? 'annual' : 'monthly'}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600,
                  textDecoration: 'none', borderRadius: 'var(--radius-md)',
                  padding: '14px 24px', minHeight: '52px',
                  backgroundColor: plan.highlighted ? 'white' : 'var(--color-teal)',
                  color: plan.highlighted ? 'var(--color-navy)' : 'white',
                }}>
                {signedIn ? 'Choose this plan' : 'Get Started'}
              </Link>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', marginTop: '32px', fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)' }}>
          All plans include a 14-day free trial. No credit card required to start.
        </p>
      </div>
    </section>
  )
}
