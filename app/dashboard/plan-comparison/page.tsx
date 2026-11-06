'use client'

/**
 * app/dashboard/plan-comparison/page.tsx — TC-PED007
 * Shows ThriveAtHome subscription plan tiers (Basic vs Complete) side by side.
 * Also includes Medicare plan info further down the page.
 */

import Link from 'next/link'

const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$29/mo',
    highlight: false,
    tagline: 'Essential safety and check-ins',
    features: [
      'Daily AI phone check-ins (Aria)',
      'Emergency alert to 1 family contact',
      'Monthly wellbeing report',
      'Community resource directory',
      'In-app messaging',
    ],
    notIncluded: [
      'Human care navigator',
      'Benefits finder',
      'Village network access',
      'Life-transition coaching',
    ],
  },
  {
    id: 'complete',
    name: 'Complete',
    price: '$79/mo',
    highlight: true,
    tagline: 'Full independence support',
    features: [
      'Everything in Basic',
      'Dedicated human care navigator (4h/mo)',
      'Benefits & entitlements finder',
      'Village network & volunteer matching',
      'Life-transition coaching pathways',
      'Family coordination portal',
      'Document vault',
      'Priority phone support',
    ],
    notIncluded: [],
  },
]

const PLAN_TYPES = [
  {
    id: 'original',
    name: 'Original Medicare',
    parts: 'Part A + Part B',
    icon: '🏛️',
    pros: [
      'Accepted by most doctors and hospitals nationwide',
      'No referrals needed to see specialists',
      'Predictable structure — well understood',
      'Pairs well with Medigap (supplemental) plans',
    ],
    cons: [
      'No cap on out-of-pocket costs (without Medigap)',
      'No prescription drug coverage (need Part D separately)',
      'No dental, vision, or hearing coverage',
    ],
    bestFor: 'People who travel frequently or have doctors in multiple states',
  },
  {
    id: 'advantage',
    name: 'Medicare Advantage',
    parts: 'Part C (bundles A + B)',
    icon: '⭐',
    pros: [
      'Often includes dental, vision, hearing, and fitness benefits',
      'Usually includes prescription drug coverage (Part D)',
      'Annual out-of-pocket maximum protects against high costs',
      'May have $0 or low monthly premium',
    ],
    cons: [
      'Network restrictions — must use in-network providers',
      'Referrals often required to see specialists',
      'Plan details vary significantly by insurer and county',
    ],
    bestFor: 'People who want all coverage bundled and mainly use local providers',
  },
  {
    id: 'supplement',
    name: 'Medigap',
    parts: 'Supplemental (pairs with A + B)',
    icon: '🛡️',
    pros: [
      'Covers most or all of Original Medicare cost-sharing',
      'No network restrictions — works wherever Medicare is accepted',
      'Predictable costs, no surprise bills',
    ],
    cons: [
      'Monthly premium on top of Part B premium',
      'Does not include Part D (need a separate drug plan)',
    ],
    bestFor: 'People who want the broadest coverage and can pay a higher premium',
  },
  {
    id: 'partd',
    name: 'Part D',
    parts: 'Prescription Drug Coverage',
    icon: '💊',
    pros: [
      'Covers most prescription medications',
      'Available as stand-alone or bundled with Advantage',
      'Low-income subsidy (Extra Help) available',
    ],
    cons: [
      'Each plan has its own formulary — check your drugs are covered',
      'Coverage gap ("donut hole") may still apply for some',
    ],
    bestFor: 'Everyone on Original Medicare — skipping it incurs a permanent penalty',
  },
]

