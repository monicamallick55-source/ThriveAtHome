import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About ThriveAtHome — Helping Seniors Live at Home with Confidence',
  description: 'ThriveAtHome combines AI, human care, and community to help adults 65+ age at home with dignity, safety, and connection.',
}

const STATS = [
  { number: '4,200+', label: 'Members supported' },
  { number: '98%', label: 'Member satisfaction' },
  { number: '340+', label: 'Volunteer companions' },
  { number: '12', label: 'Resource topic areas' },
]

const TEAM = [
  { name: 'Monica Mallick', role: 'Founder & CEO', bio: 'Spent a decade in senior care technology before founding ThriveAtHome after watching her own family navigate the challenges of aging at home.' },
  { name: 'Care Navigators', role: 'Human Support Team', bio: 'Certified Care Navigators with backgrounds in social work, nursing, and elder law — the real humans behind every member plan.' },
  { name: 'Aria', role: 'AI Companion', bio: 'ThriveAtHome\'s AI companion calls members daily, checks in on wellbeing, spots early warning signs, and alerts family and navigators when needed.' },
]

const PRESS = ['The New York Times', 'AARP Magazine', 'McKnight\'s Senior Living', 'Forbes', 'NPR']

const VALUES = [
  { emoji: '🏡', title: 'Independence first', body: 'We believe aging at home — with the right support — is better than any alternative. Our entire platform is designed to extend and protect that independence.' },
  { emoji: '🤝', title: 'Human at the core', body: 'AI handles the logistics; humans provide the care. Every member has a real Care Navigator and a volunteer buddy — people who know their name and their story.' },
  { emoji: '🔒', title: 'Trust and privacy', body: 'Seniors and families share deeply personal information with us. We treat it with the care it deserves — no selling data, no surprises, no fine print.' },
  { emoji: '🌍', title: 'Equity in aging', body: 'Quality elder care shouldn\'t depend on what you can afford. Our Community Access program subsidises full membership for seniors who need it most.' },
]

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      {/* Nav */}

      {/* Hero */}
      <div style={{ backgroundColor: 'var(--color-navy)', padding: '72px 24px 80px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: 'var(--color-teal)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>Our story</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 500, color: 'var(--color-cream)', lineHeight: 1.15, letterSpacing: '-0.02em', margin: '0 0 20px', textWrap: 'balance' } as any}>
            Aging at home should feel like living, not surviving
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'rgba(250,250,245,0.8)', lineHeight: 1.7, maxWidth: '580px', margin: '0 auto' }}>
            ThriveAtHome was built because the alternative — moving out of the home you love — is too often the only option families are shown. We think that's wrong, and we're doing something about it.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ backgroundColor: 'var(--color-teal)', padding: '40px 24px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px', textAlign: 'center' }}>
          {STATS.map(s => (
            <div key={s.label}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '38px', fontWeight: 500, color: 'white', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{s.number}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '72px 24px 80px' }}>

        {/* Mission */}
        <section style={{ marginBottom: '80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, color: 'var(--color-teal)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>Our mission</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', lineHeight: 1.25, margin: '0 0 20px' }}>
              Confidence, safety, purpose, and connection — at home
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', lineHeight: 1.75, margin: '0 0 16px' }}>
              We combine an AI companion (Aria), real volunteer buddies, Care Navigators, and a nationwide partner network to wrap every senior in a layer of support that adapts as their needs change.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', lineHeight: 1.75, margin: 0 }}>
              Founded in 2024, ThriveAtHome now serves members in all 50 states and partners with Area Agencies on Aging, senior centres, healthcare providers, and nonprofits to extend its reach to seniors who need it most.
            </p>
          </div>
          <div style={{ backgroundColor: 'var(--color-navy)', borderRadius: 'var(--radius-2xl)', padding: '48px 40px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontStyle: 'italic', color: 'var(--color-cream)', lineHeight: 1.6, margin: '0 0 20px' }}>
              &ldquo;I was worried every single day. Now I get a morning update from Aria and I sleep again.&rdquo;
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(250,250,245,0.55)', margin: 0 }}>— Family member, Seattle WA</p>
          </div>
        </section>

        {/* Values */}
        <section style={{ marginBottom: '80px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, color: 'var(--color-teal)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>What we believe</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 40px' }}>Our values</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '24px' }}>
            {VALUES.map(v => (
              <div key={v.title} style={{ backgroundColor: 'white', borderRadius: 'var(--radius-xl)', border: '1.5px solid var(--color-warm-grey)', padding: '28px 32px', display: 'flex', gap: '20px' }}>
                <span style={{ fontSize: '28px', lineHeight: 1, flexShrink: 0 }}>{v.emoji}</span>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 8px' }}>{v.title}</h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>{v.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section style={{ marginBottom: '80px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, color: 'var(--color-teal)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>The people behind it</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 40px' }}>Our team</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {TEAM.map(t => (
              <div key={t.name} style={{ backgroundColor: 'white', borderRadius: 'var(--radius-xl)', border: '1.5px solid var(--color-warm-grey)', padding: '28px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'var(--color-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'white', fontWeight: 500 }}>{t.name.charAt(0)}</span>
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 4px' }}>{t.name}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, color: 'var(--color-teal)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 12px' }}>{t.role}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>{t.bio}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Press */}
        <section style={{ marginBottom: '80px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>As seen in</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            {PRESS.map(p => (
              <span key={p} style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 500, color: 'var(--color-navy)', opacity: 0.45, padding: '8px 18px', border: '1px solid var(--color-warm-grey)', borderRadius: '999px' }}>{p}</span>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: 'var(--color-navy)', borderRadius: 'var(--radius-2xl)', padding: '56px 48px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-cream)', margin: '0 0 14px', letterSpacing: '-0.01em' }}>
            Ready to help someone thrive at home?
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'rgba(250,250,245,0.75)', margin: '0 0 32px', lineHeight: 1.65, maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
            Join as a member, refer a senior you love, or partner with us to extend our reach in your community.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{ display: 'inline-block', padding: '14px 28px', backgroundColor: 'var(--color-teal)', color: 'white', borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, textDecoration: 'none' }}>
              Get started free
            </Link>
            <Link href="/contact" style={{ display: 'inline-block', padding: '14px 28px', backgroundColor: 'transparent', color: 'var(--color-cream)', border: '1.5px solid rgba(250,250,245,0.35)', borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, textDecoration: 'none' }}>
              Talk to us
            </Link>
          </div>
        </section>
      </main>

      <footer style={{ textAlign: 'center', padding: '32px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-warm-grey)' }}>
        © 2026 ThriveAtHome · <Link href="/privacy" style={{ color: 'var(--color-text-secondary)' }}>Privacy</Link> · <Link href="/contact" style={{ color: 'var(--color-text-secondary)' }}>Contact</Link>
      </footer>
    </div>
  )
}
