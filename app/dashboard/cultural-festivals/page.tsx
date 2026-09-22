// M25 Phase 102 — Cultural festival calendar (family-facing).
import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { getMemberById } from '@/lib/data/members'
import { getAllCircles, getMemberCircleIds } from '@/lib/data/circles'
import { getUpcomingFestivals } from '@/lib/data/cultural'
import FestivalCalendarClient from '@/components/circles/FestivalCalendarClient'
import LiveEventSearch from '@/components/circles/LiveEventSearch'

export const metadata: Metadata = { title: 'Cultural Festivals — ThriveAtHome' }

export default async function CulturalFestivalsPage() {
  const user = await requireAuth()
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  const memberId = fm?.member_id ?? undefined
  const { data: memberForZip } = memberId ? await getMemberById(memberId) : { data: null }
  const zip = memberForZip?.zip_code ?? null

  const [festivals, circles, joinedIds] = await Promise.all([
    getUpcomingFestivals(60),
    getAllCircles(),
    memberId ? getMemberCircleIds(memberId) : Promise.resolve([]),
  ])
  const myCircleNames = circles.filter((c) => joinedIds.includes(c.id)).map((c) => c.circle_name)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      <header style={{ backgroundColor: 'var(--color-navy)', padding: '12px 24px' }}>
        <Link href="/dashboard/cultural-circles" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
          ← Back to Communities
        </Link>
      </header>
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 16px 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 8px' }}>
          Cultural Festivals
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', margin: '0 0 20px' }}>
          Upcoming holidays and celebrations across our communities — with the greetings, traditions,
          and ways to take part. Aria will mention the ones that matter to you on her calls.
        </p>
        <section style={{ margin: '0 0 32px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 4px' }}>
            Festivals Happening Near You
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: '0 0 16px' }}>
            Live results from local event listings, filtered for relevance. Tap &quot;I&apos;m going&quot;
            to let other Thrive@Home families know you&apos;ll be there.
          </p>
          <LiveEventSearch category="festival" initialZip={zip} />
        </section>

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 16px' }}>
          Our Community Calendar
        </h2>
        <FestivalCalendarClient festivals={festivals} myCircleNames={myCircleNames} />
      </main>
    </div>
  )
}
