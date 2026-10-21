'use client'
// RecommendedForYou -- age-aware service recommendations surfaced on the dashboard.
// Accepts the member's date_of_birth (ISO string or null) and renders a prioritised
// list of services / features most relevant to their life stage.
// Ages: 55-64 Active Pre-Retirees | 65-74 Early Retirees | 75-84 Established Seniors | 85+ Elder

import Link from 'next/link'

interface Rec {
  icon: string
  title: string
  desc: string
  href: string
  badge?: string
}

type AgeStage = 'pre_retiree' | 'early_retiree' | 'established' | 'elder' | 'unknown'

function getAgeStage(dateOfBirth: string | null | undefined): { stage: AgeStage; age: number | null } {
  if (!dateOfBirth) return { stage: 'unknown', age: null }
  const dob = new Date(dateOfBirth)
  if (isNaN(dob.getTime())) return { stage: 'unknown', age: null }
  const today = new Date()
  const age =
    today.getFullYear() -
    dob.getFullYear() -
    (today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
      ? 1
      : 0)
  if (age < 65) return { stage: 'pre_retiree', age }
  if (age < 75) return { stage: 'early_retiree', age }
  if (age < 85) return { stage: 'established', age }
  return { stage: 'elder', age }
}

const RECS: Record<AgeStage, Rec[]> = {
  pre_retiree: [
    {
      icon: '💼',
      title: 'Senior Employment & Job Training',
      desc: 'SCSEP-eligible jobs, skill-building workshops, and encore career guidance for adults 55+.',
      href: '/dashboard/services?category=employment',
      badge: 'For you',
    },
    {
      icon: '📋',
      title: 'Benefits Navigator',
      desc: "Make sure you're claiming every benefit you're entitled to - Medicare, Social Security timing, SNAP, and more.",
      href: '/dashboard/services?category=benefits',
    },
    {
      icon: '🏥',
      title: 'Medicare Planning',
      desc: 'Understand your Medicare options before your enrollment window opens. Our navigators can help you choose the right plan.',
      href: '/dashboard/services?category=health',
    },
    {
      icon: '🌐',
      title: 'Active Pre-Retirees Community',
      desc: 'Connect with members navigating the same transition -- work, retirement planning, and staying active.',
      href: '/dashboard/cultural-circles',
    },
    {
      icon: '🤝',
      title: 'Volunteer & Give Back',
      desc: "Share your career expertise with students and small businesses through ThriveAtHome's volunteer programs.",
      href: '/dashboard/services?category=volunteer',
    },
  ],
  early_retiree: [
    {
      icon: '✈️',
      title: 'Group Travel with Fellow Members',
      desc: 'Day trips, weekend getaways, and international travel -- planned within the community with people at your pace.',
      href: '/dashboard/services?category=travel',
      badge: 'Popular',
    },
    {
      icon: '🌿',
      title: 'Early Retirees Community',
      desc: 'A circle for newly retired members -- new hobbies, social events, grandparenting, and post-career life.',
      href: '/dashboard/cultural-circles',
    },
    {
      icon: '🎨',
      title: 'Skill Exchange',
      desc: "Teach what you know, learn what you've always wanted to. ThriveAtHome members trade skills every week.",
      href: '/dashboard/services?category=skill-exchange',
    },
    {
      icon: '🚗',
      title: 'Rides to Appointments & Events',
      desc: 'Reliable, vetted rides to medical appointments, social events, and errands -- on your schedule.',
      href: '/dashboard/services?category=transport',
    },
    {
      icon: '🧠',
      title: 'Wellness & Brain Health',
      desc: 'Cognitive fitness classes, memory workshops, and health coaching designed for active older adults.',
      href: '/dashboard/services?category=health',
    },
  ],
  established: [
    {
      icon: '🏠',
      title: 'Home Safety Assessment',
      desc: 'A trained professional visits your home and recommends practical modifications to reduce fall risk and improve comfort.',
      href: '/dashboard/services?category=home-safety',
      badge: 'Recommended',
    },
    {
      icon: '🛡️',
      title: 'Fall Prevention Program',
      desc: 'Evidence-based balance and strength exercises proven to reduce falls -- delivered at home or in small groups.',
      href: '/dashboard/services?category=fall-prevention',
    },
    {
      icon: '🚗',
      title: 'Rides & Errands',
      desc: "Vetted drivers for medical visits, grocery runs, and social outings - never rely on a family member's schedule.",
      href: '/dashboard/services?category=transport',
    },
    {
      icon: '🌟',
      title: 'Established Seniors Community',
      desc: 'Connect with members 75-84 -- life wisdom, grandparenting, staying engaged and socially connected at home.',
      href: '/dashboard/cultural-circles',
    },
    {
      icon: '💊',
      title: 'Medication & Health Coordination',
      desc: 'Our navigators help you track medications, coordinate doctor visits, and communicate with your care team.',
      href: '/dashboard/services?category=health',
    },
  ],
  elder: [
    {
      icon: '🕊️',
      title: 'Navigator Coordination',
      desc: 'Your dedicated navigator coordinates all your care -- from daily check-ins to health appointments and family communication.',
      href: '/dashboard/services?category=navigator',
      badge: 'Your advocate',
    },
    {
      icon: '📞',
      title: 'Daily Wellness Check-Ins',
      desc: 'A warm call every day from Quinn, your AI companion, to make sure you feel heard, safe, and connected.',
      href: '/dashboard/services?category=check-in',
    },
    {
      icon: '🏠',
      title: 'Home Modifications',
      desc: 'Grab bars, ramp installations, stair lifts, and more -- making your home safe for long-term independence.',
      href: '/dashboard/services?category=home-safety',
    },
    {
      icon: '🤲',
      title: 'Grief & Life Transition Support',
      desc: 'Gentle peer circles and one-on-one support for loss, health transitions, and major life changes.',
      href: '/dashboard/services?category=wellbeing',
    },
    {
      icon: '🕊️',
      title: 'Elder Community Circle',
      desc: 'Our eldest members -- sharing life stories, building deep friendships, and celebrating wisdom together.',
      href: '/dashboard/cultural-circles',
    },
  ],
  unknown: [
    {
      icon: '🏠',
      title: 'Home Safety',
      desc: 'Professional assessment and modifications to help you stay safe and comfortable at home.',
      href: '/dashboard/services?category=home-safety',
    },
    {
      icon: '📞',
      title: 'Daily Check-Ins',
      desc: 'A friendly call from Quinn to start your day feeling connected and supported.',
      href: '/dashboard/services?category=check-in',
    },
    {
      icon: '🤝',
      title: 'Community Circles',
      desc: 'Find your people -- cultural, interest-based, and age-stage communities within ThriveAtHome.',
      href: '/dashboard/cultural-circles',
    },
    {
      icon: '🚗',
      title: 'Rides & Errands',
      desc: 'Reliable transport and errand help so you can focus on what matters.',
      href: '/dashboard/services?category=transport',
    },
  ],
}

