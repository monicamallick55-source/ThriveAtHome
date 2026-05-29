import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getMemberForAuthUser } from '@/lib/data/members'
import { getLifeStoryEntries, getMemoryBooks } from '@/lib/data/life-story'
import LifeStoryClient from '@/components/life-story/LifeStoryClient'

export const metadata: Metadata = { title: 'Life Story — ThriveAtHome' }

export default async function LifeStoryPage() {
  const user = await requireAuth()
  const { data: member } = await getMemberForAuthUser(user.id)
  if (!member) redirect('/onboarding')

  const [{ data: entries }, { data: memoryBooks }] = await Promise.all([
    getLifeStoryEntries(member.id),
    getMemoryBooks(member.id),
  ])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backgroundColor: 'white',
          borderBottom: '1px solid var(--color-warm-grey)',
          boxShadow: 'var(--shadow-sm)',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '760px',
            margin: '0 auto',
            padding: '0 24px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            href="/dashboard"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '18px',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
            }}
          >
            ← Dashboard
          </Link>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              color: 'var(--color-navy)',
              fontWeight: 500,
            }}
          >
            ThriveAtHome
          </span>
          <div style={{ width: '100px' }} aria-hidden="true" />
        </div>
      </nav>

      <main>
        <LifeStoryClient
          initialEntries={entries ?? []}
          memberName={member.preferred_name}
          planTier={member.plan_tier}
          memberId={member.id}
          initialMemoryBooks={memoryBooks ?? []}
        />
      </main>
    </div>
  )
}
