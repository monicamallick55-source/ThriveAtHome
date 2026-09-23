import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'ThriveAtHome — Your parent deserves a morning call, not a medical alert',
  description: 'ThriveAtHome combines daily AI companion calls, human buddies, and real care navigation so seniors can age at home with dignity.',
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ display: 'inline', flexShrink: 0 }}>
      <path d="M3 8l3.5 3.5L13 5" stroke="var(--color-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FeatureIcon({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: 'var(--color-teal-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '22px',
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {children}
    </div>
  )
}

const sectionHeading: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '34px',
  fontWeight: 500,
  color: 'var(--color-navy)',
  letterSpacing: '-0.01em',
  marginBottom: '16px',
}

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-warm-white)',
  border: '1px solid var(--color-warm-grey)',
  borderRadius: 'var(--radius-xl)',
  padding: '32px',
  boxShadow: 'var(--shadow-card)',
}

const featureCards = [
  { icon: '📞', title: 'Aria morning calls', desc: 'A warm daily AI companion call that checks in on mood, sleep, medications, and wellbeing.' },
  { icon: '🤝', title: 'Human buddy programme', desc: 'Real volunteers matched by interests and era — a friendly voice, not just a check-in.' },
  { icon: '🧭', title: 'Care navigation', desc: 'A dedicated navigator coordinates support and steps in whenever something needs a human touch.' },
  { icon: '🌍', title: '20 communities', desc: 'Cultural circles, hobby groups, and faith communities that welcome your loved one in.' },
  { icon: '🛒', title: 'Services marketplace', desc: 'Trusted help for transportation, meals, errands, and home tasks — all in one place.' },
  { icon: '📊', title: 'Family dashboard', desc: 'Real-time updates after every call so your family always knows how they’re doing.' },
]

