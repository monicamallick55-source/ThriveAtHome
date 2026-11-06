/**
 * app/team/page.tsx — public About / Team page
 * No auth guard — publicly accessible.
 */
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Our Team — ThriveAtHome',
  description: 'Meet the people behind ThriveAtHome — a mission-driven team helping seniors live with confidence, safety, and connection.',
}

const TEAM = [
  {
    name: 'Mohini Patel',
    role: 'Founder & CEO',
    bio: 'Former family caregiver who saw firsthand how isolated aging parents become. Built ThriveAtHome to give every senior the support system her family wished they had.',
    avatar: '👩‍💼',
  },
  {
    name: 'Dr. Sarah Chen',
    role: 'Chief Care Officer',
    bio: 'Geriatric nurse practitioner with 15 years in home-based care. Leads our clinical protocols and care navigator training.',
    avatar: '👩‍⚕️',
  },
  {
    name: 'Marcus Williams',
    role: 'Head of Technology',
    bio: 'AI and voice systems engineer. Built the Aria call pipeline that checks in on thousands of seniors every day.',
    avatar: '👨‍💻',
  },
  {
    name: 'Elena Reyes',
    role: 'Community Director',
    bio: 'Former director at a Village Network chapter. Bridges the gap between our platform and local volunteers, services, and programs.',
    avatar: '👩‍🤝‍👩',
  },
]

const VALUES = [
  { icon: '❤️', title: 'Dignity first', desc: 'Every feature is designed around the senior — not the caregiver, not the insurer.' },
  { icon: '🤝', title: 'Human + AI', desc: 'Technology handles the routine; real people handle what matters.' },
  { icon: '🌱', title: 'Community-rooted', desc: 'We work alongside Villages, faith groups, and local services — not around them.' },
  { icon: '🔒', title: 'Privacy by design', desc: 'Seniors own their data. We never sell it, never share it without consent.' },
]

export default function TeamPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafaf7', fontFamily: 'var(--font-body, system-ui, sans-serif)' }}>
      {/* Nav */}
      <nav style={{ backgroundColor: '#1b2a4a', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: '22px', color: '#fafaf7', fontWeight: 500, textDecoration: 'none' }}>
          ThriveAtHome
        </Link>
        <div style={{ display: 'flex', gap: '24px' }}>
          <Link href="/about" style={{ color: 'rgba(250,250,247,0.75)', fontSize: '15px', textDecoration: 'none' }}>About</Link>
          <Link href="/employers" style={{ color: 'rgba(250,250,247,0.75)', fontSize: '15px', textDecoration: 'none' }}>Employers</Link>
          <Link href="/login" style={{ color: '#fafaf7', fontSize: '15px', textDecoration: 'none' }}>Sign in</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ backgroundColor: '#1b2a4a', padding: '64px 32px 72px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 500, color: '#fafaf7', marginBottom: '16px' }}>
          We built this for our own families
        </h1>
        <p style={{ fontSize: '18px', color: 'rgba(250,250,247,0.75)', maxWidth: '580px', margin: '0 auto', lineHeight: 1.65 }}>
          ThriveAtHome started when a founder couldn't sleep worrying about her mother living alone. We turned that worry into a platform that gives families peace of mind.
        </p>
      </section>

      {/* Values */}
      <section style={{ maxWidth: '880px', margin: '0 auto', padding: '64px 32px 48px' }}>
        <h2 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: '26px', fontWeight: 500, color: '#1b2a4a', textAlign: 'center', marginBottom: '36px' }}>
          What we believe
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '20px' }}>
          {VALUES.map((v) => (
            <div key={v.title} style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e8e4de', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>{v.icon}</div>
              <h3 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: '17px', fontWeight: 500, color: '#1b2a4a', marginBottom: '6px' }}>{v.title}</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section style={{ maxWidth: '880px', margin: '0 auto', padding: '16px 32px 72px' }}>
        <h2 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: '26px', fontWeight: 500, color: '#1b2a4a', textAlign: 'center', marginBottom: '36px' }}>
          Meet the team
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
          {TEAM.map((member) => (
            <div key={member.name} style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #e8e4de', padding: '28px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', textAlign: 'center' }}>
              <div style={{ fontSize: '52px', marginBottom: '14px' }}>{member.avatar}</div>
              <h3 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: '18px', fontWeight: 500, color: '#1b2a4a', marginBottom: '4px' }}>{member.name}</h3>
              <p style={{ fontSize: '13px', color: '#3ba08c', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{member.role}</p>
              <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.65 }}>{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ backgroundColor: '#f0ede8', padding: '56px 32px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: '24px', fontWeight: 500, color: '#1b2a4a', marginBottom: '14px' }}>
          Join our mission
        </h2>
        <p style={{ color: '#6b7280', maxWidth: '480px', margin: '0 auto 28px', lineHeight: 1.6 }}>
          We're hiring care navigators, engineers, and community builders. Come work on something that matters.
        </p>
        <Link
          href="/careers"
          style={{ display: 'inline-block', backgroundColor: '#1b2a4a', color: '#fafaf7', padding: '12px 28px', borderRadius: '8px', fontSize: '16px', fontWeight: 600, textDecoration: 'none' }}
        >
          View open roles
        </Link>
      </section>

      <footer style={{ borderTop: '1px solid #e8e4de', padding: '28px 32px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
        © {new Date().getFullYear()} ThriveAtHome · <Link href="/privacy" style={{ color: '#9ca3af' }}>Privacy</Link> · <Link href="/terms" style={{ color: '#9ca3af' }}>Terms</Link>
      </footer>
    </div>
  )
}
