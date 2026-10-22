import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'How It Works — ThriveAtHome',
  description: 'The full ThriveAtHome platform: 12 AI agents, 50+ automations, Human Buddy matching, 25+ communities, fraud protection, and family tools.',
}

const heading2: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'clamp(28px, 3.5vw, 40px)',
  fontWeight: 500, color: 'var(--color-navy)',
  letterSpacing: '-0.01em', lineHeight: 1.2,
}

const heading3: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)',
}

const bodyText: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '17px', lineHeight: 1.65,
  color: 'var(--color-text-secondary)',
}

const card: React.CSSProperties = {
  backgroundColor: 'var(--color-warm-white)',
  border: '1px solid var(--color-warm-grey)',
  borderRadius: 'var(--radius-xl)',
  padding: '24px', boxShadow: 'var(--shadow-card)',
}

const sectionPad: React.CSSProperties = { padding: '80px 24px' }
const sectionPadAlt: React.CSSProperties = { padding: '80px 24px', backgroundColor: 'var(--color-cream)' }
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
      display: 'inline-block', fontFamily: 'var(--font-body)',
      fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
      color: 'var(--color-teal)', backgroundColor: 'rgba(0,139,130,0.08)',
      border: '1px solid rgba(0,139,130,0.2)', borderRadius: '100px',
      padding: '4px 14px', marginBottom: '16px',
    }}>{children}</div>
  )
}

const AI_ROLES = [
  {
    role: 'Member', color: '#1e3a5f', bg: 'rgba(30,58,95,0.06)', flows: [
      'Daily Aria morning check-in call', 'Mood, energy, sleep, pain & appetite tracking',
      'Medication reminder & adherence check', 'Missed call escalation (1→2→welfare check)',
      'Grief & transition support (9 pathways)', 'Benefits finder (15+ programs)',
      'Aria frequency preference (daily / 3x / weekly)', 'Crisis phrase detection & escalation',
      'Fraud pattern detection in every call', 'Aria remembers prior conversation context',
      'Opt-in AI introduction at Day 21', 'Member wellbeing score calculation',
    ]
  },
  {
    role: 'Family', color: '#0d9488', bg: 'rgba(13,148,136,0.06)', flows: [
      'Post-call family wellness summary (no transcript)', 'Fraud alert SMS + dashboard notification',
      'Large purchase alert to family', 'Missed call family notification',
      'Family Events Calendar sync', 'Birthday & anniversary injection into Aria calls',
      'Celebration coordination & gift sending', 'Family dashboard real-time updates',
      'Navigator escalation notification', 'Weekly family digest email',
    ]
  },
  {
    role: 'Buddy & Volunteer', color: '#7c3aed', bg: 'rgba(124,58,237,0.06)', flows: [
      'Buddy matching algorithm (interests, language, background)', 'Buddy call scheduling & reminders',
      'Buddy check-in logging', 'Volunteer hour tracking & recognition',
      'Corporate CSR CSV export (Benevity/YourCause)', 'Student service hour verification',
      'Buddy feedback & compatibility scoring', 'Buddy escalation to navigator',
    ]
  },
  {
    role: 'Community', color: '#b45309', bg: 'rgba(180,83,9,0.06)', flows: [
      'Community post moderation (AI + human)', 'Event proposal & navigator approval flow',
      'RSVP tracking & reminders', 'Skill exchange time banking',
      'Cultural circle event calendar', 'Community digest notifications',
      'Member introduction & welcome flow', 'Potluck & travel coordination',
    ]
  },
  {
    role: 'Services', color: '#dc2626', bg: 'rgba(220,38,38,0.06)', flows: [
      'Paid companion booking & scheduling', 'Ride booking integration',
      'Service provider vetting workflow', 'Invoice & payment processing',
      'Premier companion credit tracking', 'Service feedback & rating',
    ]
  },
  {
    role: 'Background AI', color: '#475569', bg: 'rgba(71,85,105,0.06)', flows: [
      'Navigator task creation from escalations', 'Wellbeing trend analysis & flagging',
      'Fraud false-positive filtering', 'Platform health monitoring',
      'Onboarding sequence automation', 'Anniversary & birthday pre-population',
      'Subscription & billing lifecycle', 'BAA compliance logging',
    ]
  },
]

