import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import {
  getCircleById,
  getAllCircles,
  getMemberCircleIds,
  getCirclePosts,
  getCircleEvents,
} from '@/lib/data/circles'
import CircleDetailClient from '@/components/circles/CircleDetailClient'

export const metadata: Metadata = { title: 'Community Circle — ThriveAtHome' }

interface Props {
  params: Promise<{ circleId: string }>
}

export default async function CircleDetailPage({ params }: Props) {
  const { circleId } = await params
  const user = await requireAuth()
  const { data: fm } = await getFamilyMemberByAuthId(user.id)

  const [circle, allCircles, posts, events, joinedIds] = await Promise.all([
    getCircleById(circleId),
    getAllCircles(),
    getCirclePosts(circleId),
    getCircleEvents(circleId, fm?.member_id ?? undefined),
    fm?.member_id ? getMemberCircleIds(fm.member_id) : Promise.resolve([]),
  ])

  if (!circle) notFound()

  const circleIndex = allCircles.findIndex(c => c.id === circleId)
  const isJoined = joinedIds.includes(circleId)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 40, backgroundColor: 'white',
        borderBottom: '1px solid var(--color-warm-grey)', boxShadow: 'var(--shadow-sm)',
        height: '64px', display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto', padding: '0 24px', width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link href="/dashboard/communities" style={{
            fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 500,
            color: 'var(--color-text-secondary)', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            ← Communities
          </Link>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '22px',
            color: 'var(--color-navy)', fontWeight: 500,
          }}>ThriveAtHome</span>
          <div style={{ width: '160px' }} aria-hidden="true" />
        </div>
      </nav>

      <CircleDetailClient
        circle={circle}
        circleIndex={circleIndex >= 0 ? circleIndex : 0}
        initialPosts={posts}
        events={events}
        isJoined={isJoined}
        hasMember={!!fm?.member_id}
      />
    </div>
  )
}
