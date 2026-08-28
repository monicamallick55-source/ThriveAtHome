// Free tax preparation (VITA / TCE) — family-facing (Phase 99, M24).
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { createAdminClient } from '@/lib/supabase/admin'
import { getVitaSites, getVitaAppointmentsForMember } from '@/lib/data/vita'
import TaxHelpClient from '@/components/vita/TaxHelpClient'

export const metadata: Metadata = { title: 'Free Tax Help — ThriveAtHome' }

export default async function TaxHelpPage() {
  const user = await requireAuth()
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) redirect('/dashboard')

  const admin = createAdminClient()
  const { data: member } = await admin
    .from('members')
    .select('date_of_birth, address')
    .eq('id', fm.member_id)
    .maybeSingle()

  const age = member?.date_of_birth
    ? Math.floor((Date.now() - new Date(member.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null

  // members has no structured state column — parse a 2-letter state code from the
  // free-text address if one is present, otherwise show all active sites.
  const stateMatch = member?.address?.match(/\b([A-Z]{2})\b(?:\s+\d{5})?\s*$/)
  const memberState = stateMatch ? stateMatch[1] : undefined

  const [{ data: sites }, { data: appointments }] = await Promise.all([
    getVitaSites(memberState),
    getVitaAppointmentsForMember(fm.member_id),
  ])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      <header style={{ backgroundColor: 'var(--color-navy)', padding: '12px 24px' }}>
        <Link href="/dashboard" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
          ← Back to Dashboard
        </Link>
      </header>
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 16px 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 8px' }}>
          Free Tax Help
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', margin: '0 0 20px' }}>
          IRS-certified volunteers prepare and file federal and state returns at no cost through
          the VITA and AARP Tax-Aide (TCE) programs. Answer a few questions and your navigator
          will help arrange an appointment.
        </p>
        <TaxHelpClient
          age={age}
          initialSites={sites ?? []}
          initialAppointments={appointments ?? []}
        />
      </main>
    </div>
  )
}
