import type { Metadata } from 'next'
import Link from 'next/link'
import QuinnWidget from '@/components/shared/QuinnWidget'

export const metadata: Metadata = {
  title: 'ThriveAtHome — Where Seniors Thrive Together',
  description: 'ThriveAtHome helps seniors thrive at home with daily companion calls, a matched human buddy, 25+ communities, and family peace of mind.',
}

const heading2: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'clamp(28px, 3.5vw, 40px)',
  fontWeight: 500,
  color: 'var(--color-navy)',
  letterSpacing: '-0.01em',
  lineHeight: 1.2,
}

const bodyText: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '17px',
  lineHeight: 1.65,
  color: 'var(--color-text-secondary)',
}

const card: React.CSSProperties = {
  backgroundColor: 'var(--color-warm-white)',
  border: '1px solid var(--color-warm-grey)',
  borderRadius: 'var(--radius-xl)',
  padding: '28px',
  boxShadow: 'var(--shadow-card)',
}

const sectionPad: React.CSSProperties = { padding: '80px 24px' }
const sectionPadAlt: React.CSSProperties = { padding: '80px 24px', backgroundColor: 'var(--color-cream)' }
const sectionPadDark: React.CSSProperties = { padding: '80px 24px', backgroundColor: 'var(--color-navy)' }
const maxW: React.CSSProperties = { maxWidth: '1160px', margin: '0 auto', width: '100%' }

function CheckIcon({ color = 'var(--color-teal)' }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: '2px' }}>
      <circle cx="9" cy="9" r="9" fill={color} opacity="0.15" />
      <path d="M5 9l3 3 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'inline-block',
      fontFamily: 'var(--font-body)',
      fontSize: '12px', fontWeight: 700,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      color: 'var(--color-teal)',
      backgroundColor: 'rgba(0,139,130,0.08)',
      border: '1px solid rgba(0,139,130,0.2)',
      borderRadius: '100px', padding: '4px 14px', marginBottom: '16px',
    }}>{children}</div>
  )
}

