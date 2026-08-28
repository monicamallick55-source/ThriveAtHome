// Trusted Advisor Directory — family-facing browse + warm introductions (Phase 98, M24).
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { getActiveAdvisors, getAdvisorConnectionsForMember } from '@/lib/data/advisors'
import AdvisorsDirectoryClient from '@/components/advisors/AdvisorsDirectoryClient'

export const metadata: Metadata = { title: 'Trusted Advisors — ThriveAtHome' }

export default async function AdvisorsPage() {
  const user = await requireAuth()
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) redirect('/dashboard')

  const [{ data: advisors }, { data: connections }] = await Promise.all([
    getActiveAdvisors(),
    getAdvisorConnectionsForMember(fm.member_id),
  ])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      <header style={{ backgroundColor: 'var(--color-navy)', padding: '12px 24px' }}>
        <Link
          href="/dashboard"
          style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}
        >
          ← Back to Dashboard
        </Link>
      </header>
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 16px 80px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 8px' }}>
            Trusted Advisors
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', margin: 0 }}>
            Vetted elder law attorneys, financial advisors, and benefits counselors. Your
            navigator makes a warm, personal introduction — you are never handed off to a stranger.
          </p>
        </div>
        <AdvisorsDirectoryClient
          initialAdvisors={advisors ?? []}
          initialConnections={connections ?? []}
        />
      </main>
    </div>
  )
}
