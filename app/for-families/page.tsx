import type { Metadata } from 'next'
import Link from 'next/link'
import QuinnWidget from '@/components/shared/QuinnWidget'

export const metadata: Metadata = {
  title: 'ThriveAtHome for Organizations — Partner with Us',
  description: 'ThriveAtHome partners with nonprofits, Area Agencies on Aging, village networks, senior centers, employers, and faith organizations to bring senior independence services to more people.',
}

const navy = 'var(--color-navy)'
const teal = 'var(--color-teal)'
const cream = 'var(--color-cream)'

const bodyText: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '17px',
  lineHeight: 1.65,
  color: 'var(--color-text-secondary)',
}

const heading2: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'clamp(26px, 3.5vw, 38px)',
  fontWeight: 500,
  color: navy,
  letterSpacing: '-0.01em',
  lineHeight: 1.2,
}

const maxW: React.CSSProperties = { maxWidth: '1160px', margin: '0 auto', width: '100%' }

// Org types with their portal destinations
const orgTypes = [
  {
    icon: '🏘️',
    title: 'Village to Village Networks',
    audience: 'Member-driven senior villages across the US',
    what: 'Offer ThriveAtHome as a subsidised benefit to your village members. Your village admin portal gives you member oversight, programme impact reporting, and direct referral tools.',
    features: ['Bulk member onboarding', 'Village admin dashboard', 'Community circle integration', 'Impact reports for funders'],
    cta: 'Access village admin portal',
    href: '/org-admin',
    color: '#1b3a6b',
    bgColor: 'rgba(27,58,107,0.05)',
    borderColor: 'rgba(27,58,107,0.15)',
  },
  {
    icon: '🏢',
    title: 'Area Agencies on Aging',
    audience: 'Federally-funded AAAs serving Older Americans Act Title III',
    what: 'Extend your reach with a tech-enabled companion call layer. ThriveAtHome integrates with your existing Older Americans Act programming and provides grant-compatible impact data.',
    features: ['OAA-compatible reporting', 'HIPAA-compliant data', 'Fraud & safety monitoring', 'Community resource integration'],
    cta: 'Access AAA portal',
    href: '/aaa-admin',
    color: '#006b64',
    bgColor: 'rgba(0,107,100,0.05)',
    borderColor: 'rgba(0,107,100,0.15)',
  },
  {
    icon: '🏛️',
    title: 'Senior Centers',
    audience: 'Community senior centers and recreational programmes',
    what: 'Bring your in-person programming online and extend member engagement between centre visits. ThriveAtHome\'s daily calls, communities, and events complement everything you already do.',
    features: ['Event cross-promotion', 'Member engagement tracking', 'Daily wellness check-ins', 'Volunteer coordination'],
    cta: 'Access senior center portal',
    href: '/senior-center-admin',
    color: '#7b5ea7',
    bgColor: 'rgba(123,94,167,0.05)',
    borderColor: 'rgba(123,94,167,0.15)',
  },
  {
    icon: '🤝',
    title: 'Nonprofits & Community Foundations',
    audience: 'Senior-serving nonprofits, faith organizations, and community foundations',
    what: 'Refer seniors directly for Community Access memberships — fully subsidised or low-cost. Track your impact in real time with our nonprofit partner portal. No tech setup required; register in minutes.',
    features: ['Self-service registration', 'Direct senior referral tool', 'Live impact dashboard', 'Free and subsidised tier options'],
    cta: 'Register as a nonprofit partner',
    href: '/nonprofit-admin',
    color: '#c2772b',
    bgColor: 'rgba(194,119,43,0.05)',
    borderColor: 'rgba(194,119,43,0.15)',
    highlight: true,
  },
  {
    icon: '💼',
    title: 'Employers & HR Benefits Teams',
    audience: 'Employers offering caregiver support as a workplace benefit',
    what: 'Reduce caregiver burnout in your workforce by offering ThriveAtHome as an employee benefit. PEPM pricing, white-labelled landing pages, and an employer admin portal with utilization reporting.',
    features: ['Per-employee-per-month pricing', 'Employee self-enrollment', 'Utilization reporting', 'Caregiver support + senior care'],
    cta: 'Learn about employer benefits',
    href: '/employers',
    color: '#1b3a6b',
    bgColor: 'rgba(27,58,107,0.04)',
    borderColor: 'rgba(27,58,107,0.12)',
  },
  {
    icon: '⛪',
    title: 'Faith Organizations',
    audience: 'Churches, mosques, synagogues, and faith communities',
    what: 'Many of your congregation\'s older members live alone and go days without meaningful contact. ThriveAtHome partners with faith communities to refer isolated seniors for free or subsidised memberships.',
    features: ['Nonprofit referral flow', 'Faith-sensitive companionship', 'Cultural and spiritual circles', 'Grief and transition support'],
    cta: 'Partner as a nonprofit',
    href: '/nonprofit-admin',
    color: '#006b64',
    bgColor: 'rgba(0,107,100,0.04)',
    borderColor: 'rgba(0,107,100,0.12)',
  },
  {
    icon: '🏥',
    title: 'Healthcare Systems & Hospitals',
    audience: 'Health systems, discharge planners, and care transition teams',
    what: 'Social isolation is a readmission risk factor. ThriveAtHome provides a post-discharge connection layer — daily calls, medication reminders, and family alerts — that extends your care team\'s reach.',
    features: ['Discharge referral pathway', 'Daily call monitoring', 'Medication adherence reminders', 'Family alert system'],
    cta: 'Contact partnerships team',
    href: '/contact',
    color: '#7b5ea7',
    bgColor: 'rgba(123,94,167,0.04)',
    borderColor: 'rgba(123,94,167,0.12)',
  },
  {
    icon: '🏘️',
    title: 'Network Administrators',
    audience: 'Multi-site networks, coalitions, and chapter organizations',
    what: 'Manage multiple affiliated chapters, senior centers, or village network nodes from one network admin console. Aggregate reporting, shared member pools, and coordinated programming.',
    features: ['Multi-site admin console', 'Aggregate impact reporting', 'Chapter management', 'Shared programming tools'],
    cta: 'Access network admin portal',
    href: '/network-admin',
    color: '#c2772b',
    bgColor: 'rgba(194,119,43,0.04)',
    borderColor: 'rgba(194,119,43,0.12)',
  },
]

