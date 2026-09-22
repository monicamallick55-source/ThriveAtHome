import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'For Families — ThriveAtHome',
  description: 'See how ThriveAtHome gives adult children peace of mind about an aging parent living independently.',
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ display: 'inline', flexShrink: 0 }}>
      <path d="M3 8l3.5 3.5L13 5" stroke="var(--color-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
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
  fontFamily: 'var(--font-display)', fontSize: '34px', fontWeight: 500,
  color: 'var(--color-navy)', letterSpacing: '-0.01em', marginBottom: '16px',
}
const bodyText: React.CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: '18px', lineHeight: 1.7, color: 'var(--color-text-secondary)',
}
const ctaPrimary: React.CSSProperties = {
  backgroundColor: 'var(--color-navy)', color: 'var(--color-cream)', fontFamily: 'var(--font-body)',
  fontSize: '18px', fontWeight: 500, padding: '16px 32px', borderRadius: 'var(--radius-md)',
  textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: '56px',
}

export default function ForFamiliesPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={navStyle}>
        <div style={navInner}>
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--color-navy)', fontWeight: 500, textDecoration: 'none' }}>
            ThriveAtHome
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/login" style={{ color: 'var(--color-navy)', fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 500, padding: '8px 20px', textDecoration: 'none' }}>Sign in</Link>
            <Link href="/signup" style={ctaPrimary}>Get started</Link>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {/* Hero */}
        <section style={{ padding: '80px 32px 64px', background: 'radial-gradient(ellipse at 15% 15%, rgba(232,245,244,0.7) 0%, transparent 50%), var(--color-cream)' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-teal)', marginBottom: '20px' }}>
              For adult children
            </p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 500, color: 'var(--color-navy)', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '24px' }}>
              You can&apos;t be there every day.<br />Now you don&apos;t have to worry every day either.
            </h1>
            <p style={{ ...bodyText, fontSize: '20px', maxWidth: '600px', margin: '0 auto 32px' }}>
              ThriveAtHome calls your parent every morning, tells you how they&apos;re really doing, and puts real
              people behind them the moment something needs attention.
            </p>
            <Link href="/signup" style={ctaPrimary}>Enroll your parent</Link>
          </div>
        </section>

        {/* What families see */}
        <section style={{ backgroundColor: '#FFFFFF', padding: '80px 32px' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ ...sectionTitle, textAlign: 'center' }}>What you&apos;ll actually see</h2>
            <p style={{ ...bodyText, textAlign: 'center', maxWidth: '600px', margin: '0 auto 56px' }}>
              Every call becomes a plain-English update — not a wall of medical data.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px' }}>
              {[
                { icon: '📞', title: 'A daily call summary', desc: 'How they slept, how they’re feeling, whether medication was taken — in your inbox minutes after the call ends.' },
                { icon: '📈', title: 'A mood and wellness trend', desc: 'See patterns over weeks, not just one snapshot — so a bad Tuesday doesn’t get lost, and a bad month doesn’t get missed.' },
                { icon: '🔔', title: 'Instant alerts that matter', desc: 'Missed calls, mood drops, or anything urgent reach you and your family within minutes — not buried in a report.' },
                { icon: '👥', title: 'One shared view for the whole family', desc: 'Siblings, spouses, and caregivers all see the same dashboard — no more "did anyone check on Mom today?" texts.' },
              ].map(f => (
                <div key={f.title} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: '36px' }}>{f.icon}</span>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>{f.title}</h3>
                  <p style={{ ...bodyText, fontSize: '16px', margin: 0 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dashboard preview */}
        <section style={{ backgroundColor: 'var(--color-cream)', padding: '80px 32px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={sectionTitle}>Your family dashboard</h2>
            <p style={{ ...bodyText, maxWidth: '600px', margin: '0 auto 40px' }}>
              One page tells the whole story: today&apos;s check-in, this week&apos;s trend, any open alerts, and tasks
              the family is coordinating together — documents, appointments, visits.
            </p>
            <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-xl)', padding: '32px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-warm-grey)', textAlign: 'left', maxWidth: '460px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <span style={{ fontSize: '32px' }}>😊</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)' }}>Margaret Chen</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>Checked in this morning, 8:14am</div>
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Mood: 8/10 — feeling great', 'Medication taken ✓', 'No alerts this week', '2 open family tasks'].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)' }}>
                    <CheckIcon /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Peace of mind */}
        <section style={{ backgroundColor: '#FFFFFF', padding: '80px 32px' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={sectionTitle}>Peace of mind, not surveillance</h2>
            <p style={bodyText}>
              ThriveAtHome isn&apos;t a camera in your parent&apos;s living room. It&apos;s a warm daily conversation that
              respects their independence — and quietly makes sure someone would notice if something were wrong.
              Your parent decides what to share. You get a summary, not a transcript, unless something needs
              your attention.
            </p>
          </div>
        </section>

        {/* How to enroll */}
        <section style={{ backgroundColor: 'var(--color-navy)', padding: '80px 32px' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ ...sectionTitle, color: 'var(--color-cream)' }}>How to enroll a parent</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', margin: '40px 0' }}>
              {[
                { step: '1', title: 'Create your account', desc: 'Sign up as the family member — takes about 2 minutes.' },
                { step: '2', title: 'Tell us about them', desc: 'Their name, routine, interests, and what matters to you both.' },
                { step: '3', title: 'Aria starts calling', desc: 'A warm daily check-in begins — you see the first summary the same day.' },
              ].map(s => (
                <div key={s.step}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-teal)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', fontWeight: 700, margin: '0 auto 16px' }}>{s.step}</div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--color-cream)', fontWeight: 500, marginBottom: '8px' }}>{s.title}</h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'rgba(250,250,245,0.75)', lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              ))}
            </div>
            <Link href="/signup" style={{ ...ctaPrimary, backgroundColor: 'var(--color-teal)' }}>Enroll your parent</Link>
          </div>
        </section>
      </main>

      <footer style={{ backgroundColor: 'var(--color-navy-dark)', padding: '32px', textAlign: 'center' }}>
        <p style={{ color: 'rgba(250,250,245,0.5)', fontSize: '15px', fontFamily: 'var(--font-body)', margin: 0 }}>
          © 2025 ThriveAtHome. All rights reserved.{' '}
          <Link href="/privacy" style={{ color: 'rgba(250,250,245,0.6)', textDecoration: 'underline' }}>Privacy</Link>
          {' · '}
          <Link href="/terms" style={{ color: 'rgba(250,250,245,0.6)', textDecoration: 'underline' }}>Terms</Link>
        </p>
      </footer>
    </div>
  )
}