function CTAButton({ href, children, variant = 'navy', size = 'md' }: {
  href: string; children: React.ReactNode; variant?: 'navy' | 'teal' | 'outline' | 'white'; size?: 'md' | 'lg'
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-body)', fontWeight: 600, textDecoration: 'none',
    borderRadius: 'var(--radius-md)', whiteSpace: 'nowrap',
    fontSize: size === 'lg' ? '19px' : '17px',
    padding: size === 'lg' ? '16px 36px' : '12px 24px',
    minHeight: size === 'lg' ? '58px' : '48px',
  }
  const variants: Record<string, React.CSSProperties> = {
    navy: { backgroundColor: 'var(--color-navy)', color: 'var(--color-cream)' },
    teal: { backgroundColor: 'var(--color-teal)', color: 'white' },
    outline: { backgroundColor: 'transparent', color: 'var(--color-navy)', border: '1.5px solid var(--color-navy)' },
    white: { backgroundColor: 'white', color: 'var(--color-navy)' },
  }
  return <Link href={href} style={{ ...base, ...variants[variant] }}>{children}</Link>
}

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-cream)', overflowX: 'clip' }}>
      <main style={{ flex: 1 }}>

        {/* ── 1. HERO ── */}
        <section style={{
          background: 'radial-gradient(ellipse at 10% 20%, rgba(0,139,130,0.08) 0%, transparent 55%), radial-gradient(ellipse at 90% 80%, rgba(27,58,107,0.06) 0%, transparent 55%), var(--color-cream)',
          padding: 'clamp(64px, 10vw, 112px) 24px 80px',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <SectionLabel>Serving seniors across the United States</SectionLabel>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(34px, 6vw, 58px)',
              fontWeight: 500, color: 'var(--color-navy)',
              letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: '24px',
            }}>
              Loneliness is the real risk.<br />Connection is the answer.
            </h1>
            <p style={{ ...bodyText, fontSize: '20px', maxWidth: '620px', margin: '0 auto 40px', lineHeight: 1.7 }}>
              ThriveAtHome surrounds seniors with real connection — a daily companion call, a matched human buddy,
              25+ communities, and a family that stays close no matter the distance.
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px' }}>
              <CTAButton href="/signup" variant="navy" size="lg">Join as a member</CTAButton>
              <CTAButton href="#pricing" variant="teal" size="lg">See plans &amp; pricing</CTAButton>
            </div>
            <div style={{ marginBottom: '28px' }}>
              <Link href="#how-it-works" style={{ ...bodyText, fontSize: '15px', color: 'var(--color-text-secondary)', textDecoration: 'underline', textDecorationColor: 'transparent' }}>
                See how it works ↓
              </Link>
            </div>
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {['🔒 HIPAA-compliant', '✓ Human-first, AI-optional', '✓ No long-term contracts', '✓ Cancel any time'].map(t => (
                <span key={t} style={{ ...bodyText, fontSize: '14px', fontWeight: 500 }}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── 2. MISSION STRIP ── */}
        <section style={{ backgroundColor: '#0f2a47', padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ ...maxW, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', padding: '13px 0' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13.5px', color: 'rgba(250,250,245,0.8)', margin: 0, lineHeight: 1.4 }}>
              <span style={{ color: '#6fd4c4', fontWeight: 700 }}>Mission-driven: </span>
              1% of every subscription funds free Community Access memberships for seniors who can&apos;t afford care.
            </p>
            <Link href="/donate" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: '#6fd4c4', textDecoration: 'none', whiteSpace: 'nowrap', border: '1px solid #6fd4c4', borderRadius: '100px', padding: '6px 16px', flexShrink: 0 }}>
              Donate a membership →
            </Link>
          </div>
        </section>

        {/* ── 3. SOCIAL PROOF BAR ── */}
        <section style={{ backgroundColor: 'var(--color-navy)', padding: '18px 24px' }}>
          <p style={{ ...maxW, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(250,250,245,0.55)', margin: '0 auto' }}>
            Serving seniors across the United States · HIPAA-compliant · Anthropic &amp; Retell AI BAAs signed
          </p>
        </section>

        {/* ── 4. HOW IT WORKS ── */}
        <section id="how-it-works" style={{ ...sectionPad, backgroundColor: '#ffffff' }}>
          <div style={maxW}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <SectionLabel>The ThriveAtHome journey</SectionLabel>
              <h2 style={heading2}>Human-first. Technology when it helps.</h2>
              <p style={{ ...bodyText, fontSize: '19px', maxWidth: '560px', margin: '16px auto 0' }}>
                Trust is earned before technology is introduced. Aria is always opt-in — your parent decides.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '32px' }}>
              {[
                { step: '1', days: 'Days 1–7', title: 'Your navigator calls', desc: 'A human navigator personally calls within 24 hours to introduce ThriveAtHome and get to know your parent — no AI yet.' },
                { step: '2', days: 'Days 8–20', title: 'Buddy matched', desc: 'A compatible Human Buddy is matched on interests, language, and background. Regular calls begin.' },
                { step: '3', days: 'Day 21', title: 'Aria introduced — optionally', desc: 'Your parent decides if and when Aria calls. Default is no. No pressure, no automatic enrollment.' },
                { step: '4', days: 'Day 30+', title: 'Full platform activated', desc: "Communities, services, family dashboard, celebrations — everything becomes available at your parent's own pace." },
              ].map(item => (
                <div key={item.step} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--color-navy)', color: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, flexShrink: 0 }}>
                      {item.step}
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-teal)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{item.days}</span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>{item.title}</h3>
                  <p style={{ ...bodyText, margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '48px' }}>
              <Link href="/how-it-works" style={{ ...bodyText, color: 'var(--color-teal)', fontWeight: 600, textDecoration: 'none' }}>
                See the full platform in detail →
              </Link>
            </div>
          </div>
        </section>

        {/* ── 5. FEATURE GRID ── */}
        <section style={sectionPadAlt}>
          <div style={maxW}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <SectionLabel>Everything included</SectionLabel>
              <h2 style={heading2}>One platform. Complete care.</h2>
              <p style={{ ...bodyText, fontSize: '19px', maxWidth: '520px', margin: '16px auto 0' }}>
                Every plan includes human connection, AI support, community, and family tools — working together.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '20px' }}>
              {[
                {
                  icon: '🤖',
                  title: '12 AI agents, 50+ automations',
                  desc: 'Daily check-ins, fraud detection, family summaries, missed-call escalation, grief support, and more — all running automatically in the background.',
                  link: '/how-it-works',
                },
                {
                  icon: '🤝',
                  title: 'Your own Human Buddy',
                  desc: 'Every Connect+ member is matched with a vetted volunteer buddy — compatible by interests, language, and background. Weekly calls that feel like friendship.',
                  link: '/how-it-works',
                },
                {
                  icon: '🧭',
                  title: 'Dedicated care navigator',
                  desc: 'A real human assigned to your parent. Available for coordination, crisis moments, and everything technology can\'t handle.',
                  link: '/how-it-works',
                },
                {
                  icon: '💬',
                  title: '25+ communities',
                  desc: '12 cultural circles, 8 hobby groups, 4 age-stage communities. Cultural identity and shared interests are foundational to belonging.',
                  link: '/how-it-works',
                },
                {
                  icon: '🛡️',
                  title: 'Built-in fraud protection',
                  desc: '7 scam categories monitored across every call, message, and community post. Family alert within minutes. Navigator escalation for urgent flags.',
                  link: '/how-it-works',
                },
                {
                  icon: '👨‍👩‍👧',
                  title: 'Family dashboard',
                  desc: 'Real-time wellness summaries, fraud alerts, celebration tools, and a shared family events calendar. Stay close no matter the distance.',
                  link: '/how-it-works',
                },
              ].map(f => (
                <div key={f.title} style={{ ...card, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '32px' }}>{f.icon}</div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>{f.title}</h3>
                  <p style={{ ...bodyText, margin: 0, fontSize: '15px', flex: 1 }}>{f.desc}</p>
                  <Link href={f.link} style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-teal)', textDecoration: 'none' }}>
                    Learn more →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. PRICING ── */}
        <section style={{ ...sectionPad, backgroundColor: '#ffffff' }} id="pricing">
          <div style={maxW}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <SectionLabel>Pricing</SectionLabel>
              <h2 style={heading2}>Simple, honest pricing</h2>
              <p style={{ ...bodyText, fontSize: '19px', maxWidth: '500px', margin: '16px auto 0' }}>
                Plans for seniors and their families. No hidden fees, no long-term contracts. Save 20% with annual billing.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(230px, 100%), 1fr))', gap: '20px', marginBottom: '40px' }}>
              {[
                {
                  name: 'Thrive Basics', price: '$29', period: '/mo',
                  features: ['Daily Aria check-in calls', 'Family dashboard & alerts', 'Wellness tracking', 'Document vault', 'Fraud monitoring'],
                },
                {
                  name: 'Thrive Connect', price: '$49', period: '/mo',
                  features: ['Everything in Basics', 'Human Buddy (weekly)', '25+ communities', 'Community events & RSVP', 'Skill exchange', 'Benefits finder'],
                },
                {
                  name: 'Thrive Complete', price: '$99', period: '/mo', highlight: true,
                  features: ['Everything in Connect', 'Dedicated navigator (2 hr/mo)', 'Grief & transition support', 'Services marketplace', 'Celebrations & gift sending', 'Family Events Calendar'],
                },
                {
                  name: 'Thrive Premier', price: '$199', period: '/mo',
                  features: ['Everything in Complete', 'Priority navigator (8 hr/mo)', 'Bi-weekly priority Buddy', 'Thrive Device included', 'Concierge line', 'Medicare Advantage eligible'],
                },
              ].map(plan => (
                <div key={plan.name} style={{
                  ...card,
                  ...(plan.highlight ? { borderColor: 'var(--color-teal)', boxShadow: '0 0 0 2px var(--color-teal), var(--shadow-card)', position: 'relative' as const } : {}),
                }}>
                  {plan.highlight && (
                    <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--color-teal)', color: 'white', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', borderRadius: '100px', padding: '3px 14px', whiteSpace: 'nowrap' }}>
                      Most popular
                    </div>
                  )}
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>{plan.name}</h3>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '32px', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '16px' }}>
                    {plan.price}<span style={{ fontSize: '15px', fontWeight: 400, color: 'var(--color-text-muted)' }}>{plan.period}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', gap: '8px' }}>
                        <CheckIcon />
                        <span style={{ ...bodyText, fontSize: '14px', margin: 0 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <CTAButton href="/signup" variant={plan.highlight ? 'teal' : 'outline'}>Get started</CTAButton>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              <Link href="/pricing" style={{ ...bodyText, color: 'var(--color-teal)', fontWeight: 600, textDecoration: 'none', fontSize: '17px' }}>
                See full pricing and annual plans →
              </Link>
            </div>
          </div>
        </section>


        {/* ── RESOURCES & GUIDES ── */}
        <section style={sectionPadAlt}>
          <div style={maxW}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <div style={{ display: 'inline-block', backgroundColor: 'var(--color-teal)', color: 'white', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '20px', marginBottom: '16px' }}>Free Resources</div>
              <h2 style={heading2}>Guides & checklists for every step</h2>
              <p style={{ ...bodyText, maxWidth: '520px', margin: '16px auto 0' }}>Practical, printable guides for home safety, legal planning, caregiver support, and more — all free.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px,100%),1fr))', gap: '20px', marginBottom: '36px' }}>
              {[
                { icon: '🏠', title: 'Home Safety Checklist', desc: '45-point safety audit for every room', href: '/checklists/senior-home-safety-checklist' },
                { icon: '⚖️', title: 'Estate Planning Guide', desc: 'Wills, trusts, powers of attorney', href: '/checklists/estate-planning' },
                { icon: '🤝', title: 'How to Hire a Caregiver', desc: 'Vetting, contracts, red flags to avoid', href: '/checklists/how-to-hire-a-caregiver' },
                { icon: '🚨', title: 'Emergency Preparedness', desc: 'Evacuation plan, med list, contacts', href: '/checklists/emergency-preparedness-checklist' },
                { icon: '💊', title: 'Medical Alert Systems', desc: 'Compare features, costs, and providers', href: '/checklists/medical-alert-systems' },
                { icon: '📦', title: 'Moving & Downsizing', desc: 'Step-by-step guide for a smooth move', href: '/checklists/move-checklist' },
              ].map(item => (
                <Link key={item.href} href={item.href} style={{ ...card, textDecoration: 'none', display: 'block', transition: 'box-shadow 0.15s' }}>
                  <div style={{ fontSize: '28px', marginBottom: '10px' }}>{item.icon}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '15px', color: 'var(--color-navy)', marginBottom: '6px' }}>{item.title}</div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                </Link>
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              <Link href="/checklists" style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '15px', color: 'var(--color-teal)', textDecoration: 'none' }}>Browse all checklists & guides →</Link>
            </div>
          </div>
        </section>

        {/* ── FIND LOCAL HELP ── */}
        <section style={sectionPad}>
          <div style={maxW}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '48px', alignItems: 'center' }}>
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ display: 'inline-block', backgroundColor: '#f0f9f7', color: 'var(--color-teal)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '20px', marginBottom: '16px' }}>Local Resources</div>
                <h2 style={heading2}>Find help in your state</h2>
                <p style={{ ...bodyText, margin: '16px 0 28px' }}>Every state has free programs seniors don&apos;t know about — Medicaid waivers, home-repair grants, meal delivery, legal aid. We&apos;ve mapped them all.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <Link href="/resources/states" style={{ display: 'inline-block', backgroundColor: 'var(--color-navy)', color: 'var(--color-cream)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '15px', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none' }}>Browse state resources →</Link>
                  <Link href="/blog" style={{ display: 'inline-block', border: '1.5px solid var(--color-warm-grey)', color: 'var(--color-navy)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '15px', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none' }}>Read our blog →</Link>
                  <Link href="/directory" style={{ display: 'inline-block', border: '1.5px solid var(--color-teal)', color: 'var(--color-teal)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '15px', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none' }}>Browse partner directory →</Link>
                </div>
              </div>
              <div style={{ flex: '1 1 260px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Medicaid waivers', icon: '💊' },
                  { label: 'Area Agency on Aging', icon: '🏛️' },
                  { label: 'Home repair grants', icon: '🔧' },
                  { label: 'Legal aid', icon: '⚖️' },
                  { label: 'Meal delivery', icon: '🥗' },
                  { label: 'Transportation', icon: '🚗' },
                  { label: 'Caregiver respite', icon: '🤝' },
                  { label: 'Mental health', icon: '💙' },
                ].map(item => (
                  <div key={item.label} style={{ ...card, display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px' }}>
                    <span style={{ fontSize: '20px' }}>{item.icon}</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--color-navy)' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 7. FINAL CTA ── */}
        <section style={{ ...sectionPadDark, textAlign: 'center' }}>
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 4vw, 46px)',
              fontWeight: 500, color: 'var(--color-cream)',
              letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '20px',
            }}>
              Your parent shouldn&apos;t have to face another day alone.
            </h2>
            <p style={{ ...bodyText, fontSize: '19px', color: 'rgba(250,250,245,0.75)', marginBottom: '40px' }}>
              ThriveAtHome tackles senior loneliness with real human connection — and AI that helps when it should. Always at home, always on their terms.
            </p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <CTAButton href="/signup" variant="teal" size="lg">Start for free</CTAButton>
              <CTAButton href="/for-volunteers" variant="white" size="lg">Volunteer as a buddy</CTAButton>
            </div>
            <div className="hidden md:flex" style={{ marginTop: '32px', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <p style={{ color: 'rgba(250,250,245,0.55)', fontSize: '14px', margin: 0 }}>Have questions? Talk to Quinn right now.</p>
              <QuinnWidget variant="ghost" compact />
            </div>
          </div>
        </section>

      </main>

      <div className="md:hidden" style={{ position: 'fixed', right: '16px', bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', zIndex: 40 }}>
        <QuinnWidget variant="teal" iconOnly />
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ backgroundColor: '#0f1c30', padding: '40px 24px 32px' }}>
        <div style={{ ...maxW, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))', gap: '24px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--color-cream)', marginBottom: '12px' }}>ThriveAtHome</div>
              <p style={{ color: 'rgba(250,250,245,0.5)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>Senior independence platform combining AI, human care, and community.</p>
            </div>
            {[
              { label: 'Resources', links: [['Checklists', '/checklists'], ['State Resources', '/resources/states'], ['Blog', '/blog'], ['Find Local Help', '/directory']] },
              { label: 'Product', links: [['How It Works', '/how-it-works'], ['Pricing', '/pricing'], ['Communities', '/dashboard/communities'], ['For Families', '/for-families'], ['For Organizations', '/for-organizations']] },
              { label: 'Volunteer', links: [['Become a Buddy', '/for-volunteers'], ['College students', '/for-volunteers'], ['Corporate teams', '/for-volunteers'], ['K-12 programs', '/for-volunteers']] },
              { label: 'Company', links: [['About', '/about'], ['Privacy', '/privacy'], ['Terms', '/terms'], ['Contact', 'mailto:hello@thriveathome.app']] },
            ].map(col => (
              <div key={col.label}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(250,250,245,0.4)', marginBottom: '12px' }}>{col.label}</div>
                {col.links.map(([label, href]) => (
                  <div key={label} style={{ marginBottom: '8px' }}>
                    <Link href={href} style={{ color: 'rgba(250,250,245,0.65)', fontSize: '14px', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>{label}</Link>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(250,250,245,0.1)', paddingTop: '24px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ color: 'rgba(250,250,245,0.35)', fontSize: '13px', margin: 0, fontFamily: 'var(--font-body)' }}>
              © 2026 ThriveAtHome. All rights reserved. HIPAA-compliant platform.
            </p>
            <Link href="/crisis" style={{ color: 'rgba(250,250,245,0.5)', fontSize: '13px', textDecoration: 'underline', fontFamily: 'var(--font-body)' }}>Crisis resources</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
