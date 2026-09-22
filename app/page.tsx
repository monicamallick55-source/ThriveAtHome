import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'ThriveAtHome — Peace of mind for the people you love',
  description: 'Daily AI check-ins, real-time family updates, and a care network that treats your senior like family.',
}

function PhoneIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="var(--color-teal-muted)" />
      <path d="M15 14h2l2 5-1.5 1.5a11 11 0 005 5L24 24l5 2v2a2 2 0 01-2 2A16 16 0 0113 14a2 2 0 012-2z" fill="var(--color-teal)" strokeWidth="0" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="var(--color-teal-muted)" />
      <path d="M20 12a6 6 0 00-6 6v4l-1.5 2h15L26 22v-4a6 6 0 00-6-6zm0 16a2 2 0 004 0h-4z" fill="var(--color-teal)" />
    </svg>
  )
}

function HandsIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="var(--color-teal-muted)" />
      <path d="M14 20c0-1 .9-2 2-2s2 .9 2 2v-6a2 2 0 114 0v6a2 2 0 114 0v2c0 3.3-2.7 6-6 6s-6-2.7-6-6v-2z" fill="var(--color-teal)" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ display: 'inline', flexShrink: 0 }}>
      <path d="M3 8l3.5 3.5L13 5" stroke="var(--color-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

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
                transition: 'all 0.2s',
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
                transition: 'all 0.2s',
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
        {/* Hero section */}
        <section
          style={{
            minHeight: 'calc(100vh - 72px)',
            display: 'flex',
            alignItems: 'center',
            background: 'radial-gradient(ellipse at 15% 15%, rgba(232,245,244,0.7) 0%, transparent 50%), radial-gradient(ellipse at 85% 85%, rgba(27,58,107,0.06) 0%, transparent 50%), var(--color-cream)',
            padding: '64px 32px',
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr', gap: '64px', alignItems: 'center' }}>
            {/* Left column */}
            <div style={{ maxWidth: '600px' }}>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--color-teal)',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckIcon /> Trusted by families across America
              </p>

              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(36px, 6vw, 52px)',
                  fontWeight: 500,
                  color: 'var(--color-navy)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  marginBottom: '24px',
                }}
              >
                Peace of mind.<br />
                Independence for those<br />
                you love.
              </h1>

              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '20px',
                  lineHeight: 1.65,
                  color: 'var(--color-text-secondary)',
                  maxWidth: '520px',
                  marginBottom: '40px',
                }}
              >
                Daily AI check-ins, real-time family updates, and a care network
                that treats your senior like family — not a patient.
              </p>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
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
                    transition: 'all 0.2s',
                  }}
                >
                  Start free trial
                </Link>
                <Link
                  href="#features"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--color-navy)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '18px',
                    fontWeight: 500,
                    padding: '16px 32px',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    minHeight: '56px',
                    transition: 'all 0.2s',
                  }}
                >
                  See how it works
                </Link>
              </div>

              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {['No contracts', 'Cancel anytime', 'HIPAA compliant'].map((item) => (
                  <span
                    key={item}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--color-text-muted)',
                      fontSize: '15px',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <CheckIcon /> {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Right column — mock wellness card */}
            <div
              style={{
                display: 'none',
                justifyContent: 'center',
                alignItems: 'flex-start',
              }}
              className="hero-card-col"
              aria-hidden="true"
            >
              <div
                style={{
                  backgroundColor: 'var(--color-warm-white)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '28px',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--color-warm-grey)',
                  transform: 'rotate(1deg)',
                  maxWidth: '360px',
                  width: '100%',
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Today&apos;s check-in
                  </span>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '24px',
                      fontWeight: 500,
                      color: 'var(--color-navy)',
                      margin: '4px 0 0',
                    }}
                  >
                    Margaret Chen
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '36px', lineHeight: 1 }}>😊</span>
                  <div>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '28px',
                        fontWeight: 600,
                        color: 'var(--color-mood-high)',
                        lineHeight: 1,
                      }}
                    >
                      8/10
                    </span>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', margin: '2px 0 0' }}>
                      Feeling great
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  <span
                    style={{
                      backgroundColor: 'var(--color-teal-muted)',
                      color: 'var(--color-teal)',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '13px',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 500,
                    }}
                  >
                    ✓ Medication taken
                  </span>
                  <span
                    style={{
                      backgroundColor: 'var(--color-warm-grey)',
                      color: 'var(--color-text-secondary)',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '13px',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    Energy 7/10
                  </span>
                </div>

                <div
                  style={{
                    borderTop: '1px solid var(--color-warm-grey)',
                    paddingTop: '16px',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '17px',
                      fontStyle: 'italic',
                      color: 'var(--color-text-primary)',
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    &ldquo;Margaret had a wonderful morning. She mentioned her roses are blooming early this year.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section
          id="features"
          style={{
            backgroundColor: '#FFFFFF',
            padding: '80px 32px',
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '34px',
                  fontWeight: 500,
                  color: 'var(--color-navy)',
                  letterSpacing: '-0.01em',
                  marginBottom: '16px',
                }}
              >
                A complete care companion
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '20px', maxWidth: '560px', margin: '0 auto' }}>
                Everything your family needs, quietly working in the background.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '48px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <PhoneIcon />
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '28px',
                    fontWeight: 500,
                    color: 'var(--color-navy)',
                    letterSpacing: '-0.01em',
                    margin: 0,
                  }}
                >
                  Aria calls every morning.
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '18px', lineHeight: 1.65, margin: 0 }}>
                  Our AI care companion calls your senior daily — a warm, natural conversation
                  that checks in on mood, sleep, medications, and wellbeing. Not a checklist. A connection.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <BellIcon />
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '28px',
                    fontWeight: 500,
                    color: 'var(--color-navy)',
                    letterSpacing: '-0.01em',
                    margin: 0,
                  }}
                >
                  You know within minutes.
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '18px', lineHeight: 1.65, margin: 0 }}>
                  After every call, your family gets an instant update — what was discussed,
                  how they&apos;re feeling, anything that needs attention. No more wondering.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <HandsIcon />
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '28px',
                    fontWeight: 500,
                    color: 'var(--color-navy)',
                    letterSpacing: '-0.01em',
                    margin: 0,
                  }}
                >
                  People, not just technology.
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '18px', lineHeight: 1.65, margin: 0 }}>
                  When something needs a human touch, our care navigators step in —
                  coordinating volunteers, connecting families, and making sure no one falls through the cracks.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing section */}
        <section
          style={{
            backgroundColor: 'var(--color-cream)',
            padding: '80px 32px',
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '34px',
                  fontWeight: 500,
                  color: 'var(--color-navy)',
                  letterSpacing: '-0.01em',
                  marginBottom: '16px',
                }}
              >
                Simple, honest pricing
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '20px' }}>
                No hidden fees. No long-term contracts. Start for free.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '24px',
                alignItems: 'start',
              }}
            >
              {/* Basics */}
              <div
                style={{
                  backgroundColor: 'var(--color-warm-white)',
                  border: '1px solid var(--color-warm-grey)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '32px',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--color-navy)', marginBottom: '8px' }}>Basics</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '34px', fontWeight: 600, color: 'var(--color-navy)' }}>$29</span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '18px' }}>/month</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {['Daily AI check-in call', 'Family dashboard', 'Mood & wellness tracking', 'Email alerts'].map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', color: 'var(--color-text-secondary)' }}>
                      <CheckIcon /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '56px', backgroundColor: 'transparent', border: '1.5px solid var(--color-navy)', color: 'var(--color-navy)', borderRadius: 'var(--radius-md)', fontSize: '18px', fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s' }}>
                  Get started
                </Link>
              </div>

              {/* Connect — Most popular */}
              <div
                style={{
                  backgroundColor: 'var(--color-warm-white)',
                  border: '2px solid var(--color-teal)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '32px',
                  boxShadow: 'var(--shadow-lg)',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'var(--color-teal)',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: '4px 16px',
                    borderRadius: 'var(--radius-full)',
                    fontFamily: 'var(--font-body)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Most popular
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--color-navy)', marginBottom: '8px' }}>Connect</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '34px', fontWeight: 600, color: 'var(--color-navy)' }}>$49</span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '18px' }}>/month</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {['Everything in Basics', 'Family task coordination', 'Document vault', 'SMS & push alerts', 'Family messaging'].map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', color: 'var(--color-text-secondary)' }}>
                      <CheckIcon /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '56px', backgroundColor: 'var(--color-teal)', color: 'white', borderRadius: 'var(--radius-md)', fontSize: '18px', fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s' }}>
                  Start free trial
                </Link>
              </div>

              {/* Complete */}
              <div
                style={{
                  backgroundColor: 'var(--color-warm-white)',
                  border: '1px solid var(--color-warm-grey)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '32px',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--color-navy)', marginBottom: '8px' }}>Complete</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '34px', fontWeight: 600, color: 'var(--color-navy)' }}>$89</span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '18px' }}>/month</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {['Everything in Connect', 'Dedicated care navigator', 'Volunteer coordination', 'Priority crisis response', 'Monthly care reports'].map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', color: 'var(--color-text-secondary)' }}>
                      <CheckIcon /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '56px', backgroundColor: 'transparent', border: '1.5px solid var(--color-navy)', color: 'var(--color-navy)', borderRadius: 'var(--radius-md)', fontSize: '18px', fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s' }}>
                  Get started
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section
          style={{
            backgroundColor: 'var(--color-navy)',
            padding: '80px 32px',
            textAlign: 'center',
          }}
        >
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
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '20px',
                color: 'rgba(250,250,245,0.75)',
                marginBottom: '40px',
              }}
            >
              Join thousands of families who&apos;ve found peace of mind.
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
                transition: 'all 0.2s',
              }}
            >
              Start caring now
            </Link>
          </div>
        </section>
      </main>

      <footer
        style={{
          backgroundColor: 'var(--color-navy-dark)',
          padding: '32px',
          textAlign: 'center',
        }}
      >
        <p style={{ color: 'rgba(250,250,245,0.5)', fontSize: '15px', fontFamily: 'var(--font-body)', margin: 0 }}>
          © 2025 ThriveAtHome. All rights reserved.{' '}
          <Link href="/privacy" style={{ color: 'rgba(250,250,245,0.6)', textDecoration: 'underline' }}>Privacy</Link>
          {' · '}
          <Link href="/terms" style={{ color: 'rgba(250,250,245,0.6)', textDecoration: 'underline' }}>Terms</Link>
          {' · '}
          <Link href="/for-families" style={{ color: 'rgba(250,250,245,0.6)', textDecoration: 'underline' }}>For Families</Link>
          {' · '}
          <Link href="/for-volunteers" style={{ color: 'rgba(250,250,245,0.6)', textDecoration: 'underline' }}>For Volunteers</Link>
        </p>
      </footer>

      <style>{`
        @media (min-width: 900px) {
          .hero-card-col {
            display: flex !important;
          }
          section:first-of-type > div {
            grid-template-columns: 3fr 2fr !important;
          }
        }
      `}</style>
    </div>
  )
}
