// app/admin/home-safety/page.tsx
// Admin/coordinator view for the Home Safety Program

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import HomeSafetyAdminClient from '@/components/home-safety/HomeSafetyAdminClient'

async function getAdminSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: fm } = await supabase
    .from('family_members')
    .select('id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm || fm.role !== 'admin') return null
  return fm
}

export default async function HomeSafetyAdminPage() {
  const staff = await getAdminSession()
  if (!staff) redirect('/login')

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: programs } = await (admin as any)
    .from('safety_programs')
    .select(`
      id, name, program_year, description, capacity_households,
      enrollment_open, starts_on, ends_on, eligibility,
      free_item_budget_cents, subsidy_per_home_cents, sponsors,
      contractor_partner:community_partners!safety_programs_contractor_partner_id_fkey(id, name),
      income_referral_partner:community_partners!safety_programs_income_referral_partner_id_fkey(id, name)
    `)
    .is('org_id', null)
    .order('created_at', { ascending: false })

  // Load enrollments for all programs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: enrollments } = await (admin as any)
    .from('safety_program_enrollments')
    .select(`
      id, status, home_type, comments, income_qualified, consent_terms_at, created_at,
      program_id, volunteer_id,
      member:members(id, full_name, preferred_name, phone, city, state, subscription_tier),
      volunteer:members!safety_program_enrollments_volunteer_id_fkey(id, full_name, preferred_name),
      proposals:safety_proposals(id, status, tier_key, sent_at, total_free_cents, total_subsidy_cents, total_member_cents)
    `)
    .order('created_at', { ascending: false })

  // Load volunteers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: volunteers } = await (admin as any)
    .from('safety_program_volunteers')
    .select(`
      id, program_id, max_households, trained_at,
      volunteer:members(id, full_name, preferred_name, phone)
    `)

  // Load community partners for dropdowns
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: partners } = await (admin as any)
    .from('community_partners')
    .select('id, name, category, status')
    .in('category', ['home_repair', 'home_modification'])
    .order('name')

  // All members for volunteer picker
  const { data: allMembers } = await admin
    .from('members')
    .select('id, full_name, preferred_name')
    .order('full_name')

  return (
    <HomeSafetyAdminClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      programs={(programs ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      enrollments={(enrollments ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      volunteers={(volunteers ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      partners={(partners ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      allMembers={(allMembers ?? []) as any}
    />
  )
}
