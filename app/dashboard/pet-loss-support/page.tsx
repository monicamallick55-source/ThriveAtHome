// M27 Phase 119 — The Companion Circle: a pet-loss peer circle, distinct from human bereavement.
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getMemberForAuthUser } from '@/lib/data/members'
import {
  getPetLossMembership,
  getPetLossPosts,
  getPetLossCircleRoster,
  getPetLossRequestsForMember,
  PET_LOSS_RESOURCES,
} from '@/lib/data/pet-loss'
import { getPetsForMember } from '@/lib/data/pets'
import { ToastProvider } from '@/components/ui/Toast'
import CrisisResourceBar from '@/components/shared/CrisisResourceBar'
import PetLossCircleClient from '@/components/circles/PetLossCircleClient'

export const metadata: Metadata = { title: 'The Companion Circle — ThriveAtHome' }

export default async function PetLossSupportPage() {
  const user = await requireAuth()
  const { data: member } = await getMemberForAuthUser(user.id)
  if (!member) redirect('/onboarding')

  const { data: membership } = await getPetLossMembership(member.id)
  const active = Boolean(membership?.is_active)

  const [{ data: posts }, { data: roster }, { data: requests }, { data: pets }] = await Promise.all([
    active ? getPetLossPosts() : Promise.resolve({ data: [], error: null }),
    getPetLossCircleRoster(),
    getPetLossRequestsForMember(member.id),
    getPetsForMember(member.id),
  ])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      <header style={{ backgroundColor: 'var(--color-navy)', padding: '12px 24px' }}>
        <Link
          href="/dashboard/pets"
          style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}
        >
          ← Pets &amp; companions
        </Link>
      </header>
      <main style={{ maxWidth: '820px', margin: '0 auto', padding: '24px 16px 96px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 8px' }}>
          The Companion Circle
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', margin: '0 0 8px', maxWidth: '640px' }}>
          A gentle space for the grief of losing an animal companion. This circle is{' '}
          <strong>separate from our bereavement circles for people</strong> — pet loss deserves its
          own room, its own words, and its own resources.
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)', margin: '0 0 24px' }}>
          {roster?.length ?? 0} {roster?.length === 1 ? 'person is' : 'people are'} in the circle right now.
        </p>

        <ToastProvider>
          <PetLossCircleClient
            memberPreferredName={member.preferred_name}
            memberFullName={member.full_name}
            isActive={active}
            displayName={membership?.display_name ?? ''}
            petRemembered={membership?.pet_remembered ?? ''}
            initialPosts={posts ?? []}
            roster={roster ?? []}
            existingRequests={requests ?? []}
            pets={(pets ?? []).map((p: any) => ({ id: p.id, name: p.name, passed_away_on: p.passed_away_on }))}
            resources={PET_LOSS_RESOURCES}
          />
        </ToastProvider>

        <CrisisResourceBar surface="grief" />
      </main>
    </div>
  )
}
