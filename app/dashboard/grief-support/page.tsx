// app/dashboard/grief-support/page.tsx
// Life transitions & grief support — 4 pathway cards + trusted advisor directory

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import GriefSupportClient from '@/components/grief/GriefSupportClient'

export default async function GriefSupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!fm || !fm.member_id) redirect('/dashboard')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  // Load therapists, grief counselors, and chaplains
  const { data: advisors } = await admin
    .from('trusted_advisors')
    .select('id, full_name, advisor_type, bio, phone, email, telehealth_ok, license_number, license_state, member_request_only')
    .in('advisor_type', ['therapist', 'grief_counselor', 'chaplain'])
    .eq('listing_status', 'active')
    .order('full_name')

  // Load existing advisor connections for this member
  const { data: connections } = await admin
    .from('advisor_connections')
    .select('advisor_id, status')
    .eq('member_id', fm.member_id)

  // Load active transition plans
  const { data: plans } = await admin
    .from('transition_plans')
    .select('id, title, status, family_can_view, target_move_date, facility_name')
    .eq('member_id', fm.member_id)
    .eq('status', 'active')

  return (
    <GriefSupportClient
      memberId={fm.member_id as string}
      advisors={advisors ?? []}
      connections={connections ?? []}
      transitionPlans={plans ?? []}
    />
  )
}
