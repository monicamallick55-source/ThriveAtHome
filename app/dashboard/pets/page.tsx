// M27 Phase 117/118 — Pets & companions: pet profiles + upcoming pet milestones.
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getMemberForAuthUser } from '@/lib/data/members'
import { getPetsForMember } from '@/lib/data/pets'
import { getPetLossMembership } from '@/lib/data/pet-loss'
import { createAdminClient } from '@/lib/supabase/admin'
import { ToastProvider } from '@/components/ui/Toast'
import PetsClient from '@/components/dashboard/PetsClient'

export const metadata: Metadata = { title: 'Pets & companions — ThriveAtHome' }

export default async function PetsPage() {
  const user = await requireAuth()
  const { data: member } = await getMemberForAuthUser(user.id)
  if (!member) redirect('/onboarding')

  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  const [{ data: pets }, { data: membership }, { data: upcoming }] = await Promise.all([
    getPetsForMember(member.id),
    getPetLossMembership(member.id),
    admin
      .from('celebration_events')
      .select('id, celebration_type, event_date, ai_message, pet_name, status')
      .eq('member_id', member.id)
      .not('pet_id', 'is', null)
      .neq('status', 'cancelled')
      .gte('event_date', today)
      .order('event_date', { ascending: true }),
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
      <main style={{ maxWidth: '880px', margin: '0 auto', padding: '24px 16px 96px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 8px' }}>
          Pets &amp; companions
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', margin: '0 0 24px', maxWidth: '620px' }}>
          Add {member.preferred_name}&apos;s animal companions so Aria can remember them and mark their
          birthdays and adoption anniversaries — right alongside {member.preferred_name}&apos;s own milestones.
        </p>

        <ToastProvider>
          <PetsClient
            memberPreferredName={member.preferred_name}
            initialPets={pets ?? []}
            upcomingCelebrations={upcoming ?? []}
            inCompanionCircle={Boolean(membership?.is_active)}
          />
        </ToastProvider>
      </main>
    </div>
  )
}
