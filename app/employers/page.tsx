/**
 * app/employers/page.tsx — public employer landing page
 * Server Component (no 'use client') to avoid 500 on static render.
 */
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'For Employers — ThriveAtHome',
  description: 'Support your employees\' aging parents with ThriveAtHome — daily AI check-ins, care navigators, and family coordination.',
}

const COMPANY_SIZES = [
  '1–50 employees',
  '51–200 employees',
  '201–500 employees',
  '501–1,000 employees',
  '1,001–5,000 employees',
  '5,000+ employees',
]

const VALUE_PROPS = [
  {
    icon: '📞',
    title: 'Daily AI check-ins',
    desc: "Friendly phone calls keep your employees' parents connected and safe — no smartphone required.",
  },
  {
    icon: '🔔',
    title: 'Real-time family alerts',
    desc: "If something changes in a senior's wellbeing, the family hears about it immediately.",
  },
  {
    icon: '🤝',
    title: 'Care navigator support',
    desc: 'A dedicated human navigator coordinates care, volunteers, and community connections.',
  },
  {
    icon: '📊',
    title: 'Utilisation reporting',
    desc: 'Simple dashboards show engagement and ROI without exposing personal health data.',
  },
]

export default function EmployersPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafaf7', fontFamily: 'var(--font-body, system-ui, sans-serif)' }}>
      {/* Nav */}
      <nav style={{ backgroundColor: '#1b2a4a', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: '22px', color: '#fafaf7', fontWeight: 500, textDecoration: 'none' }}>
          ThriveAtHome
        </Link>
        <Link href="/contact" style={{ color: '#fafaf7', fontSize: '15px', textDecoration: 'none', opacity: 0.85 }}>
          Talk to us →
        </Link>
      </nav>

      {/* Hero */}
      <section style={{ backgroundColor: '#1b2a4a', padding: '72px 32px 80px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 500, color: '#fafaf7', marginBottom: '20px', lineHeight: 1.2 }}>
          A benefit your employees<br />will actually use
        </h1>
        <p style={{ fontSize: '20px', color: 'rgba(250,250,247,0.75)', maxWidth: '600px', margin: '0 auto 36px', lineHeight: 1.6 }}>
          ThriveAtHome keeps aging parents safe, connected, and independent — so your team can focus at work.
        </p>
        <Link
          href="/contact"
          style={{
            display: 'inline-block',
            backgroundColor: '#3ba08c',
            color: '#fff',
            padding: '14px 32px',
            borderRadius: '8px',
            fontSize: '17px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Request a demo
        </Link>
      </section>

      {/* Value props */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '64px 32px' }}>
        <h2 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: '28px', fontWeight: 500, color: '#1b2a4a', textAlign: 'center', marginBottom: '40px' }}>
          What's included
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          {VALUE_PROPS.map((v) => (
            <div
              key={v.title}
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                border: '1px solid #e8e4de',
                padding: '28px 24px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>{v.icon}</div>
              <h3 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: '18px', fontWeight: 500, color: '#1b2a4a', marginBottom: '8px' }}>{v.title}</h3>
              <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.6 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Company size selector (UI only) */}
      <section style={{ backgroundColor: '#f0ede8', padding: '56px 32px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: '24px', fontWeight: 500, color: '#1b2a4a', marginBottom: '8px' }}>
            What size is your company?
          </h2>
          <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '28px' }}>
            We work with businesses of all sizes, from small teams to global enterprises.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            {COMPANY_SIZES.map((size) => (
              <Link
                key={size}
                href="/contact"
                style={{
                  display: 'inline-block',
                  border: '1.5px solid #1b2a4a',
                  borderRadius: '24px',
                  padding: '8px 20px',
                  fontSize: '14px',
                  color: '#1b2a4a',
                  textDecoration: 'none',
                  backgroundColor: '#fff',
                }}
              >
                {size}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: '600px', margin: '0 auto', padding: '64px 32px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: '26px', fontWeight: 500, color: '#1b2a4a', marginBottom: '16px' }}>
          Ready to bring ThriveAtHome to your team?
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '28px', lineHeight: 1.6 }}>
          Pricing starts at $12/employee/month. Volume discounts available. No lock-in contracts.
        </p>
        <Link
          href="/contact"
          style={{
            display: 'inline-block',
            backgroundColor: '#1b2a4a',
            color: '#fafaf7',
            padding: '14px 36px',
            borderRadius: '8px',
            fontSize: '17px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Talk to our team
        </Link>
      </section>

      <footer style={{ borderTop: '1px solid #e8e4de', padding: '28px 32px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
        © {new Date().getFullYear()} ThriveAtHome · <Link href="/privacy" style={{ color: '#9ca3af' }}>Privacy</Link> · <Link href="/terms" style={{ color: '#9ca3af' }}>Terms</Link>
      </footer>
    </div>
  )
}