export default function HowItWorksPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', overflowX: 'clip' }}>

      {/* ── HERO ── */}
      <section style={{
        background: 'radial-gradient(ellipse at 10% 20%, rgba(0,139,130,0.08) 0%, transparent 55%), var(--color-cream)',
        padding: 'clamp(64px, 8vw, 100px) 24px 72px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <SectionLabel>Platform deep dive</SectionLabel>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 500, color: 'var(--color-navy)', letterSpacing: '-0.025em',
            lineHeight: 1.1, marginBottom: '20px',
          }}>
            The full ThriveAtHome platform
          </h1>
          <p style={{ ...bodyText, fontSize: '19px', maxWidth: '580px', margin: '0 auto 36px', lineHeight: 1.7 }}>
            12 AI agents. 50+ automated flows. A matched human buddy. 25+ communities.
            Built-in fraud protection. And a family that stays close.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {['#journey', '#ai-agents', '#human-buddy', '#communities', '#safety'].map((anchor, i) => (
              <Link key={anchor} href={anchor} style={{
                fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600,
                color: 'var(--color-navy)', textDecoration: 'none',
                border: '1px solid var(--color-warm-grey)', borderRadius: '100px',
                padding: '8px 18px', backgroundColor: 'var(--color-warm-white)',
              }}>
                {['Journey', 'AI Agents', 'Human Buddy', 'Communities', 'Safety'][i]}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 1. JOURNEY ── */}
      <section id="journey" style={{ ...sectionPad, backgroundColor: '#ffffff' }}>
        <div style={maxW}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <SectionLabel>The journey</SectionLabel>
            <h2 style={heading2}>Human-first. Technology when it helps.</h2>
            <p style={{ ...bodyText, fontSize: '19px', maxWidth: '560px', margin: '16px auto 0' }}>
              Trust is earned before technology is introduced. Aria is always opt-in.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '32px' }}>
            {[
              { step: '1', days: 'Days 1–7', title: 'Your navigator calls', desc: 'A human navigator personally calls within 24 hours to introduce ThriveAtHome and get to know your parent — no AI yet.' },
              { step: '2', days: 'Days 8–20', title: 'Buddy matched', desc: 'A compatible Human Buddy is matched on interests, language, and background. Regular calls begin.' },
              { step: '3', days: 'Day 21', title: 'Aria introduced — optionally', desc: 'Your parent decides if and when Aria calls. Default is no. No pressure, no automatic enrollment.' },
              { step: '4', days: 'Day 30+', title: 'Full platform activated', desc: "Communities, services, family dashboard, celebrations — everything available at your parent's own pace." },
            ].map(item => (
              <div key={item.step} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--color-navy)', color: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, flexShrink: 0 }}>{item.step}</div>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-teal)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{item.days}</span>
                </div>
                <h3 style={{ ...heading3, margin: 0 }}>{item.title}</h3>
                <p style={{ ...bodyText, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. AI AGENTS ── */}
      <section id="ai-agents" style={sectionPadAlt}>
        <div style={maxW}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <SectionLabel>AI agents</SectionLabel>
            <h2 style={heading2}>12 AI agents. 50+ automated flows.</h2>
            <p style={{ ...bodyText, fontSize: '19px', maxWidth: '600px', margin: '16px auto 0' }}>
              Every flow runs in the background — so your parent gets care, your family gets peace of mind,
              and your navigator gets the right information at the right time.
            </p>
          </div>

          {/* Agent name roll */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '56px' }}>
            {['Aria', 'Joy', 'Grace', 'Hope', 'Rosa', 'Claire', 'Sage', 'Dawn', 'Luna', 'River', 'Ember', 'Finn'].map(name => (
              <span key={name} style={{
                fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600,
                color: 'var(--color-navy)', backgroundColor: 'var(--color-warm-white)',
                border: '1px solid var(--color-warm-grey)', borderRadius: '100px',
                padding: '8px 20px',
              }}>{name}</span>
            ))}
          </div>

          {/* Flows by role */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '20px' }}>
            {AI_ROLES.map(role => (
              <div key={role.role} style={{ ...card, borderTop: `3px solid ${role.color}` }}>
                <div style={{
                  display: 'inline-block', fontFamily: 'var(--font-body)',
                  fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: role.color, backgroundColor: role.bg,
                  borderRadius: '100px', padding: '4px 12px', marginBottom: '16px',
                }}>{role.role}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {role.flows.map(flow => (
                    <div key={flow} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <CheckIcon color={role.color} />
                      <span style={{ ...bodyText, fontSize: '14px', margin: 0 }}>{flow}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. HUMAN BUDDY ── */}
      <section id="human-buddy" style={{ ...sectionPad, backgroundColor: '#ffffff' }}>
        <div style={maxW}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <SectionLabel>Human connection</SectionLabel>
            <h2 style={heading2}>Real humans. Real relationships.</h2>
            <p style={{ ...bodyText, fontSize: '19px', maxWidth: '560px', margin: '16px auto 0' }}>
              Loneliness shrinks when someone genuinely shows up. ThriveAtHome makes sure someone always does.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: '24px' }}>
            {[
              { icon: '🤝', title: 'Human Buddy programme', desc: 'Every Connect+ member is matched with a vetted Human Buddy — a volunteer matched on shared interests, language, and background. Weekly calls that feel like catching up with an old friend.' },
              { icon: '🧭', title: 'Dedicated care navigator', desc: 'A human navigator assigned to your parent. Available for coordination, crisis, and the moments technology can\'t handle. Complete+ gets 2 hrs/mo; Premier gets 8.' },
              { icon: '🎓', title: 'Student & volunteer network', desc: 'College students, K-12 programmes, veterans, faith-community members, retired professionals — 8 categories of volunteer earning service hours and real connection.' },
              { icon: '🏢', title: 'Corporate volunteer teams', desc: 'Employee volunteers from corporate partner programmes. Three tiers: Community Partner, Champion, and Leader — with Benevity/YourCause-compatible CSV exports.' },
              { icon: '💼', title: 'Paid companions', desc: 'Vetted paid companions for errands, event attendance, and social visits. From $15/hr, 20% platform fee. Premier members get companion credits.' },
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

      {/* ── 4. COMMUNITIES ── */}
      <section id="communities" style={sectionPadAlt}>
        <div style={maxW}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <SectionLabel>Community & events</SectionLabel>
            <h2 style={heading2}>25+ communities where your parent belongs</h2>
            <p style={{ ...bodyText, fontSize: '19px', maxWidth: '560px', margin: '16px auto 0' }}>
              12 cultural and heritage circles. 8 interest and hobby groups. 4 age-stage communities. Cultural identity isn&apos;t a nice-to-have — it&apos;s foundational to belonging.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '32px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-teal)', marginBottom: '16px' }}>Cultural &amp; Heritage Circles</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['Latino/Hispanic Community', 'Chinese-American Community', 'South Asian Community', 'African-American Community', 'Jewish-American Community', 'Filipino-American Community', 'Vietnamese-American Community', 'Korean-American Community', 'Arab/Middle Eastern Community', 'Caribbean Community', 'Eastern European Community', 'Native American / Indigenous'].map(c => (
                  <div key={c} style={{ display: 'flex', gap: '8px' }}><CheckIcon /><span style={{ ...bodyText, fontSize: '14px', margin: 0 }}>{c}</span></div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-teal)', marginBottom: '16px' }}>Interest &amp; Hobby Groups</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['Book Club', 'Gardening Circle', 'Music & Song', 'Art & Creativity', 'Travel & Adventure', 'Film & Cinema', 'Chess & Strategy', 'Cooking & Food'].map(c => (
                  <div key={c} style={{ display: 'flex', gap: '8px' }}><CheckIcon /><span style={{ ...bodyText, fontSize: '14px', margin: 0 }}>{c}</span></div>
                ))}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-teal)', margin: '24px 0 16px' }}>Age-Stage Communities</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { range: '55–64', label: 'Active Pre-Retirees' },
                  { range: '65–74', label: 'Early Retirees' },
                  { range: '75–84', label: 'Established Seniors' },
                  { range: '85+', label: 'Elder Community' },
                ].map(g => (
                  <div key={g.range} style={{ display: 'flex', gap: '8px' }}><CheckIcon /><span style={{ ...bodyText, fontSize: '14px', margin: 0, fontWeight: 600 }}>{g.range} · {g.label}</span></div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { icon: '💬', title: 'Circle posts & comments', desc: 'Members share updates and celebrate moments in their communities — with human moderation built in.' },
                { icon: '📅', title: 'Community events', desc: 'Member-proposed, navigator-approved events. One-tap RSVP, optional ride booking, dial-in and video options.' },
                { icon: '✈️', title: 'Senior travel', desc: 'Group trips planned and coordinated within the community — from day trips to international travel.' },
                { icon: '🔄', title: 'Skill exchange', desc: 'Seniors teach what they know — languages, crafts, cooking, history. Time banking recognises wisdom.' },
              ].map(item => (
                <div key={item.title} style={{ ...card, display: 'flex', gap: '16px', borderColor: 'rgba(0,139,130,0.18)', backgroundColor: 'rgba(0,139,130,0.04)' }}>
                  <span style={{ fontSize: '24px', flexShrink: 0 }}>{item.icon}</span>
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

      {/* ── 5. SAFETY ── */}
      <section id="safety" style={{ ...sectionPad, backgroundColor: '#ffffff' }}>
        <div style={maxW}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <SectionLabel>Built-in safety</SectionLabel>
            <h2 style={heading2}>Fraud protection that actually works</h2>
            <p style={{ ...bodyText, fontSize: '19px', maxWidth: '560px', margin: '16px auto 0' }}>
              Seniors are the most targeted demographic for financial fraud. ThriveAtHome monitors every interaction for 7 scam pattern groups and alerts your family instantly.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '32px' }}>
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                {['Gift card & wire transfer scams', 'Government impersonation', 'Grandparent scams', 'Tech support fraud', 'Lottery & prize fraud', 'Romance scams', 'Investment & crypto fraud', 'Large purchase alerts', 'Medicare & SSN phishing', 'Crisis phrase detection'].map(f => (
                  <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <CheckIcon color="#dc2626" />
                    <span style={{ ...bodyText, fontSize: '14px', margin: 0 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { icon: '🛡️', title: 'AI monitoring in every conversation', desc: 'Every AI agent checks call transcripts, community posts, and messages against 7 fraud categories in real time.' },
                { icon: '📲', title: 'Family fraud alerts (SMS + dashboard)', desc: 'When a pattern is flagged as urgent, your family receives an SMS and dashboard alert within minutes.' },
                { icon: '🧭', title: 'Navigator escalation', desc: 'Urgent flags create a critical navigator task. A human steps in to assess and contact your parent and family.' },
                { icon: '🔍', title: 'False-positive guard', desc: '"I hung up on the scammer" — understood. The system filters self-protective statements before raising an alert.' },
              ].map(item => (
                <div key={item.title} style={{ ...card, display: 'flex', gap: '16px', borderLeft: '3px solid #dc2626' }}>
                  <span style={{ fontSize: '24px', flexShrink: 0 }}>{item.icon}</span>
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

      {/* ── CTA ── */}
      <section style={{ ...sectionPadAlt, textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ ...heading2, marginBottom: '16px' }}>Ready to get started?</h2>
          <p style={{ ...bodyText, fontSize: '19px', marginBottom: '36px' }}>
            Join thousands of seniors and families who trust ThriveAtHome for connection, safety, and peace of mind.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '19px',
              padding: '16px 36px', minHeight: '58px', borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-navy)', color: 'var(--color-cream)', textDecoration: 'none',
            }}>Join as a member</Link>
            <Link href="/pricing" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '19px',
              padding: '16px 36px', minHeight: '58px', borderRadius: 'var(--radius-md)',
              backgroundColor: 'transparent', color: 'var(--color-navy)',
              border: '1.5px solid var(--color-navy)', textDecoration: 'none',
            }}>See pricing</Link>
          </div>
        </div>
      </section>

    </div>
  )
}
