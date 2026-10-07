// M25 Phases 103–107 — Cultural Programming hub: community potlucks, story
// circle, intergenerational heritage projects, craft & cooking classes, and the
// native-language oral history archive.
import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { getMemberById } from '@/lib/data/members'
import { getAllCircles } from '@/lib/data/circles'
import {
  getUpcomingFestivals,
  getUpcomingPotlucks,
  getUpcomingStorySessions,
  getStoryContributionsForMember,
  getOpenHeritageProjects,
  getHeritageProjectsForMember,
  getUpcomingClasses,
  getOralHistoryForMember,
} from '@/lib/data/cultural'
import CulturalProgrammingClient from '@/components/circles/CulturalProgrammingClient'
import LiveEventSearch from '@/components/circles/LiveEventSearch'

export const metadata: Metadata = { title: 'Cultural Programming — ThriveAtHome' }

export default async function CulturalProgrammingPage() {
  const user = await requireAuth()
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  const memberId = fm?.member_id ?? undefined
  const { data: memberForZip } = memberId ? await getMemberById(memberId) : { data: null }
  const zip = memberForZip?.zip_code ?? null

  const [
    festivals,
    circles,
    potlucks,
    storySessions,
    storyContributions,
    openHeritage,
    myHeritage,
    classes,
    oralHistory,
  ] = await Promise.all([
    getUpcomingFestivals(90),
    getAllCircles(),
    getUpcomingPotlucks(memberId),
    getUpcomingStorySessions(),
    memberId ? getStoryContributionsForMember(memberId) : Promise.resolve([]),
    getOpenHeritageProjects(),
    memberId ? getHeritageProjectsForMember(memberId) : Promise.resolve([]),
    getUpcomingClasses(memberId),
    memberId ? getOralHistoryForMember(memberId) : Promise.resolve([]),
  ])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      <header style={{ backgroundColor: 'var(--color-navy)', padding: '12px 24px' }}>
        <Link
          href="/dashboard/cultural-circles"
          style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}
        >
          ← Back to Communities
        </Link>
      </header>
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px 96px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 8px' }}>
          Cultural Programming
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', margin: '0 0 12px' }}>
          Ways to celebrate the seasons together — a craft or cooking class, a neighbourhood potluck,
          sharing a homeland memory, or recording a story in your first language.
        </p>
        <p style={{ margin: '0 0 20px' }}>
          <Link href="/dashboard/cultural-festivals" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-teal)' }}>
            See the festival calendar →
          </Link>
        </p>

        <section style={{ margin: '0 0 32px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 4px' }}>
            Live Events Near You
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: '0 0 16px' }}>
            Classes, workshops, and community events happening right now, found across Meetup,
            Eventbrite, and local listings.
          </p>
          <LiveEventSearch category="cultural" initialZip={zip} />
        </section>

        <CulturalProgrammingClient
          hasMember={!!memberId}
          festivals={festivals.map((f: any) => ({ id: f.id, festival_name: f.festival_name, festival_date: f.festival_date }))}
          circles={circles.map((c: any) => ({ id: c.id, circle_name: c.circle_name }))}
          potlucks={potlucks}
          storySessions={storySessions}
          storyContributions={storyContributions}
          openHeritageProjects={openHeritage}
          myHeritageProjects={myHeritage}
          classes={classes}
          oralHistory={oralHistory}
        />
      </main>
    </div>
  )
}
