import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'For Volunteers — ThriveAtHome',
  description: 'Become a ThriveAtHome volunteer and make a real difference in a senior’s life.',
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

export default function ForVolunteersPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={navStyle}>
        <div style={navInner}>
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--color-navy)', fontWeight: 500, textDecoration: 'none' }}>
            ThriveAtHome
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/login" style={{ color: 'var(--color-navy)', fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 500, padding: '8px 20px', textDecoration: 'none' }}>Sign in</Link>
            <Link href="/volunteer/apply" style={ctaPrimary}>Apply to volunteer</Link>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {/* Hero */}
        <section style={{ padding: '80px 32px 64px', background: 'radial-gradient(ellipse at 85% 15%, rgba(232,245,244,0.7) 0%, transparent 50%), var(--color-cream)' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-teal)', marginBottom: '20px' }}>
              For volunteers
            </p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 500, color: 'var(--color-navy)', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '24px' }}>
              An hour of your time can change someone&apos;s whole week.
            </h1>
            <p style={{ ...bodyText, fontSize: '20px', maxWidth: '600px', margin: '0 auto 32px' }}>
              Seniors aging at home often want one thing above all: someone to talk to. Become a ThriveAtHome
              volunteer and be that person.
            </p>
            <Link href="/volunteer/apply" style={ctaPrimary}>Apply to volunteer</Link>
          </div>
        </section>

        {/* What volunteers do */}
        <section style={{ backgroundColor: '#FFFFFF', padding: '80px 32px' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ ...sectionTitle, textAlign: 'center' }}>What volunteers do</h2>
            <p style={{ ...bodyText, textAlign: 'center', maxWidth: '600px', margin: '0 auto 56px' }}>
              Every volunteer role is matched to your interests, skills, and availability — nothing is one-size-fits-all.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px' }}>
              {[
                { icon: '💬', title: 'Companionship calls', desc: 'Weekly phone or video calls with a senior you&apos;re matched with — conversation, not caregiving.' },
                { icon: '🚗', title: 'Rides and errands', desc: 'Help with medical transport, grocery runs, or social outings for seniors nearby.' },
                { icon: '🎓', title: 'Skills and expertise', desc: 'Retired professionals share tax help, tech tutoring, legal guidance, or financial planning.' },
                { icon: '🏠', title: 'Neighborly check-ins', desc: 'Simple, local presence — a friendly face who lives nearby and stops by from time to time.' },
              ].map((f: any) => (
                <div key={f.title} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: '36px' }}>{f.icon}</span>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>{f.title}</h3>
                  <p style={{ ...bodyText, fontSize: '16px', margin: 0 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Buddy programme */}
        <section style={{ backgroundColor: 'var(--color-cream)', padding: '80px 32px' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={sectionTitle}>The Buddy Programme</h2>
            <p style={bodyText}>
              Our most popular way to volunteer. You&apos;re matched one-on-one with a senior based on shared
              language, interests, and background. Most buddy pairs talk weekly by phone or video — many grow
              into real friendships that last years. You can request an update on your match anytime, and our
              team checks in with both sides regularly.
            </p>
          </div>
        </section>

        {/* Time commitment + what you get */}
        <section style={{ backgroundColor: '#FFFFFF', padding: '80px 32px' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px' }}>
            <div>
              <h2 style={{ ...sectionTitle, fontSize: '28px' }}>Time commitment</h2>
              <p style={bodyText}>
                As little as 1–2 hours a week. You tell us your availability during sign-up, and we only match
                you with what fits your schedule. No minimum tenure — many volunteers stay for years because
                they want to, not because they have to.
              </p>
            </div>
            <div>
              <h2 style={{ ...sectionTitle, fontSize: '28px' }}>What you get</h2>
              <p style={bodyText}>
                A background check (covered by us), training and support from our navigator team, a community
                of fellow volunteers, and — for corporate volunteers — hours tracked and exported to your
                employer&apos;s giving platform for hour-matching.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: 'var(--color-navy)', padding: '80px 32px', textAlign: 'center' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ ...sectionTitle, color: 'var(--color-cream)' }}>Ready to make a difference?</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'rgba(250,250,245,0.75)', marginBottom: '32px' }}>
              Applications take about 10 minutes. We&apos;ll follow up within 2–3 business days.
            </p>
            <Link href="/volunteer/apply" style={{ ...ctaPrimary, backgroundColor: 'var(--color-teal)' }}>Apply to volunteer</Link>
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
