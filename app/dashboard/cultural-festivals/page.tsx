// M25 Phase 102 — Cultural festival calendar (family-facing).
import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { getAllCircles, getMemberCircleIds } from '@/lib/data/circles'
import { getUpcomingFestivals } from '@/lib/data/cultural'
import FestivalCalendarClient from '@/components/circles/FestivalCalendarClient'

export const metadata: Metadata = { title: 'Cultural Festivals — ThriveAtHome' }

export default async function CulturalFestivalsPage() {
  const user = await requireAuth()
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  const memberId = fm?.member_id ?? undefined

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
        <FestivalCalendarClient festivals={festivals} myCircleNames={myCircleNames} />
      </main>
    </div>
  )
}
