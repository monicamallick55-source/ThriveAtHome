import type { Metadata } from 'next'
import Link from 'next/link'
import { STRIPE_PLANS } from '@/lib/stripe/config'

export const metadata: Metadata = { title: 'Pricing — ThriveAtHome' }

const CHECK_ICON = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: '2px' }}>
    <circle cx="9" cy="9" r="9" fill="var(--color-teal)" opacity="0.15" />
    <path d="M5 9l3 3 5-5" stroke="var(--color-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function PricingPage() {
  const plans = Object.values(STRIPE_PLANS)

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
          <Link href="/signup" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 500, color: 'white', backgroundColor: 'var(--color-navy)', textDecoration: 'none', padding: '8px 20px', borderRadius: 'var(--radius-md)', minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}>
            Get started
          </Link>
        </div>
      </nav>

      <main style={{ flex: 1, padding: '64px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px', letterSpacing: '-0.01em' }}>
              Simple, honest pricing
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '20px', color: 'var(--color-text-secondary)', lineHeight: 1.65, maxWidth: '520px', margin: '0 auto' }}>
              Choose the plan that fits your family. Cancel any time. No contracts, no surprises.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {plans.map((plan) => (
              <div
                key={plan.tier}
                style={{
                  backgroundColor: plan.highlighted ? 'var(--color-navy)' : 'white',
                  borderRadius: 'var(--radius-lg)',
                  border: plan.highlighted ? 'none' : '1.5px solid var(--color-warm-grey)',
                  padding: '32px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: plan.highlighted ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
                  position: 'relative',
                }}
              >
                {plan.highlighted && (
                  <div style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'var(--color-teal)',
                    color: 'white',
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '4px 16px',
                    borderRadius: '999px',
                    whiteSpace: 'nowrap',
                  }}>
                    Most popular
                  </div>
                )}

                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '26px',
                  fontWeight: 500,
                  color: plan.highlighted ? 'white' : 'var(--color-navy)',
                  marginBottom: '8px',
                }}>
                  {plan.name}
                </h2>

                <div style={{ marginBottom: '24px' }}>
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '42px',
                    fontWeight: 700,
                    color: plan.highlighted ? 'white' : 'var(--color-navy)',
                    letterSpacing: '-0.02em',
                  }}>
                    ${plan.price}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '18px',
                    color: plan.highlighted ? 'rgba(255,255,255,0.7)' : 'var(--color-text-secondary)',
                  }}>
                    /month
                  </span>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {plan.features.map((feature) => (
                    <li key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <circle cx="9" cy="9" r="9" fill={plan.highlighted ? 'rgba(255,255,255,0.15)' : 'var(--color-teal)'} opacity={plan.highlighted ? 1 : 0.15} />
                        <path d="M5 9l3 3 5-5" stroke={plan.highlighted ? 'white' : 'var(--color-teal)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '17px',
                        color: plan.highlighted ? 'rgba(255,255,255,0.9)' : 'var(--color-text-primary)',
                        lineHeight: 1.5,
                      }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/signup?plan=${plan.tier}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-body)',
                    fontSize: '18px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 24px',
                    minHeight: '56px',
                    transition: 'all 0.2s',
                    backgroundColor: plan.highlighted ? 'white' : 'var(--color-teal)',
                    color: plan.highlighted ? 'var(--color-navy)' : 'white',
                  }}
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', marginTop: '40px', fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--color-text-secondary)' }}>
            All plans include a 14-day free trial. No credit card required to start.
          </p>
        </div>
      </main>
    </div>
  )
}
