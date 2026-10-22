import type { Metadata } from 'next'
import Link from 'next/link'
import QuinnWidget from '@/components/shared/QuinnWidget'

export const metadata: Metadata = {
  title: 'ThriveAtHome — Where Seniors Thrive Together',
  description: 'ThriveAtHome tackles loneliness by connecting seniors with daily companion calls, a real human buddy, 25+ communities, and family engagement — so they thrive at home.',
}

// ── Shared style tokens ───────────────────────────────────────────────────────

const heading2: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'clamp(28px, 3.5vw, 40px)',
  fontWeight: 500,
  color: 'var(--color-navy)',
  letterSpacing: '-0.01em',
  lineHeight: 1.2,
}

const heading3: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '22px',
  fontWeight: 500,
  color: 'var(--color-navy)',
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

const tealCard: React.CSSProperties = {
  ...card,
  borderColor: 'rgba(0,139,130,0.18)',
  backgroundColor: 'rgba(0,139,130,0.04)',
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
      fontSize: '12px',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--color-teal)',
      backgroundColor: 'rgba(0,139,130,0.08)',
      border: '1px solid rgba(0,139,130,0.2)',
      borderRadius: '100px',
      padding: '4px 14px',
      marginBottom: '16px',
    }}>
      {children}
    </div>
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

