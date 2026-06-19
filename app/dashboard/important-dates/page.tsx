import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { getTrackedItemsForMember } from '@/lib/data/tracked-items'
import ImportantDatesClient from '@/components/important-dates/ImportantDatesClient'

export const metadata: Metadata = { title: 'Important Dates — ThriveAtHome' }

export default async function ImportantDatesPage() {
  const user = await requireAuth()
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) redirect('/dashboard')

  const { data: items } = await getTrackedItemsForMember(fm.member_id, ['active', 'snoozed'])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      <header style={{ backgroundColor: 'var(--color-navy)', padding: '12px 24px' }}>
        <Link href="/dashboard" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
          ← Back to Dashboard
        </Link>
      </header>
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px 80px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 8px' }}>
            Important Dates
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', margin: 0 }}>
            Renewals, subscriptions, and appointments — all in one place.
          </p>
        </div>
        <ImportantDatesClient initialItems={items ?? []} />
      </main>
    </div>
  )
}
