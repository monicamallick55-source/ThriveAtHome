import type { Metadata } from 'next'
import Link from 'next/link'
import { NavigatorApplyForm } from '@/components/careers/NavigatorApplyForm'

export const metadata: Metadata = {
  title: 'Care Navigator — Careers — ThriveAtHome',
  description: 'Care Navigator — part-time, remote (Bay Area). Calling members, dispatching volunteers, and monitoring wellness.',
}

const navStyle: React.CSSProperties = {
  position: 'sticky', top: 0, zIndex: 50,
  backgroundColor: 'var(--color-cream)',
  borderBottom: '1px solid var(--color-warm-grey)',
  boxShadow: 'var(--shadow-sm)',
}
const navInner: React.CSSProperties = {
  maxWidth: '1200px', margin: '0 auto', padding: '0 32px', height: '72px',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
}
const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 500,
  color: 'var(--color-navy)', letterSpacing: '-0.01em', marginBottom: '16px',
}
const bodyText: React.CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: '18px', lineHeight: 1.7, color: 'var(--color-text-secondary)',
}
const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-warm-white)',
  border: '1px solid var(--color-warm-grey)',
  borderRadius: 'var(--radius-xl)',
  padding: '32px',
  boxShadow: 'var(--shadow-card)',
}

export default function NavigatorCareersPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-cream)' }}>
      <header style={navStyle}>
        <div style={navInner}>
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--color-navy)', fontWeight: 500, textDecoration: 'none' }}>
            ThriveAtHome
          </Link>
          <Link href="/login" style={{ color: 'var(--color-navy)', fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 500, padding: '8px 20px', textDecoration: 'none' }}>
            Sign in
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, padding: '64px 32px' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          {/* Header */}
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-teal)', marginBottom: '16px' }}>
            Careers at ThriveAtHome
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 5vw, 42px)', fontWeight: 500, color: 'var(--color-navy)', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '12px' }}>
            Care Navigator
          </h1>
          <p style={{ ...bodyText, fontSize: '20px', marginBottom: '40px' }}>
            Part-time, Remote (Bay Area)
          </p>

          {/* About the role */}
          <section style={{ ...cardStyle, marginBottom: '24px' }}>
            <h2 style={sectionTitle}>About the role</h2>
            <p style={bodyText}>
              As a Care Navigator, you&apos;ll be the human heart of ThriveAtHome. You&apos;ll call members
              regularly to check in and build real relationships, dispatch volunteers to meet members&apos;
              needs, and monitor member wellness so nothing falls through the cracks. You&apos;ll work closely
              with our AI companion, Aria, and step in personally whenever a member needs a human touch.
            </p>
          </section>

          {/* Requirements */}
          <section style={{ ...cardStyle, marginBottom: '24px' }}>
            <h2 style={sectionTitle}>Requirements</h2>
            <ul style={{ ...bodyText, margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>MSW student or graduate (or equivalent experience in social work / care coordination)</li>
              <li>Compassionate, warm, and comfortable talking with older adults on the phone</li>
              <li>Organized — able to track many member relationships and follow-ups at once</li>
            </ul>
          </section>

          {/* Time commitment + compensation */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            <div style={cardStyle}>
              <h2 style={sectionTitle}>Time commitment</h2>
              <p style={{ ...bodyText, margin: 0 }}>10–15 hours/week</p>
            </div>
            <div style={cardStyle}>
              <h2 style={sectionTitle}>Compensation</h2>
              <p style={{ ...bodyText, margin: 0 }}>$20–25/hour</p>
            </div>
          </section>

          {/* Apply form */}
          <section style={cardStyle}>
            <h2 style={sectionTitle}>Apply</h2>
            <p style={{ ...bodyText, marginBottom: '24px' }}>
              Tell us a bit about yourself and we&apos;ll be in touch.
            </p>
            <NavigatorApplyForm />
          </section>
        </div>
      </main>

      <footer style={{ backgroundColor: 'var(--color-navy-dark)', padding: '32px', textAlign: 'center' }}>
        <p style={{ color: 'rgba(250,250,245,0.5)', fontSize: '15px', fontFamily: 'var(--font-body)', margin: 0 }}>
          © 2026 ThriveAtHome. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
