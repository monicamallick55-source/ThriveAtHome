import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'ThriveAtHome — Senior Independence Platform',
  description: 'ThriveAtHome combines daily AI companion calls, human buddies, 25+ communities, family engagement, and real care navigation so seniors thrive at home.',
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-cream)' }}>

      {/* ── NAV ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: 'rgba(250,250,245,0.95)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--color-warm-grey)',
      }}>
        <div style={{ ...maxW, padding: '0 24px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', fontWeight: 500, letterSpacing: '-0.01em' }}>
            ThriveAtHome
          </span>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Link href="/for-volunteers" style={{ ...bodyText, textDecoration: 'none', padding: '8px 14px', fontSize: '15px', color: 'var(--color-text-secondary)' }}>For Volunteers</Link>
            <Link href="/pricing" style={{ ...bodyText, textDecoration: 'none', padding: '8px 14px', fontSize: '15px', color: 'var(--color-text-secondary)' }}>Pricing</Link>
            <Link href="/login" style={{ ...bodyText, textDecoration: 'none', padding: '8px 16px', fontSize: '15px', color: 'var(--color-navy)', fontWeight: 500 }}>Sign in</Link>
            <CTAButton href="/signup" variant="navy">Get started</CTAButton>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1 }}>

        {/* ── 1. HERO ── */}
        <section style={{
          background: 'radial-gradient(ellipse at 10% 20%, rgba(0,139,130,0.08) 0%, transparent 55%), radial-gradient(ellipse at 90% 80%, rgba(27,58,107,0.06) 0%, transparent 55%), var(--color-cream)',
          padding: 'clamp(64px, 10vw, 112px) 24px 80px',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <SectionLabel>Now serving Bay Area families</SectionLabel>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(34px, 6vw, 58px)',
              fontWeight: 500,
              color: 'var(--color-navy)',
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              marginBottom: '24px',
            }}>
              Your parent deserves a morning call,<br />not a medical alert.
            </h1>
            <p style={{ ...bodyText, fontSize: '20px', maxWidth: '600px', margin: '0 auto 40px', lineHeight: 1.7 }}>
              ThriveAtHome combines Aria&apos;s daily AI companion calls, a real human buddy,
              25+ cultural and interest communities, family engagement, and dedicated
              care navigation — so seniors thrive at home, independently.
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '48px' }}>
              <CTAButton href="/signup" variant="navy" size="lg">Start for free</CTAButton>
              <CTAButton href="#how-it-works" variant="outline" size="lg">See how it works</CTAButton>
            </div>
            {/* Trust signals */}
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {['🔒 HIPAA-compliant', '✓ Human-first, AI-optional', '✓ No long-term contracts', '✓ Cancel any time'].map(t => (
                <span key={t} style={{ ...bodyText, fontSize: '14px', fontWeight: 500 }}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── 2. SOCIAL PROOF BAR ── */}
        <section style={{ backgroundColor: 'var(--color-navy)', padding: '18px 24px' }}>
          <p style={{ ...maxW, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(250,250,245,0.55)', margin: '0 auto' }}>
            Trusted by families across the Bay Area · HIPAA-compliant · Anthropic & Retell AI BAAs signed
          </p>
        </section>

        {/* ── 3. HOW IT WORKS ── */}
        <section id="how-it-works" style={{ ...sectionPad, backgroundColor: '#ffffff' }}>
          <div style={maxW}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <SectionLabel>The ThriveAtHome journey</SectionLabel>
              <h2 style={heading2}>Human-first. Technology when it helps.</h2>
              <p style={{ ...bodyText, fontSize: '19px', maxWidth: '560px', margin: '16px auto 0' }}>
                Trust is earned before technology is introduced. Aria is always opt-in — your parent decides.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px' }}>
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

        {/* ── 4. LAYER 1 — AI & ARIA ── */}
        <section style={sectionPadAlt}>
          <div style={maxW}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '56px', alignItems: 'center' }}>
              <div>
                <SectionLabel>Layer 1 · AI Connection</SectionLabel>
                <h2 style={{ ...heading2, marginBottom: '16px' }}>Meet Aria — your parent&apos;s daily companion</h2>
                <p style={{ ...bodyText, marginBottom: '24px' }}>
                  Aria is ThriveAtHome&apos;s AI voice companion. Every morning she calls to ask how your parent is feeling, listens to what&apos;s on their mind, checks on medications and sleep, and sends your family a plain-language summary — never a transcript.
                </p>
                {[
                  'Covers mood, energy, sleep, pain, appetite, medications, and social connection',
                  'Adapts frequency: daily, 3× week, or weekly — member&apos;s choice',
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

        {/* ── 5. LAYER 2 — HUMAN NETWORK ── */}
        <section style={{ ...sectionPad, backgroundColor: '#ffffff' }}>
          <div style={maxW}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <SectionLabel>Layer 2 · Human Companion Network</SectionLabel>
              <h2 style={heading2}>Real humans. Real relationships.</h2>
              <p style={{ ...bodyText, fontSize: '19px', maxWidth: '580px', margin: '16px auto 0' }}>
                AI handles the daily check-ins. Humans handle the friendship.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
              {[
                { icon: '🤝', title: 'Human Buddy programme', desc: 'Every Connect+ member is matched with a vetted Human Buddy — a volunteer matched on shared interests, language, and background. Weekly calls that feel like catching up with an old friend.' },
                { icon: '🧭', title: 'Dedicated care navigator', desc: 'A human navigator assigned to your parent. Available for coordination, crisis, and the moments technology can\'t handle. Complete+ members get 2 hours per month; Premier gets 8.' },
                { icon: '🎓', title: 'Student & volunteer network', desc: 'College students, K-12 programmes, veterans, faith-community members, retired professionals — 8 categories of volunteer earning service hours, recognition, and real connection.' },
                { icon: '🏢', title: 'Corporate volunteer teams', desc: 'Employee volunteers from corporate partner programmes. Three tiers: Community Partner, Champion, and Leader — with Benevity/YourCause-compatible CSV exports for CSR tracking.' },
                { icon: '💼', title: 'Paid companions', desc: 'Vetted paid companions for errands, event attendance, and social visits — coming with the services marketplace. From $15/hr, 20% platform fee. Premier members get companion credits.' },
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

        {/* ── 6. LAYER 3 — COMMUNITIES ── */}
        <section style={sectionPadAlt}>
          <div style={maxW}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '56px', alignItems: 'center' }}>
              <div>
                <SectionLabel>Layer 3 · Community & Events</SectionLabel>
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
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { icon: '💬', title: 'Circle posts & comments', desc: 'Members share updates, ask questions, and celebrate moments in their communities — with human moderation built in.' },
                  { icon: '📅', title: 'Community events', desc: 'Member-proposed, navigator-approved events. One-tap RSVP, optional ride booking, dial-in and video join options.' },
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

        {/* ── 7. LAYER 4 — SERVICES ── */}
        <section style={{ ...sectionPad, backgroundColor: '#ffffff' }}>
          <div style={maxW}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <SectionLabel>Layer 4 · Services Marketplace</SectionLabel>
              <h2 style={heading2}>Everything your parent needs, arranged with one call</h2>
              <p style={{ ...bodyText, fontSize: '19px', maxWidth: '560px', margin: '16px auto 0' }}>
                Vetted, coordinated services — so your parent never has to navigate providers alone.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {[
                { icon: '🚗', title: 'Transportation', desc: 'Rides to medical appointments, errands, and events. RSVP to a community event and request a ride in one step.' },
                { icon: '🏠', title: 'Home services', desc: 'Light housekeeping, yard work, repairs, and home tasks from trusted, vetted providers.' },
                { icon: '🍲', title: 'Meal delivery', desc: 'Hot meals, grocery delivery, and nutrition planning coordinated through the platform.' },
                { icon: '💻', title: 'Tech help', desc: 'Friendly tech support — help with the phone, tablet, TV, or any device they\'re struggling with.' },
                { icon: '🏥', title: 'Health services', desc: 'Telehealth, prescription delivery, and care coordination — coming Month 12.' },
                { icon: '⚖️', title: 'Legal & financial', desc: 'Benefits discovery (15+ programs), VITA tax assistance, trusted referrals to legal and financial advisors.' },
                { icon: '✈️', title: 'Travel assistance', desc: 'Trip coordination, airport rides, travel companions, and logistics support.' },
                { icon: '🐾', title: 'Pet care', desc: 'Dog walking, pet sitting, vet transport — and a full pet companion profile with Aria\'s awareness.' },
                { icon: '🤗', title: 'Companionship', desc: 'In-person social visits, errand escorts, and event attendance from vetted companion marketplace.' },
              ].map(s => (
                <div key={s.title} style={{ ...card, padding: '20px' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
                  <h3 style={{ ...heading3, fontSize: '16px', marginBottom: '6px' }}>{s.title}</h3>
                  <p style={{ ...bodyText, fontSize: '14px', margin: 0, lineHeight: 1.55 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 8. LAYER 5 — CELEBRATIONS & LIFE STORY ── */}
        <section style={sectionPadAlt}>
          <div style={maxW}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '56px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { icon: '🎂', title: 'Birthday celebration arcs', desc: 'D-7, D-3, D-1, day-of, and D+1 — a full celebration arc, not just a banner. Community posts, voice messages, and family coordination.' },
                  { icon: '📖', title: 'Life story archive', desc: 'Guided questions build a living archive of memories. Memory book PDF created for milestone birthdays.' },
                  { icon: '🎤', title: 'Oral history programme', desc: 'Recorded conversations become a permanent family keepsake — and fuel richer AI conversations for years.' },
                  { icon: '📅', title: 'Family Events Calendar', desc: 'Add family birthdays, anniversaries, graduations, travel. Aria mentions them naturally in the next morning call.' },
                  { icon: '🎁', title: 'Gift sending platform', desc: 'Send notes (free), cards ($4.99), flowers, or a food basket — coordinated from your family dashboard.' },
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
              <div>
                <SectionLabel>Layer 5 · Celebrations & Transitions</SectionLabel>
                <h2 style={{ ...heading2, marginBottom: '16px' }}>Every milestone remembered. Every transition supported.</h2>
                <p style={{ ...bodyText, marginBottom: '28px' }}>
                  Life doesn&apos;t stop at 65 — it keeps producing moments worth celebrating and transitions worth navigating with grace.
                </p>
                <h3 style={{ ...heading3, marginBottom: '12px', fontSize: '18px' }}>9 grief & life transition pathways</h3>
                {[
                  'Loss of a loved one (bereavement)',
                  'Major health diagnosis',
                  'Late-life divorce or separation',
                  'Dementia or MCI diagnosis',
                  'Loss of driving independence',
                  'Adult child moving away',
                  'Housing insecurity or forced move',
                  'Major life change',
                  'Support for caregivers',
                ].map(p => (
                  <div key={p} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                    <CheckIcon />
                    <span style={{ ...bodyText, margin: 0, fontSize: '15px' }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 9. SAFETY & FRAUD ── */}
        <section style={{ ...sectionPad, backgroundColor: '#ffffff' }}>
          <div style={maxW}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '56px', alignItems: 'center' }}>
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

        {/* ── 10. FAMILY DASHBOARD ── */}
        <section style={sectionPadAlt}>
          <div style={maxW}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <SectionLabel>Family engagement</SectionLabel>
              <h2 style={heading2}>Your family dashboard — always in the loop</h2>
              <p style={{ ...bodyText, fontSize: '19px', maxWidth: '560px', margin: '16px auto 0' }}>
                Real-time wellbeing updates after every call, from any device, anywhere in the world.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              {[
                { icon: '😊', title: 'Mood & wellness timeline', desc: 'How is Mom feeling today? How has her mood trended this month? Visual, clear, and non-clinical.' },
                { icon: '📧', title: 'Weekly family digest', desc: 'Every Monday, a digest of last week\'s conversations, engagement, and highlights arrives in your inbox.' },
                { icon: '🛡️', title: 'Fraud protection card', desc: 'See open and resolved fraud flags, with context. Your parent\'s financial safety is always visible.' },
                { icon: '📅', title: 'Family Events Calendar', desc: 'Add birthdays, anniversaries, graduations, and trips. Aria mentions them in the next morning call.' },
                { icon: '🤝', title: 'Buddy activity', desc: 'See who your parent\'s Buddy is, when they last spoke, and any notes the Buddy shared.' },
                { icon: '📋', title: 'Call history & summaries', desc: 'Every AI summary, every navigator note, every milestone — searchable and organized in one place.' },
                { icon: '🚨', title: 'Real-time alerts', desc: 'Missed calls, wellness concerns, fraud flags — sent as push notifications, email, and SMS simultaneously.' },
                { icon: '👁️', title: 'Granular consent controls', desc: 'Your parent controls exactly what you see. Grief records, call content, community activity — all configurable.' },
              ].map(f => (
                <div key={f.title} style={{ ...card, display: 'flex', gap: '14px' }}>
                  <span style={{ fontSize: '26px', flexShrink: 0 }}>{f.icon}</span>
                  <div>
                    <div style={{ ...heading3, fontSize: '16px', marginBottom: '4px' }}>{f.title}</div>
                    <p style={{ ...bodyText, fontSize: '14px', margin: 0 }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 11. WHO IT'S FOR — 3 AUDIENCES ── */}
        <section style={{ ...sectionPad, backgroundColor: '#ffffff' }}>
          <div style={maxW}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <SectionLabel>Who ThriveAtHome serves</SectionLabel>
              <h2 style={heading2}>Everyone who cares about a senior belongs here</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              {/* Seniors */}
              <div style={{ ...card, borderTop: '3px solid var(--color-teal)' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>👴</div>
                <h3 style={{ ...heading3, fontSize: '24px', marginBottom: '16px' }}>For seniors</h3>
                {[
                  'A friendly voice every morning that remembers what you told it',
                  'A real Human Buddy matched on shared interests and background',
                  'Communities in your own language and cultural tradition',
                  'Services arranged with a single call — no navigating providers alone',
                  'Your wisdom shared through skill exchange',
                  'Every birthday, every milestone — celebrated properly',
                  'Financial fraud protection built in, not bolted on',
                  'Grief and life transitions met with sustained, compassionate support',
                ].map(i => (
                  <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <CheckIcon />
                    <span style={{ ...bodyText, fontSize: '15px', margin: 0 }}>{i}</span>
                  </div>
                ))}
                <div style={{ marginTop: '20px' }}>
                  <CTAButton href="/signup" variant="teal">Join as a member</CTAButton>
                </div>
              </div>
              {/* Families */}
              <div style={{ ...card, borderTop: '3px solid var(--color-navy)' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>👨‍👩‍👧</div>
                <h3 style={{ ...heading3, fontSize: '24px', marginBottom: '16px' }}>For families</h3>
                {[
                  'Real-time wellbeing updates after every call',
                  'Peace of mind when you live hundreds of miles away',
                  'A dedicated human navigator coordinating everything',
                  'Fraud alerts sent to your phone before you even know to worry',
                  'Add family events so Aria reminds your parent about what matters',
                  'Send cards, flowers, or a food basket from the family dashboard',
                  'Weekly digest so you\'re never out of the loop',
                  'Granular consent — your parent controls what you see',
                ].map(i => (
                  <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <CheckIcon color="var(--color-navy)" />
                    <span style={{ ...bodyText, fontSize: '15px', margin: 0 }}>{i}</span>
                  </div>
                ))}
                <div style={{ marginTop: '20px' }}>
                  <CTAButton href="/signup" variant="navy">Start for your parent</CTAButton>
                </div>
              </div>
              {/* Volunteers */}
              <div style={{ ...card, borderTop: '3px solid #7c3aed' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🙋</div>
                <h3 style={{ ...heading3, fontSize: '24px', marginBottom: '16px' }}>For volunteers</h3>
                {[
                  'Be matched as a Human Buddy to someone who shares your world',
                  'A structured programme — a navigator supports every buddy',
                  'College students: earn service hours and a PDF service record',
                  'K-12 students: curriculum-integrated intergenerational programmes',
                  'Veterans: VSO recognition and peer peer matching',
                  'Corporate teams: Benevity/YourCause-compatible CSV exports',
                  'Log hours, track your impact, earn recognition',
                  'Make a friend, not just complete a task',
                ].map(i => (
                  <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <CheckIcon color="#7c3aed" />
                    <span style={{ ...bodyText, fontSize: '15px', margin: 0 }}>{i}</span>
                  </div>
                ))}
                <div style={{ marginTop: '20px' }}>
                  <Link href="/for-volunteers" style={{ ...bodyText, color: '#7c3aed', fontWeight: 600, textDecoration: 'none', fontSize: '16px' }}>
                    Become a buddy →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 12. ENTERPRISE & PARTNERSHIPS ── */}
        <section style={sectionPadAlt}>
          <div style={maxW}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <SectionLabel>B2B partnerships</SectionLabel>
              <h2 style={heading2}>For employers, care agencies, and community organisations</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              {[
                { icon: '🏢', title: 'Employer benefits', desc: 'Offer ThriveAtHome as an employee benefit — caregiver support that reduces absenteeism and drives retention. Per-employee-per-month pricing.' },
                { icon: '🏥', title: 'Care agency portals', desc: 'White-label platform for home care agencies. Your brand, our infrastructure. HIPAA-compliant, BAAs in place.' },
                { icon: '🏛️', title: 'Medicare Advantage', desc: 'Supplemental benefit integration for Medicare Advantage plans — targeting social isolation as a health determinant.' },
                { icon: '🎓', title: 'University partnerships', desc: 'Structured service-hours programmes for university students. Service record PDFs for transcripts and graduate applications.' },
                { icon: '⛪', title: 'Faith & community organisations', desc: 'Platform for faith communities, nonprofits, and neighbourhood organisations to serve their senior members.' },
                { icon: '💼', title: 'Corporate volunteer programme', desc: '3-tier structure ($5K–$50K+). Community Partner, Champion, and Leader tiers with naming rights and CEO recognition at top tier.' },
              ].map(p => (
                <div key={p.title} style={card}>
                  <div style={{ fontSize: '30px', marginBottom: '10px' }}>{p.icon}</div>
                  <h3 style={{ ...heading3, fontSize: '17px', marginBottom: '8px' }}>{p.title}</h3>
                  <p style={{ ...bodyText, fontSize: '15px', margin: 0 }}>{p.desc}</p>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <CTAButton href="mailto:partnerships@thriveathome.app" variant="outline">Contact partnerships team</CTAButton>
            </div>
          </div>
        </section>

        {/* ── 13. TECH & TRUST ── */}
        <section style={{ ...sectionPad, backgroundColor: '#ffffff' }}>
          <div style={maxW}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <SectionLabel>Technology & trust</SectionLabel>
              <h2 style={heading2}>HIPAA-compliant. Human-designed.</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              {[
                { icon: '🔒', title: 'HIPAA-compliant', desc: 'End-to-end encryption for health data. Anthropic and Retell AI BAAs signed October 2026.' },
                { icon: '🤖', title: '12 named AI agents', desc: 'Aria, Joy, Grace, Hope, Rosa, Claire, Sam, Morgan, Nova, Alex, Quinn, Jordan — each with a specific role.' },
                { icon: '📞', title: 'Retell AI + Twilio', desc: 'Enterprise voice infrastructure. 2 dedicated phone numbers. Tested and live.' },
                { icon: '⚡', title: 'Real-time everything', desc: 'Supabase Realtime powers alerts, notifications, and family dashboard updates — no refresh needed.' },
                { icon: '♿', title: 'WCAG 2.1 AA', desc: 'Accessibility built in, not added later. Minimum 18px text, 52px touch targets, screen-reader tested.' },
                { icon: '🌍', title: 'Multilingual roadmap', desc: 'English now. Spanish and Mandarin next. Full multilingual UI in Phase 55.' },
                { icon: '📱', title: 'Smart home roadmap', desc: 'Alexa, Google Home, Apple HealthKit, wearables, fall detection — Month 22.' },
                { icon: '🧠', title: 'ML roadmap', desc: 'Behavioral anomaly detection, fall risk prediction, wellness baseline modeling, NLP isolation detection — Month 23.' },
              ].map(t => (
                <div key={t.title} style={{ ...card, padding: '20px' }}>
                  <div style={{ fontSize: '26px', marginBottom: '8px' }}>{t.icon}</div>
                  <h3 style={{ ...heading3, fontSize: '15px', marginBottom: '6px' }}>{t.title}</h3>
                  <p style={{ ...bodyText, fontSize: '13px', margin: 0 }}>{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 14. PRICING ── */}
        <section style={sectionPadAlt} id="pricing">
          <div style={maxW}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <SectionLabel>Pricing</SectionLabel>
              <h2 style={heading2}>Simple, honest pricing</h2>
              <p style={{ ...bodyText, fontSize: '19px', maxWidth: '500px', margin: '16px auto 0' }}>
                No hidden fees. No long-term contracts. Save 20% with annual billing.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px', marginBottom: '40px' }}>
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

        {/* ── 15. FINAL CTA ── */}
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
              Your parent deserves to feel remembered.
            </h2>
            <p style={{ ...bodyText, fontSize: '19px', color: 'rgba(250,250,245,0.75)', marginBottom: '40px' }}>
              Join families who&apos;ve found peace of mind with ThriveAtHome. Human-first. AI when it helps. Always on their terms.
            </p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <CTAButton href="/signup" variant="teal" size="lg">Start for free</CTAButton>
              <CTAButton href="/for-volunteers" variant="white" size="lg">Volunteer as a buddy</CTAButton>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer style={{ backgroundColor: '#0f1c30', padding: '40px 24px 32px' }}>
        <div style={{ ...maxW, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '24px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--color-cream)', marginBottom: '12px' }}>ThriveAtHome</div>
              <p style={{ color: 'rgba(250,250,245,0.5)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>Senior independence platform combining AI, human care, and community.</p>
            </div>
            {[
              { label: 'Product', links: [['Features', '#how-it-works'], ['Pricing', '/pricing'], ['Communities', '/dashboard/communities'], ['For Families', '/for-families']] },
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