// ── Page ──────────────────────────────────────────────────────────────────────

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
              fontWeight: 500,
              color: 'var(--color-navy)',
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              marginBottom: '24px',
            }}>
              Loneliness is the real risk.<br />Connection is the answer.
            </h1>
            <p style={{ ...bodyText, fontSize: '20px', maxWidth: '620px', margin: '0 auto 40px', lineHeight: 1.7 }}>
              ThriveAtHome helps seniors thrive at home by surrounding them with real connection —
              a daily companion call, a matched human buddy, 25+ communities of people who share
              their world, and a family that stays close no matter the distance.
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px' }}>
              <CTAButton href="/signup" variant="navy" size="lg">Join as a member</CTAButton>
              <CTAButton href="#pricing" variant="teal" size="lg">See plans &amp; pricing</CTAButton>
            </div>
            <div style={{ marginBottom: '28px' }}>
              <Link href="#how-it-works" style={{ ...bodyText, fontSize: '15px', color: 'var(--color-text-secondary)', textDecoration: 'underline', textDecorationColor: 'transparent' }}>See how it works ↓</Link>
            </div>
            {/* Trust signals */}
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {['🔒 HIPAA-compliant', '✓ Human-first, AI-optional', '✓ No long-term contracts', '✓ Cancel any time'].map(t => (
                <span key={t} style={{ ...bodyText, fontSize: '14px', fontWeight: 500 }}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── 2. MISSION STRIP ── */}
        <section style={{ backgroundColor: '#0f2a47', padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ ...maxW, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', padding: '13px 0', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13.5px', color: 'rgba(250,250,245,0.8)', margin: 0, lineHeight: 1.4 }}>
              <span style={{ color: '#6fd4c4', fontWeight: 700 }}>Mission-driven: </span>
              1% of every subscription funds free Community Access memberships for seniors who can&apos;t afford care. Every paid plan helps fund one.
            </p>
            <Link href="/donate" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: '#6fd4c4', textDecoration: 'none', whiteSpace: 'nowrap', border: '1px solid #6fd4c4', borderRadius: '100px', padding: '6px 16px', flexShrink: 0 }}>
              Donate a membership →
            </Link>
          </div>
        </section>

        {/* ── 3. SOCIAL PROOF BAR ── */}
        <section style={{ backgroundColor: 'var(--color-navy)', padding: '18px 24px' }}>
          <p style={{ ...maxW, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(250,250,245,0.55)', margin: '0 auto' }}>
            Serving seniors across the United States · HIPAA-compliant · Anthropic & Retell AI BAAs signed
          </p>
        </section>

        {/* ── 4. HOW IT WORKS (4-step journey) ── */}
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
                { step: '4', days: 'Day 30+', title: 'Full platform activated', desc: 'Communities, services, family dashboard, celebrations — everything becomes available at your parent\'s own pace.' },
              ].map(item => (
                <div key={item.step} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--color-navy)', color: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, flexShrink: 0 }}>
                      {item.step}
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-teal)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{item.days}</span>
                  </div>
                  <h3 style={{ ...heading3, margin: 0 }}>{item.title}</h3>
                  <p style={{ ...bodyText, margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. ARIA — AI COMPANION ── */}
        <section style={sectionPadAlt}>
          <div style={maxW}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '56px', alignItems: 'center' }}>
              <div>
                <SectionLabel>AI companion</SectionLabel>
                <h2 style={{ ...heading2, marginBottom: '16px' }}>Meet Aria — your parent&apos;s daily companion</h2>
                <p style={{ ...bodyText, marginBottom: '24px' }}>
                  Aria is ThriveAtHome&apos;s AI voice companion. Every morning she calls to ask how your parent is feeling, listens to what&apos;s on their mind, checks on medications and sleep, and sends your family a plain-language summary — never a transcript.
                </p>
                {[
                  'Covers mood, energy, sleep, pain, appetite, medications, and social connection',
                  "Adapts frequency: daily, 3× week, or weekly — member's choice",
                  'Injects family event context — mentions birthdays and anniversaries naturally',
                  'Detects fraud patterns in every conversation',
                  'Escalates to a human navigator the moment something sounds off',
                  '12 named AI agents — Aria, Joy, Grace, Hope, Rosa, Claire and more',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <CheckIcon />
                    <span style={{ ...bodyText, margin: 0 }}>{f}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { icon: '📞', title: 'Daily morning calls', desc: 'Warm, conversational — not a questionnaire. Aria remembers what your parent told her last time.' },
                  { icon: '📊', title: 'Family summary', desc: 'After every call, your family dashboard updates with mood, energy, and anything worth knowing.' },
                  { icon: '🚨', title: 'Missed call escalation', desc: '1 missed call: nudge. 2 in a row: navigator calls. 3: welfare check protocol initiated automatically.' },
                  { icon: '🤫', title: 'AI summary only', desc: 'Families never see the raw transcript. Privacy is architectural, not a setting to accidentally turn off.' },
                ].map(item => (
                  <div key={item.title} style={{ ...card, display: 'flex', gap: '16px' }}>
                    <span style={{ fontSize: '26px', flexShrink: 0 }}>{item.icon}</span>
                    <div>
                      <div style={{ ...heading3, fontSize: '17px', marginBottom: '4px' }}>{item.title}</div>
                      <p style={{ ...bodyText, margin: 0, fontSize: '15px' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. HUMAN BUDDY & COMPANION NETWORK ── */}
        <section style={{ ...sectionPad, backgroundColor: '#ffffff' }}>
          <div style={maxW}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <SectionLabel>Human connection</SectionLabel>
              <h2 style={heading2}>Real humans. Real relationships.</h2>
              <p style={{ ...bodyText, fontSize: '19px', maxWidth: '580px', margin: '16px auto 0' }}>
                Loneliness shrinks when someone genuinely shows up. ThriveAtHome makes sure someone always does.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: '24px' }}>
              {[
                { icon: '🤝', title: 'Human Buddy programme', desc: 'Every Connect+ member is matched with a vetted Human Buddy — a volunteer matched on shared interests, language, and background. Weekly calls that feel like catching up with an old friend.' },
                { icon: '🧭', title: 'Dedicated care navigator', desc: 'A human navigator assigned to your parent. Available for coordination, crisis, and the moments technology can\'t handle. Complete+ members get 2 hours per month; Premier gets 8.' },
                { icon: '🎓', title: 'Student & volunteer network', desc: 'College students, K-12 programmes, veterans, faith-community members, retired professionals — 8 categories of volunteer earning service hours, recognition, and real connection.' },
                { icon: '🏢', title: 'Corporate volunteer teams', desc: 'Employee volunteers from corporate partner programmes. Three tiers: Community Partner, Champion, and Leader — with Benevity/YourCause-compatible CSV exports for CSR tracking.' },
                { icon: '💼', title: 'Paid companions', desc: 'Vetted paid companions for errands, event attendance, and social visits — booked through the member portal. From $15/hr, 20% platform fee. Premier members get companion credits.' },
                { icon: '👨‍👩‍👧', title: 'Family reciprocity', desc: 'Families who volunteer through ThriveAtHome earn credits toward their own parent\'s plan — a giving economy built on care.' },
              ].map(f => (
                <div key={f.title} style={card}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>{f.icon}</div>
                  <h3 style={{ ...heading3, marginBottom: '8px' }}>{f.title}</h3>
                  <p style={{ ...bodyText, margin: 0, fontSize: '16px' }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. COMMUNITIES ── */}
        <section style={sectionPadAlt}>
          <div style={maxW}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '56px', alignItems: 'center' }}>
              <div>
                <SectionLabel>Community & events</SectionLabel>
                <h2 style={{ ...heading2, marginBottom: '16px' }}>25+ communities where your parent belongs</h2>
                <p style={{ ...bodyText, marginBottom: '24px' }}>
                  12 cultural and heritage circles. 8 interest and hobby groups. Cultural identity isn&apos;t a nice-to-have — it&apos;s foundational to belonging and wellbeing.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', marginBottom: '24px' }}>
                  {[
                    'Latino/Hispanic Community', 'Chinese-American Community',
                    'South Asian Community', 'African-American Community',
                    'Jewish-American Community', 'Filipino-American Community',
                    'Vietnamese-American Community', 'Korean-American Community',
                    'Arab/Middle Eastern Community', 'Caribbean Community',
                    'Eastern European Community', 'Native American / Indigenous',
                    '+ Book Club, Gardening, Music, Art, Travel, Film, Chess, Cooking',
                  ].map(c => (
                    <div key={c} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <CheckIcon />
                      <span style={{ ...bodyText, fontSize: '14px', margin: 0 }}>{c}</span>
                    </div>
                  ))}
                </div>
                {/* Age-range groups */}
                <div style={{ backgroundColor: 'rgba(0,139,130,0.06)', border: '1px solid rgba(0,139,130,0.15)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: '8px' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-teal)', marginBottom: '10px' }}>Age-stage communities</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                    {[
                      { range: '55–64', label: 'Active Pre-Retirees', desc: 'Still working, planning retirement, navigating the transition' },
                      { range: '65–74', label: 'Early Retirees', desc: 'Newly retired, active lifestyle, travel and new pursuits' },
                      { range: '75–84', label: 'Established Seniors', desc: 'Life wisdom, grandparenting, staying engaged at home' },
                      { range: '85+', label: 'Elder Community', desc: 'Longer-term support, legacy, deep community connection' },
                    ].map(g => (
                      <div key={g.range} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <CheckIcon />
                        <div>
                          <span style={{ ...bodyText, fontSize: '14px', margin: 0, fontWeight: 600 }}>{g.range} · {g.label}</span>
                          <p style={{ ...bodyText, fontSize: '12px', margin: 0, color: 'var(--color-text-muted)' }}>{g.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { icon: '💬', title: 'Circle posts & comments', desc: 'Members share updates, ask questions, and celebrate moments in their communities — with human moderation built in.' },
                  { icon: '📅', title: 'Community events', desc: 'Member-proposed, navigator-approved events. One-tap RSVP, optional ride booking, dial-in and video join options.' },
                  { icon: '✈️', title: 'Senior travel with fellow members', desc: 'Group trips planned and coordinated within the community — from day trips to international travel with people who share your interests and pace.' },
                  { icon: '🔄', title: 'Skill exchange', desc: 'Seniors teach what they know — languages, crafts, cooking, history. Time banking recognises wisdom as an asset.' },
                  { icon: '🎉', title: 'Social potlucks', desc: 'Coordinated cultural potluck events, oral history archives, festival calendars — depth, not just breadth.' },
                ].map(item => (
                  <div key={item.title} style={{ ...tealCard, display: 'flex', gap: '16px' }}>
                    <span style={{ fontSize: '26px', flexShrink: 0 }}>{item.icon}</span>
                    <div>
                      <div style={{ ...heading3, fontSize: '17px', marginBottom: '4px' }}>{item.title}</div>
                      <p style={{ ...bodyText, margin: 0, fontSize: '15px' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 8. SAFETY & FRAUD ── */}
        <section style={{ ...sectionPad, backgroundColor: '#ffffff' }}>
          <div style={maxW}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '56px', alignItems: 'center' }}>
              <div>
                <SectionLabel>Built-in safety</SectionLabel>
                <h2 style={{ ...heading2, marginBottom: '16px' }}>Fraud protection that actually works</h2>
                <p style={{ ...bodyText, marginBottom: '24px' }}>
                  Seniors are the most targeted demographic for financial fraud. ThriveAtHome monitors every interaction — calls, messages, community posts — for 7 scam pattern groups, and alerts the family and navigator instantly.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                  {[
                    'Gift card & wire transfer scams',
                    'Government impersonation',
                    'Grandparent scams',
                    'Tech support fraud',
                    'Lottery & prize fraud',
                    'Romance scams',
                    'Investment & crypto fraud',
                    'Large purchase alerts',
                    'Medicare & SSN phishing',
                    'Crisis phrase detection',
                  ].map(f => (
                    <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <CheckIcon color="#dc2626" />
                      <span style={{ ...bodyText, fontSize: '14px', margin: 0 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { icon: '🛡️', title: 'AI monitoring in every conversation', desc: 'Aria and every AI agent checks call transcripts, community posts, and messages against 7 fraud categories in real time.' },
                  { icon: '📲', title: 'Family fraud alerts (SMS + dashboard)', desc: 'When a pattern is flagged as urgent, your family receives an SMS and a real-time dashboard alert within minutes.' },
                  { icon: '🧭', title: 'Navigator escalation', desc: 'Urgent flags create a critical navigator task. A human steps in to assess and contact your parent and your family.' },
                  { icon: '🔍', title: 'False-positive guard', desc: '"I hung up on the scammer" — understood. The system filters self-protective statements before raising an alert.' },
                ].map(item => (
                  <div key={item.title} style={{ ...card, display: 'flex', gap: '16px', borderLeft: '3px solid #dc2626' }}>
                    <span style={{ fontSize: '26px', flexShrink: 0 }}>{item.icon}</span>
                    <div>
                      <div style={{ ...heading3, fontSize: '17px', marginBottom: '4px' }}>{item.title}</div>
                      <p style={{ ...bodyText, margin: 0, fontSize: '15px' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 9. PRICING (personal tiers) ── */}
        <section style={sectionPadAlt} id="pricing">
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
                  name: 'Thrive Connect', price: '$49', period: '/mo', highlight: false,
                  features: ['Everything in Basics', 'Human Buddy (weekly)', '25+ communities', 'Community events & RSVP', 'Skill exchange', 'Benefits finder (15+ programs)'],
                },
                {
                  name: 'Thrive Complete', price: '$99', period: '/mo', highlight: true,
                  features: ['Everything in Connect', 'Dedicated navigator (2 hr/mo)', 'Grief & transition support (9 pathways)', 'Services marketplace', 'Celebrations & gift sending', 'Family Events Calendar'],
                },
                {
                  name: 'Thrive Premier', price: '$199', period: '/mo',
                  features: ['Everything in Complete', 'Priority navigator (8 hr/mo)', 'Bi-weekly priority Buddy', 'Thrive Device included', 'Concierge line', 'Corporate & Medicare Advantage eligible'],
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
                  <h3 style={{ ...heading3, fontSize: '18px', marginBottom: '8px' }}>{plan.name}</h3>
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

        {/* ── 10. FINAL CTA ── */}
        <section style={{ ...sectionPadDark, textAlign: 'center' }}>
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 4vw, 46px)',
              fontWeight: 500,
              color: 'var(--color-cream)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              marginBottom: '20px',
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

      {/* Mobile: Quinn as a floating icon button (inline version above is md+ only) */}
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
              { label: 'Product', links: [['Features', '#how-it-works'], ['Pricing', '/pricing'], ['Find Local Help', '/partner-directory'], ['Communities', '/dashboard/communities'], ['For Families', '/for-families'], ['For Organizations', '/for-organizations']] },
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
