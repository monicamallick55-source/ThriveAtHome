// app/volunteer/home-safety/page.tsx
// Volunteer view: their assigned homes + checklist

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import HomeSafetyVolunteerClient from '@/components/home-safety/HomeSafetyVolunteerClient'

async function getSession() {
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

export default async function VolunteerHomeSafetyPage() {
  const fm = await getSession()
  if (!fm) redirect('/login')
  if (!fm.member_id) redirect('/dashboard')

  const admin = createAdminClient()

  // Enrollments where this member is the assigned volunteer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: assignments } = await (admin as any)
    .from('safety_program_enrollments')
    .select(`
      id, status, home_type, comments, income_qualified, created_at,
      member:members(id, full_name, preferred_name, phone, city, state),
      program:safety_programs(id, name, program_year),
      checks:home_safety_checks(
        id, mode, scheduled_at, completed_at, status,
        items:home_safety_items(*)
      ),
      proposals:safety_proposals(
        id, status, tier_key,
        lines:safety_proposal_lines(id, description, member_cost_cents, accepted, work_order_status, completed_at, verified_by_volunteer_at)
      )
    `)
    .eq('volunteer_id', fm.member_id)
    .not('status', 'in', '("declined","withdrawn")')
    .order('created_at', { ascending: false })

  return (
    <HomeSafetyVolunteerClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assignments={(assignments ?? []) as any}
      volunteerId={fm.member_id}
    />
  )
}
