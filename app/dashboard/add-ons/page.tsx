// M26 — Premium Subscription Add-Ons: family-facing catalog + manage page.
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getAddonCatalog,
  getMemberAddons,
  getEffectiveFamilySeatLimit,
  getVideoDiaryEntries,
  hasActiveAddon,
  BASE_FAMILY_SEATS,
} from '@/lib/data/premium-addons'
import AddOnsClient from '@/components/dashboard/AddOnsClient'

export const metadata: Metadata = { title: 'Add-ons & upgrades — ThriveAtHome' }

export default async function AddOnsPage() {
  const user = await requireAuth()
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) redirect('/dashboard')
  const memberId = fm.member_id

  const admin = createAdminClient()
  const { data: member } = await admin
    .from('members')
    .select('preferred_name, date_of_birth, plan_tier')
    .eq('id', memberId)
    .maybeSingle()

  const age = member?.date_of_birth
    ? Math.floor((Date.now() - new Date(member.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null

  const [{ data: catalog }, { data: memberAddons }, familySeatLimit, hasLongDistance] = await Promise.all([
    getAddonCatalog(),
    getMemberAddons(memberId),
    getEffectiveFamilySeatLimit(memberId),
    hasActiveAddon(memberId, 'long_distance_caregiver'),
  ])

  const { data: videoDiary } = hasLongDistance
    ? await getVideoDiaryEntries(memberId)
    : { data: [] }

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
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 16px 96px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 8px' }}>
          Add-ons &amp; upgrades
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', margin: '0 0 8px', maxWidth: '640px' }}>
          Optional extras on top of {member?.preferred_name ?? 'your'} plan. Monthly add-ons can be
          cancelled any time. One-time services are arranged by your Navigator after purchase.
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 24px' }}>
          Family dashboard seats: <strong>{familySeatLimit}</strong>{' '}
          {familySeatLimit > BASE_FAMILY_SEATS ? '(includes add-on bonus)' : `(base ${BASE_FAMILY_SEATS})`}
        </p>

        <AddOnsClient
          catalog={(catalog ?? []) as any}
          memberAddons={(memberAddons ?? []) as any}
          memberAge={age}
          planTier={member?.plan_tier ?? 'basics'}
          hasLongDistance={hasLongDistance}
          initialVideoDiary={videoDiary ?? []}
        />
      </main>
    </div>
  )
}