const plans = [
  { name: 'Basics', price: '$29' },
  { name: 'Connect', price: '$49' },
  { name: 'Complete', price: '$89' },
  { name: 'Concierge', price: 'Custom' },
]

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'var(--color-cream)',
          borderBottom: '1px solid var(--color-warm-grey)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--color-navy)', fontWeight: 500, letterSpacing: '-0.01em' }}>
            ThriveAtHome
          </span>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link
              href="/login"
              style={{
                color: 'var(--color-navy)',
                fontFamily: 'var(--font-body)',
                fontSize: '18px',
                fontWeight: 500,
                padding: '8px 20px',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: '44px',
              }}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              style={{
                backgroundColor: 'var(--color-navy)',
                color: 'var(--color-cream)',
                fontFamily: 'var(--font-body)',
                fontSize: '18px',
                fontWeight: 500,
                padding: '10px 24px',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: '44px',
              }}
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {/* 1. Hero */}
        <section
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'radial-gradient(ellipse at 15% 15%, rgba(232,245,244,0.7) 0%, transparent 50%), radial-gradient(ellipse at 85% 85%, rgba(27,58,107,0.06) 0%, transparent 50%), var(--color-cream)',
            padding: '96px 32px 80px',
          }}
        >
          <div style={{ maxWidth: '780px', margin: '0 auto', width: '100%', textAlign: 'center' }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(32px, 5.5vw, 50px)',
                fontWeight: 500,
                color: 'var(--color-navy)',
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                marginBottom: '24px',
              }}
            >
              Your parent deserves a morning call, not a medical alert.
            </h1>

            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '20px',
                lineHeight: 1.65,
                color: 'var(--color-text-secondary)',
                maxWidth: '620px',
                margin: '0 auto 40px',
              }}
            >
              ThriveAtHome combines daily AI companion calls, human buddies, and real
              care navigation so seniors can age at home with dignity.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link
                href="/signup"
                style={{
                  backgroundColor: 'var(--color-navy)',
                  color: 'var(--color-cream)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '18px',
                  fontWeight: 500,
                  padding: '16px 32px',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: '56px',
                }}
              >
                Get started
              </Link>
              <Link
                href="#how-it-works"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--color-navy)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '18px',
                  fontWeight: 500,
                  padding: '16px 32px',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  border: '1.5px solid var(--color-navy)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: '56px',
                }}
              >
                See how it works
              </Link>
            </div>
          </div>
        </section>

        {/* 2. Social proof bar */}
        <section style={{ backgroundColor: 'var(--color-navy)', padding: '20px 32px' }}>
          <p
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              textAlign: 'center',
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'rgba(250,250,245,0.7)',
            }}
          >
            Trusted by families across the Bay Area
          </p>
        </section>

        {/* 3. How it works */}
        <section id="how-it-works" style={{ backgroundColor: '#FFFFFF', padding: '80px 32px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <h2 style={sectionHeading}>How it works</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '20px', maxWidth: '560px', margin: '0 auto' }}>
                From first call to daily connection — here&apos;s the path.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '40px',
              }}
            >
              {[
                { step: '1', title: 'Sign up in minutes', desc: 'A family member or the senior themselves signs up, and a navigator calls within 24 hours.' },
                { step: '2', title: 'Your navigator builds the relationship', desc: '21 days of human-first care — getting to know them before anything is automated.' },
                { step: '3', title: 'Aria calls every morning', desc: 'A daily AI companion call keeps the connection going, with the family seeing updates in real time.' },
              ].map((item) => (
                <div key={item.step} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-navy)',
                      color: 'var(--color-cream)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '20px',
                      fontWeight: 600,
                    }}
                  >
                    {item.step}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>
                    {item.title}
                  </h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '18px', lineHeight: 1.65, margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. What members get */}
        <section style={{ backgroundColor: 'var(--color-cream)', padding: '80px 32px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <h2 style={sectionHeading}>What members get</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '20px', maxWidth: '560px', margin: '0 auto' }}>
                Everything your family needs, quietly working in the background.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
              }}
            >
              {featureCards.map((f) => (
                <div key={f.title} style={cardStyle}>
                  <FeatureIcon>{f.icon}</FeatureIcon>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)', margin: '16px 0 8px' }}>
                    {f.title}
                  </h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '17px', lineHeight: 1.6, margin: 0 }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Who it's for */}
        <section style={{ backgroundColor: '#FFFFFF', padding: '80px 32px' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <h2 style={sectionHeading}>Who it&apos;s for</h2>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '32px',
              }}
            >
              <div style={cardStyle}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>
                  For seniors
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {['Age at home with independence', 'A daily voice that checks in and listens', 'Real human connection, not just technology'].map((item) => (
                    <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '18px', color: 'var(--color-text-secondary)' }}>
                      <CheckIcon /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={cardStyle}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>
                  For families
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {['Peace of mind between visits', 'Real-time updates after every call', 'Coordinate care with navigators and volunteers'].map((item) => (
                    <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '18px', color: 'var(--color-text-secondary)' }}>
                      <CheckIcon /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Pricing preview */}
        <section style={{ backgroundColor: 'var(--color-cream)', padding: '80px 32px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={sectionHeading}>Simple, honest pricing</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '20px', marginBottom: '48px' }}>
              No hidden fees. No long-term contracts.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '40px',
              }}
            >
              {plans.map((plan) => (
                <div key={plan.name} style={cardStyle}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', marginBottom: '8px' }}>
                    {plan.name}
                  </h3>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 600, color: 'var(--color-navy)' }}>
                    {plan.price}
                    {plan.price !== 'Custom' && <span style={{ fontSize: '15px', fontWeight: 400, color: 'var(--color-text-muted)' }}>/mo</span>}
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/pricing"
              style={{
                backgroundColor: 'var(--color-navy)',
                color: 'var(--color-cream)',
                fontFamily: 'var(--font-body)',
                fontSize: '18px',
                fontWeight: 500,
                padding: '16px 32px',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: '56px',
              }}
            >
              See full pricing
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section style={{ backgroundColor: 'var(--color-navy)', padding: '80px 32px', textAlign: 'center' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 500,
                color: 'var(--color-cream)',
                letterSpacing: '-0.01em',
                marginBottom: '20px',
              }}
            >
              Your parent deserves to feel remembered.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '20px', color: 'rgba(250,250,245,0.75)', marginBottom: '40px' }}>
              Join families who&apos;ve found peace of mind with ThriveAtHome.
            </p>
            <Link
              href="/signup"
              style={{
                backgroundColor: 'var(--color-teal)',
                color: 'white',
                fontFamily: 'var(--font-body)',
                fontSize: '18px',
                fontWeight: 500,
                padding: '16px 40px',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: '56px',
              }}
            >
              Start caring now
            </Link>
          </div>
        </section>
      </main>

      {/* 7. Footer */}
      <footer style={{ backgroundColor: 'var(--color-navy-dark)', padding: '32px', textAlign: 'center' }}>
        <p style={{ color: 'rgba(250,250,245,0.5)', fontSize: '15px', fontFamily: 'var(--font-body)', margin: 0 }}>
          © 2026 ThriveAtHome. All rights reserved.{' '}
          <Link href="/privacy" style={{ color: 'rgba(250,250,245,0.6)', textDecoration: 'underline' }}>Privacy</Link>
          {' · '}
          <Link href="/terms" style={{ color: 'rgba(250,250,245,0.6)', textDecoration: 'underline' }}>Terms</Link>
          {' · '}
          <Link href="/crisis" style={{ color: 'rgba(250,250,245,0.6)', textDecoration: 'underline' }}>Crisis</Link>
          {' · '}
          <a href="mailto:support@thriveathome.com" style={{ color: 'rgba(250,250,245,0.6)', textDecoration: 'underline' }}>Contact</a>
          {' · '}
          <Link href="/for-families" style={{ color: 'rgba(250,250,245,0.6)', textDecoration: 'underline' }}>For Families</Link>
          {' · '}
          <Link href="/for-volunteers" style={{ color: 'rgba(250,250,245,0.6)', textDecoration: 'underline' }}>For Volunteers</Link>
        </p>
      </footer>
    </div>
  )
}