export default function PlanComparisonPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream, #fafaf7)', fontFamily: 'var(--font-body, system-ui, sans-serif)' }}>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: 'white', borderBottom: '1px solid #e8e4de', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', height: '64px', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard" style={{ fontSize: '15px', color: '#6b7280', textDecoration: 'none' }}>← Dashboard</Link>
          <span style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: '20px', color: '#1b2a4a', fontWeight: 500 }}>ThriveAtHome</span>
          <div style={{ width: '100px' }} />
        </div>
      </nav>

      {/* Header */}
      <div style={{ backgroundColor: '#1b2a4a', padding: '40px 24px 56px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 500, color: '#fafaf7', marginBottom: '8px' }}>
            Plan Comparison
          </h1>
          <p style={{ fontSize: '17px', color: 'rgba(250,250,247,0.7)', margin: 0 }}>
            Choose the right ThriveAtHome plan — and understand your Medicare options.
          </p>
        </div>
      </div>

      <main style={{ maxWidth: '1100px', margin: '-24px auto 0', padding: '0 24px 64px', position: 'relative', zIndex: 10 }}>

        {/* ── Subscription plan tiers ── */}
        <section style={{ marginBottom: '56px' }}>
          <h2 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: '24px', fontWeight: 500, color: '#1b2a4a', margin: '0 0 24px' }}>
            ThriveAtHome Subscription Plans
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div
                key={plan.id}
                style={{
                  backgroundColor: plan.highlight ? '#1b2a4a' : '#fff',
                  color: plan.highlight ? '#fafaf7' : '#1b2a4a',
                  borderRadius: '16px',
                  border: plan.highlight ? 'none' : '1px solid #e8e4de',
                  padding: '32px 28px',
                  boxShadow: plan.highlight ? '0 8px 32px rgba(27,42,74,0.25)' : '0 1px 4px rgba(0,0,0,0.05)',
                  position: 'relative',
                }}
              >
                {plan.highlight && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#3ba08c', color: '#fff', borderRadius: '20px', padding: '4px 16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                    Most Popular
                  </div>
                )}
                <h3 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: '24px', fontWeight: 500, margin: '0 0 4px' }}>{plan.name}</h3>
                <p style={{ fontSize: '13px', opacity: 0.7, margin: '0 0 16px' }}>{plan.tagline}</p>
                <div style={{ fontSize: '32px', fontWeight: 700, margin: '0 0 20px' }}>{plan.price}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px' }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '15px', marginBottom: '8px', opacity: 0.9 }}>
                      <span style={{ color: plan.highlight ? '#3ba08c' : '#3ba08c', marginTop: '2px', flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                  {plan.notIncluded.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px', marginBottom: '6px', opacity: 0.4 }}>
                      <span style={{ marginTop: '2px', flexShrink: 0 }}>✗</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard/billing"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    backgroundColor: plan.highlight ? '#3ba08c' : '#1b2a4a',
                    color: '#fff',
                  }}
                >
                  {plan.highlight ? 'Upgrade to Complete' : 'Stay on Basic'}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── Medicare section ── */}
        <section>
          <h2 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: '24px', fontWeight: 500, color: '#1b2a4a', margin: '0 0 8px' }}>
            Medicare Plan Types
          </h2>
          <p style={{ color: '#6b7280', fontSize: '15px', margin: '0 0 24px', lineHeight: 1.6 }}>
            ThriveAtHome works alongside your Medicare coverage. Here's a quick guide to the main plan types — speak with your benefits navigator for personalised advice.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
            {PLAN_TYPES.map((plan) => (
              <div key={plan.id} style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #e8e4de', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '28px' }}>{plan.icon}</span>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: '16px', fontWeight: 500, color: '#1b2a4a', margin: 0 }}>{plan.name}</h3>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>{plan.parts}</p>
                  </div>
                </div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#3ba08c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Pros</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px' }}>
                  {plan.pros.map((p) => <li key={p} style={{ fontSize: '13px', color: '#374151', marginBottom: '4px', paddingLeft: '14px', position: 'relative' }}><span style={{ position: 'absolute', left: 0 }}>·</span>{p}</li>)}
                </ul>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Considerations</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px' }}>
                  {plan.cons.map((c) => <li key={c} style={{ fontSize: '13px', color: '#374151', marginBottom: '4px', paddingLeft: '14px', position: 'relative' }}><span style={{ position: 'absolute', left: 0 }}>·</span>{c}</li>)}
                </ul>
                <p style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>Best for: {plan.bestFor}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '24px', fontSize: '13px', color: '#9ca3af', textAlign: 'center' }}>
            This is general information only — not medical or financial advice. <Link href="/dashboard/navigator" style={{ color: '#3ba08c' }}>Talk to your navigator</Link> for personalised guidance.
          </p>
        </section>
      </main>
    </div>
  )
}
