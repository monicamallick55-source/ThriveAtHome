// app/dashboard/home-safety/page.tsx
// Member: Home Safety Program page — view status, sign up, accept/decline proposal

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import HomeSafetyMemberClient from '@/components/home-safety/HomeSafetyMemberClient'

async function getMemberSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  return fm
}

export default async function HomeSafetyPage() {
  const fm = await getMemberSession()
  if (!fm) redirect('/login')
  if (!fm.member_id) redirect('/dashboard')

  const admin = createAdminClient()

  // Load active programs (ThriveAtHome-run, org_id IS NULL for now)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: programs } = await (admin as any)
    .from('safety_programs')
    .select(`
      id, name, program_year, description, capacity_households, enrollment_open,
      starts_on, ends_on, sponsors, eligibility,
      contractor_partner:community_partners!safety_programs_contractor_partner_id_fkey(id, name, phone, website)
    `)
    .is('org_id', null)
    .order('created_at', { ascending: false })

  // Load member's enrollment if any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: enrollment } = await (admin as any)
    .from('safety_program_enrollments')
    .select(`
      id, status, home_type, comments, income_qualified, consent_terms_at, created_at,
      volunteer:members!safety_program_enrollments_volunteer_id_fkey(id, full_name, preferred_name, phone),
      program:safety_programs(id, name, program_year)
    `)
    .eq('member_id', fm.member_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Load proposal if enrolled
  let proposal = null
  let checks: unknown[] = []
  let goBag = null
  let magnet = null

  if (enrollment) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: p } = await (admin as any)
      .from('safety_proposals')
      .select(`
        id, tier_key, status, sent_at, responded_at,
        total_free_cents, total_subsidy_cents, total_member_cents,
        lines:safety_proposal_lines(
          id, item_key, description, route,
          est_cost_cents, contractor_discount_cents, subsidy_cents, member_cost_cents,
          accepted, work_order_status, completed_at, verified_by_volunteer_at
        )
      `)
      .eq('enrollment_id', enrollment.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    proposal = p

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: c } = await (admin as any)
      .from('home_safety_checks')
      .select('id, mode, scheduled_at, completed_at, status')
      .eq('enrollment_id', enrollment.id)
      .order('created_at', { ascending: false })
    checks = c ?? []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: gb } = await (admin as any)
      .from('go_bags')
      .select('*')
      .eq('enrollment_id', enrollment.id)
      .maybeSingle()
    goBag = gb

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: mg } = await (admin as any)
      .from('emergency_magnets')
      .select('*')
      .eq('enrollment_id', enrollment.id)
      .maybeSingle()
    magnet = mg
  }

  // Member's subscription tier for eligibility check
  const { data: member } = await admin
    .from('members')
    .select('subscription_tier, full_name')
    .eq('id', fm.member_id)
    .maybeSingle()

  return (
    <HomeSafetyMemberClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      programs={(programs ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      enrollment={enrollment as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      proposal={proposal as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      checks={checks as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      goBag={goBag as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      magnet={magnet as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      member={member as any}
    />
  )
}