const orgPricing = [
  {
    name: 'Community Free',
    price: '$0',
    subtext: 'per member/mo',
    note: '$29/mo subsidised by ThriveAtHome Foundation',
    who: 'For nonprofits referring seniors with demonstrated financial need',
    features: ['Daily Aria companion calls', 'Crisis detection & navigator escalation', '25+ social communities', 'Family updates'],
    cta: 'Refer a senior',
    href: '/nonprofit-admin',
    highlight: false,
  },
  {
    name: 'Community Subsidised',
    price: '$5',
    subtext: 'per member/mo',
    note: '$24/mo subsidised — $29 total platform value',
    who: 'For nonprofits and senior centers offering a low-cost member benefit',
    features: ['Everything in Community Free', 'Human Buddy matching', 'Benefits finder', 'Community events & RSVP'],
    cta: 'Refer a senior',
    href: '/nonprofit-admin',
    highlight: true,
  },
  {
    name: 'Employer PEPM',
    price: 'Custom',
    subtext: 'per employee/mo',
    note: 'Volume pricing from $8–$19 PEPM depending on size',
    who: 'For employers offering caregiver support as a workplace benefit',
    features: ['Employee self-enrollment', 'All member plan features', 'Utilization reporting', 'HR admin dashboard'],
    cta: 'Contact us',
    href: '/contact',
    highlight: false,
  },
]

