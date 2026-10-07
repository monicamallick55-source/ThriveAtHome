import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { getMemberById } from '@/lib/data/members'
import { getAllCircles, getMemberCircleIds, getPlatformWideEvents } from '@/lib/data/circles'
import { aiProvider } from '@/lib/providers'
import CulturalCirclesClient from '@/components/circles/CulturalCirclesClient'

export const metadata: Metadata = { title: 'Communities — ThriveAtHome' }

export default async function CommunitiesPage() {
  const user = await requireAuth()
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  const memberId = fm?.member_id ?? undefined

  const [circles, joinedIds, platformEvents, localEvents, memberResult] = await Promise.all([
    getAllCircles(),
    memberId ? getMemberCircleIds(memberId) : Promise.resolve([]),
    getPlatformWideEvents(memberId),
    aiProvider.suggestLocalEvents('', '', []).catch(() => []),
    memberId ? getMemberById(memberId) : Promise.resolve({ data: null, error: null }),
  ])

  const memberTopics = (memberResult?.data?.topics_enjoy ?? []) as string[]

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
          <Link href="/dashboard" style={{
            fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 500,
            color: 'var(--color-text-secondary)', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            ← Dashboard
          </Link>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '22px',
            color: 'var(--color-navy)', fontWeight: 500,
          }}>ThriveAtHome</span>
          <div style={{ width: '120px' }} aria-hidden="true" />
        </div>
      </nav>

      <CulturalCirclesClient
        circles={(circles ?? []) as any}
        joinedCircleIds={joinedIds}
        platformEvents={platformEvents}
        localEventSuggestions={localEvents}
        hasMember={!!memberId}
        memberTopics={memberTopics}
      />
    </div>
  )
}
