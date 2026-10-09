// app/navigator/transitions/page.tsx
// Navigator console for life transitions — create/manage facility move plans, advisor connections

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import NavigatorTransitionsClient from '@/components/grief/NavigatorTransitionsClient'

export default async function NavigatorTransitionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) redirect('/dashboard')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  // Load all active transition plans
  const { data: plans } = await admin
    .from('transition_plans')
    .select(`
      id, created_at, updated_at, title, status, family_can_view,
      target_move_date, facility_name, notes,
      member:members(id, full_name, preferred_name),
      steps:transition_plan_steps(id, week_number, title, completed_at, category, sort_order)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // Load pending advisor connections
  const { data: connections } = await admin
    .from('advisor_connections')
    .select(`
      id, created_at, status, member_note, navigator_notes, introduced_at,
      member:members(id, full_name, preferred_name),
      advisor:trusted_advisors(id, full_name, advisor_type)
    `)
    .in('status', ['requested', 'navigator_reviewing'])
    .order('created_at', { ascending: false })

  // Members for the "create plan" dropdown
  const { data: members } = await admin
    .from('members')
    .select('id, full_name, preferred_name')
    .eq('status', 'active')
    .order('full_name')
    .limit(200)

  return (
    <NavigatorTransitionsClient
      plans={plans ?? []}
      connections={connections ?? []}
      members={members ?? []}
    />
  )
}