export default function ForOrganizationsPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: cream, display: 'flex', flexDirection: 'column' }}>

      {/* Nav */}

      {/* Hero */}
      <section style={{ padding: 'clamp(56px, 8vw, 96px) 24px 72px', textAlign: 'center', background: `radial-gradient(ellipse at 20% 30%, rgba(0,139,130,0.07) 0%, transparent 60%), ${cream}` }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ display: 'inline-block', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: teal, backgroundColor: 'rgba(0,139,130,0.08)', border: '1px solid rgba(0,139,130,0.2)', borderRadius: '100px', padding: '4px 14px', marginBottom: '20px' }}>
            For Organizations
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5.5vw, 52px)', fontWeight: 500, color: navy, letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: '20px' }}>
            Bring senior independence<br />to more people, together
          </h1>
          <p style={{ ...bodyText, fontSize: '20px', maxWidth: '600px', margin: '0 auto 36px', lineHeight: 1.7 }}>
            ThriveAtHome partners with nonprofits, Area Agencies on Aging, village networks, senior centers, employers, and faith organizations to expand access to companion care, safety monitoring, and community connection.
          </p>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/nonprofit-admin" style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: teal, color: 'white', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '17px', padding: '14px 28px', borderRadius: 'var(--radius-md)', textDecoration: 'none', minHeight: '52px' }}>
              Nonprofit partner portal →
            </Link>
            <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'transparent', color: navy, border: `1.5px solid ${navy}`, fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '17px', padding: '14px 28px', borderRadius: 'var(--radius-md)', textDecoration: 'none', minHeight: '52px' }}>
              Talk to partnerships team
            </Link>
          </div>
        </div>
      </section>

      {/* Org Type Cards */}
      <section style={{ padding: '80px 24px', backgroundColor: 'white' }}>
        <div style={maxW}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={heading2}>Who we partner with</h2>
            <p style={{ ...bodyText, fontSize: '18px', maxWidth: '520px', margin: '12px auto 0' }}>
              Find your organisation type below and go directly to your portal or learn more about the partnership.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {orgTypes.map(org => (
              <div key={org.title} style={{
                backgroundColor: org.bgColor,
                border: `1.5px solid ${org.highlight ? org.color : org.borderColor}`,
                borderRadius: 'var(--radius-xl)',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative' as const,
                boxShadow: org.highlight ? `0 0 0 2px ${org.color}22` : 'none',
              }}>
                {org.highlight && (
                  <div style={{ position: 'absolute', top: '-12px', left: '24px', backgroundColor: org.color, color: 'white', fontSize: '11px', fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: '100px', padding: '3px 12px' }}>
                    Self-service — start today
                  </div>
                )}
                <div style={{ fontSize: '32px' }}>{org.icon}</div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: navy, marginBottom: '4px' }}>{org.title}</h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: org.color, fontWeight: 600 }}>{org.audience}</p>
                </div>
                <p style={{ ...bodyText, fontSize: '15px', margin: 0 }}>{org.what}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {org.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span style={{ color: teal, fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>✓</span>
                      <span style={{ ...bodyText, fontSize: '14px', margin: 0 }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={org.href} style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: org.highlight ? org.color : 'transparent',
                  color: org.highlight ? 'white' : org.color,
                  border: `1.5px solid ${org.color}`,
                  fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '15px',
                  padding: '10px 20px', borderRadius: 'var(--radius-md)', textDecoration: 'none',
                  marginTop: 'auto',
                }}>
                  {org.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Org Pricing */}
      <section style={{ padding: '80px 24px', backgroundColor: cream }}>
        <div style={maxW}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={heading2}>Organisation pricing</h2>
            <p style={{ ...bodyText, fontSize: '18px', maxWidth: '480px', margin: '12px auto 0' }}>
              Flexible options for every type of organisation — from free referrals to employer benefit packages.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '24px', maxWidth: '960px', margin: '0 auto' }}>
            {orgPricing.map(plan => (
              <div key={plan.name} style={{
                backgroundColor: 'white',
                border: `1.5px solid ${plan.highlight ? teal : 'var(--color-warm-grey)'}`,
                borderRadius: 'var(--radius-xl)',
                padding: '28px',
                boxShadow: plan.highlight ? `0 0 0 2px ${teal}33, var(--shadow-card)` : 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}>
                {plan.highlight && (
                  <div style={{ backgroundColor: teal, color: 'white', fontSize: '11px', fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: '100px', padding: '3px 12px', width: 'fit-content' }}>
                    Most popular
                  </div>
                )}
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: navy, marginBottom: '4px' }}>{plan.name}</h3>
                  <p style={{ ...bodyText, fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>{plan.who}</p>
                </div>
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '36px', fontWeight: 700, color: navy }}>{plan.price}</span>
                  <span style={{ ...bodyText, fontSize: '14px', marginLeft: '6px' }}>{plan.subtext}</span>
                  <p style={{ ...bodyText, fontSize: '13px', color: teal, fontWeight: 600, marginTop: '4px' }}>{plan.note}</p>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ color: teal, fontWeight: 700, flexShrink: 0 }}>✓</span>
                      <span style={{ ...bodyText, fontSize: '14px', margin: 0 }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} style={{
                  display: 'block', textAlign: 'center',
                  backgroundColor: plan.highlight ? teal : 'transparent',
                  color: plan.highlight ? 'white' : navy,
                  border: `1.5px solid ${plan.highlight ? teal : navy}`,
                  fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '15px',
                  padding: '11px 20px', borderRadius: 'var(--radius-md)', textDecoration: 'none',
                  marginTop: 'auto',
                }}>
                  {plan.cta} →
                </Link>
              </div>
            ))}
          </div>
          <p style={{ ...bodyText, textAlign: 'center', fontSize: '14px', marginTop: '24px' }}>
            Member plan pricing (B2C) is separate. <Link href="/pricing" style={{ color: teal, fontWeight: 600 }}>View member plans →</Link>
          </p>
        </div>
      </section>

      {/* Impact stats */}
      <section style={{ padding: '72px 24px', backgroundColor: navy, textAlign: 'center' }}>
        <div style={{ ...maxW, maxWidth: '800px' }}>
          <h2 style={{ ...heading2, color: cream, marginBottom: '48px' }}>Built for organisations that care about outcomes</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '32px' }}>
            {[
              { stat: '7', label: 'scam patterns monitored on every call and message' },
              { stat: '9', label: 'life transition pathways with navigator-guided support' },
              { stat: '25+', label: 'social communities for interest-based connection' },
              { stat: 'HIPAA', label: 'compliant infrastructure with BAAs signed' },
            ].map(item => (
              <div key={item.stat}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '40px', fontWeight: 700, color: '#6fd4c4', marginBottom: '8px' }}>{item.stat}</div>
                <p style={{ ...bodyText, fontSize: '14px', color: 'rgba(250,250,245,0.7)', margin: 0, lineHeight: 1.5 }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', textAlign: 'center', backgroundColor: cream }}>
        <div style={{ maxWidth: '620px', margin: '0 auto' }}>
          <h2 style={{ ...heading2, marginBottom: '16px' }}>Ready to bring ThriveAtHome to your community?</h2>
          <p style={{ ...bodyText, fontSize: '18px', marginBottom: '32px' }}>
            Nonprofits can register and start referring seniors today — no contract, no tech setup. For employer or enterprise partnerships, contact our team.
          </p>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/nonprofit-admin" style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: teal, color: 'white', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '17px', padding: '14px 28px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
              Register as a nonprofit partner
            </Link>
            <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'transparent', color: navy, border: `1.5px solid ${navy}`, fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '17px', padding: '14px 28px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
              Contact us
            </Link>
          </div>
          <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Have questions about partnering? Talk to Quinn right now.
            </p>
            <QuinnWidget label="Talk to Quinn" variant="ghost" compact />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--color-warm-grey)', padding: '32px 24px', backgroundColor: cream }}>
        <div style={{ ...maxW, display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: navy, textDecoration: 'none', fontWeight: 500 }}>ThriveAtHome</Link>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <Link href="/privacy" style={{ ...bodyText, fontSize: '14px', textDecoration: 'none' }}>Privacy</Link>
            <Link href="/terms" style={{ ...bodyText, fontSize: '14px', textDecoration: 'none' }}>Terms</Link>
            <Link href="/contact" style={{ ...bodyText, fontSize: '14px', textDecoration: 'none' }}>Contact</Link>
            <Link href="/signup" style={{ ...bodyText, fontSize: '14px', textDecoration: 'none', color: teal, fontWeight: 600 }}>Join as a member</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