const STAGE_LABELS: Record<AgeStage, string> = {
  pre_retiree: 'Active Pre-Retirees (55-64)',
  early_retiree: 'Early Retirees (65-74)',
  established: 'Established Seniors (75-84)',
  elder: 'Elder Community (85+)',
  unknown: 'Our most popular services',
}

interface Props {
  dateOfBirth: string | null | undefined
  /** Maximum number of recommendations to show (default 4) */
  limit?: number
}

export default function RecommendedForYou({ dateOfBirth, limit = 4 }: Props) {
  const { stage } = getAgeStage(dateOfBirth)
  const recs = (RECS[stage] ?? RECS.unknown).slice(0, limit)
  const stageLabel = STAGE_LABELS[stage]

  return (
    <section style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '14px' }}>
        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--color-dark)',
            margin: 0,
          }}
        >
          Recommended for you
        </h2>
        {stage !== 'unknown' && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-teal)',
              backgroundColor: 'rgba(0,139,130,0.08)',
              borderRadius: '999px',
              padding: '2px 10px',
              fontFamily: 'var(--font-body)',
            }}
          >
            {stageLabel}
          </span>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        {recs.map((rec) => (
          <Link
            key={rec.href + rec.title}
            href={rec.href}
            style={{ textDecoration: 'none' }}
          >
            <div
              style={{
                position: 'relative',
                background: 'var(--color-card-bg, #fff)',
                border: '1px solid var(--color-border, #e5e7eb)',
                borderRadius: 'var(--radius-lg, 12px)',
                padding: '16px',
                height: '100%',
                boxSizing: 'border-box',
                transition: 'box-shadow 0.15s, border-color 0.15s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-teal)'
                ;(e.currentTarget as HTMLDivElement).style.boxShadow =
                  '0 4px 12px rgba(0,139,130,0.12)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.borderColor =
                  'var(--color-border, #e5e7eb)'
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
              }}
            >
              {rec.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: '#fff',
                    backgroundColor: 'var(--color-teal)',
                    borderRadius: '999px',
                    padding: '2px 8px',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {rec.badge}
                </span>
              )}
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{rec.icon}</div>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--color-dark)',
                  marginBottom: '6px',
                  paddingRight: rec.badge ? '52px' : '0',
                  lineHeight: 1.3,
                }}
              >
                {rec.title}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  color: 'var(--color-muted, #6b7280)',
                  lineHeight: 1.5,
                }}
              >
                {rec.desc}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
