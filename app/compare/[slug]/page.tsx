import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

interface CompareData {
  slug: string
  competitor: string
  tagline: string
  intro: string
  rows: { feature: string; them: string; us: string; winner: 'us' | 'tie' }[]
  verdict: string
  theirPrice: string
  ourPrice: string
}

const COMPARISONS: CompareData[] = [
  {
    slug: 'papa-alternative',
    competitor: 'Papa',
    tagline: 'ThriveAtHome vs Papa — which is right for your family?',
    intro: 'Papa offers on-demand companion visits through a network of college-age "Papa Pals." It\'s a solid choice for occasional in-person visits, but it doesn\'t offer daily AI check-ins, Care Navigator support, or a community of peers. Here\'s how the two platforms compare.',
    theirPrice: '$29–$99/mo + per-visit fees',
    ourPrice: 'From $49/mo all-inclusive',
    rows: [
      { feature: 'Daily wellness check-in call', them: '❌ Not included', us: '✅ Aria calls every morning', winner: 'us' },
      { feature: 'Dedicated Care Navigator', them: '❌ No navigator', us: '✅ Named navigator, same person every time', winner: 'us' },
      { feature: 'In-person companion visits', them: '✅ On-demand via Papa Pals', us: '✅ Volunteer buddy visits', winner: 'tie' },
      { feature: 'Community & social groups', them: '❌ None', us: '✅ Cultural circles, interest groups, events', winner: 'us' },
      { feature: 'Fall & safety monitoring', them: '❌ Not offered', us: '✅ Home safety checks + Aria early-warning', winner: 'us' },
      { feature: 'Family dashboard', them: '⚠️ Basic updates only', us: '✅ Full dashboard, milestone alerts, messaging', winner: 'us' },
      { feature: 'Medicare / insurance billing', them: '✅ Some Medicare Advantage plans', us: '⚠️ Coming 2027', winner: 'tie' },
      { feature: 'Nonprofit / subsidised access', them: '❌ Not offered', us: '✅ Community Access program', winner: 'us' },
    ],
    verdict: 'Papa is a reasonable choice if you only need occasional in-person visits and your insurance covers it. ThriveAtHome is the better fit if you want daily contact, proactive care coordination, and a real human navigator — not just an app for booking drop-in visits.',
  },
  {
    slug: 'duos-alternative',
    competitor: 'Duos',
    tagline: 'ThriveAtHome vs Duos — a full comparison',
    intro: 'Duos pairs older adults with trained "Duos Aides" for light tasks and companionship. The model is thoughtful, but it\'s primarily a marketplace for task help rather than a full care platform.',
    theirPrice: '$25–$75/mo + per-task fees',
    ourPrice: 'From $49/mo all-inclusive',
    rows: [
      { feature: 'Daily AI companion calls', them: '❌ Not included', us: '✅ Aria calls every morning', winner: 'us' },
      { feature: 'Care Navigator (human)', them: '❌ No navigator', us: '✅ Dedicated navigator for every member', winner: 'us' },
      { feature: 'Task help & light errands', them: '✅ Core offering', us: '✅ Via volunteer network + local partners', winner: 'tie' },
      { feature: 'Crisis detection & alerts', them: '❌ Not offered', us: '✅ Aria flags concerns to navigator + family', winner: 'us' },
      { feature: 'Senior-to-senior community', them: '❌ None', us: '✅ Circles, buddy program, group events', winner: 'us' },
      { feature: 'Resource library (12 topics)', them: '❌ Not offered', us: '✅ 100+ articles + personalised recommendations', winner: 'us' },
      { feature: 'Caregiver family portal', them: '⚠️ Basic only', us: '✅ Full dashboard + gift sending + milestones', winner: 'us' },
      { feature: 'Subsidised membership', them: '❌ Not offered', us: '✅ Community Access for qualifying seniors', winner: 'us' },
    ],
    verdict: 'Duos does task help well, but it stops there. ThriveAtHome wraps daily AI check-ins, a human navigator, community connection, and safety monitoring into one monthly plan — making it the more complete choice for families who want more than errand coverage.',
  },
  {
    slug: 'grandpad-vs-thriveathome',
    competitor: 'GrandPad',
    tagline: 'ThriveAtHome vs GrandPad — which senior platform wins?',
    intro: 'GrandPad is a simplified tablet designed for seniors with cognitive decline, primarily focused on video calls with family. It\'s a hardware device, not a care coordination platform. Here\'s how it compares to ThriveAtHome.',
    theirPrice: '$40–$80/mo (includes tablet)',
    ourPrice: 'From $49/mo (works on any device)',
    rows: [
      { feature: 'Works on any phone/tablet', them: '❌ Requires GrandPad device', us: '✅ App + phone + web — any device', winner: 'us' },
      { feature: 'Daily wellness check-in', them: '❌ Family must initiate calls', us: '✅ Aria calls the senior each morning', winner: 'us' },
      { feature: 'Care Navigator', them: '❌ Not included', us: '✅ Dedicated human navigator', winner: 'us' },
      { feature: 'Simplified video calling', them: '✅ Core strength', us: '✅ Via standard video apps (FaceTime, Zoom)', winner: 'tie' },
      { feature: 'Safety & fall monitoring', them: '❌ Not offered', us: '✅ Home safety program + Aria monitoring', winner: 'us' },
      { feature: 'Community & social connection', them: '❌ Family-only', us: '✅ Peers, circles, events, buddy program', winner: 'us' },
      { feature: 'Good for cognitive decline', them: '✅ Simplified interface', us: '⚠️ Standard phone UI required', winner: 'tie' },
      { feature: 'Care coordination', them: '❌ Not offered', us: '✅ Full navigator + resource + referral system', winner: 'us' },
    ],
    verdict: 'GrandPad is purpose-built for seniors with significant cognitive decline who need a very simplified device for family video calls. ThriveAtHome is the better choice for the vast majority of older adults who are living independently and want proactive care, community, and a daily check-in — without buying new hardware.',
  },
  {
    slug: 'homethrive-alternative',
    competitor: 'Homethrive',
    tagline: 'ThriveAtHome vs Homethrive — the full breakdown',
    intro: 'Homethrive is an employer benefit that gives employees access to a "Home Thrive Advisor" — essentially a care navigator for working caregivers. It\'s a B2B HR benefit, not a consumer senior care platform. Here\'s how it compares to ThriveAtHome.',
    theirPrice: 'Employer-funded (not available direct)',
    ourPrice: 'From $49/mo direct + employer plans',
    rows: [
      { feature: 'Available direct to families', them: '❌ Employer benefit only', us: '✅ Direct sign-up, no employer needed', winner: 'us' },
      { feature: 'Support for the senior directly', them: '⚠️ Advisor helps family, not senior', us: '✅ Senior gets Aria calls + navigator + community', winner: 'us' },
      { feature: 'Daily check-in for the senior', them: '❌ Not offered', us: '✅ Aria calls every morning', winner: 'us' },
      { feature: 'Working caregiver support', them: '✅ Core strength via HR benefit', us: '✅ Family dashboard + navigator updates', winner: 'tie' },
      { feature: 'Senior community & social', them: '❌ Not offered', us: '✅ Circles, events, buddy program', winner: 'us' },
      { feature: 'Employer B2B offering', them: '✅ Primary model', us: '✅ Employer plans available', winner: 'tie' },
      { feature: 'Home safety program', them: '❌ Not offered', us: '✅ Volunteer-led home safety checks', winner: 'us' },
      { feature: 'Nonprofit / subsidised access', them: '❌ Not offered', us: '✅ Community Access program', winner: 'us' },
    ],
    verdict: 'Homethrive helps working caregivers navigate resources — but it doesn\'t directly support the senior. ThriveAtHome wraps support around the senior themselves (daily calls, navigator, community) while also giving the family full visibility. If your employer offers Homethrive, it\'s worth taking, but it\'s not a substitute for a platform centred on the senior.',
  },
]

export function generateStaticParams() {
  return COMPARISONS.map(c => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const comp = COMPARISONS.find(c => c.slug === params.slug)
  if (!comp) return {}
  return {
    title: `${comp.tagline} | ThriveAtHome`,
    description: comp.intro.slice(0, 155),
  }
}

export default function ComparePage({ params }: { params: { slug: string } }) {
  const comp = COMPARISONS.find(c => c.slug === params.slug)
  if (!comp) notFound()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      {/* Nav */}
      <nav style={{ backgroundColor: 'white', borderBottom: '1px solid var(--color-warm-grey)', height: '64px', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', fontWeight: 500, textDecoration: 'none' }}>ThriveAtHome</Link>
          <Link href="/signup" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'white', backgroundColor: 'var(--color-teal)', padding: '8px 18px', borderRadius: 'var(--radius-lg)', textDecoration: 'none' }}>Try free</Link>
        </div>
      </nav>

      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '56px 24px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: 'var(--color-teal)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
            ThriveAtHome vs {comp.competitor}
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: 500, color: 'var(--color-navy)', lineHeight: 1.2, margin: '0 0 20px', textWrap: 'balance' } as any}>
            {comp.tagline}
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--color-text-secondary)', lineHeight: 1.75, margin: 0 }}>
            {comp.intro}
          </p>
        </div>

        {/* Price comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '40px' }}>
          <div style={{ backgroundColor: 'white', border: '1.5px solid var(--color-warm-grey)', borderRadius: 'var(--radius-xl)', padding: '24px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>{comp.competitor}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>{comp.theirPrice}</p>
          </div>
          <div style={{ backgroundColor: 'var(--color-teal)', border: '1.5px solid var(--color-teal)', borderRadius: 'var(--radius-xl)', padding: '24px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>ThriveAtHome</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'white', margin: 0 }}>{comp.ourPrice}</p>
          </div>
        </div>

        {/* Feature comparison table */}
        <div style={{ backgroundColor: 'white', border: '1.5px solid var(--color-warm-grey)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: '40px' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', backgroundColor: 'var(--color-navy)', padding: '14px 24px', gap: '16px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, color: 'rgba(250,250,245,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Feature</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, color: 'rgba(250,250,245,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, textAlign: 'center' }}>{comp.competitor}</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, color: 'var(--color-teal)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, textAlign: 'center' }}>ThriveAtHome</p>
          </div>
          {comp.rows.map((row, i) => (
            <div
              key={row.feature}
              style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '16px 24px', gap: '16px', borderTop: i === 0 ? 'none' : '1px solid var(--color-warm-grey)', backgroundColor: row.winner === 'us' ? '#f0fdfa' : 'white', alignItems: 'center' }}
            >
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>{row.feature}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, textAlign: 'center' }}>{row.them}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: row.winner === 'us' ? '#065f46' : 'var(--color-text-secondary)', fontWeight: row.winner === 'us' ? 600 : 400, margin: 0, textAlign: 'center' }}>{row.us}</p>
            </div>
          ))}
        </div>

        {/* Verdict */}
        <div style={{ backgroundColor: 'white', border: '1.5px solid var(--color-warm-grey)', borderRadius: 'var(--radius-xl)', padding: '32px', marginBottom: '40px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 14px' }}>The verdict</h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', lineHeight: 1.75, margin: 0 }}>{comp.verdict}</p>
        </div>

        {/* CTA */}
        <div style={{ backgroundColor: 'var(--color-navy)', borderRadius: 'var(--radius-xl)', padding: '40px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 500, color: 'var(--color-cream)', margin: '0 0 12px' }}>
            See ThriveAtHome for yourself
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(250,250,245,0.75)', margin: '0 0 24px', lineHeight: 1.65 }}>
            Start free — no credit card required. Cancel any time.
          </p>
          <Link
            href="/signup"
            style={{ display: 'inline-block', padding: '14px 32px', backgroundColor: 'var(--color-teal)', color: 'white', borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, textDecoration: 'none' }}
          >
            Start free today →
          </Link>
        </div>

        {/* Other comparisons */}
        <div style={{ marginTop: '48px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>See other comparisons</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {COMPARISONS.filter(c => c.slug !== comp.slug).map(c => (
              <Link
                key={c.slug}
                href={`/compare/${c.slug}`}
                style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-teal)', border: '1px solid var(--color-teal)', borderRadius: '999px', padding: '6px 16px', textDecoration: 'none' }}
              >
                vs {c.competitor}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
