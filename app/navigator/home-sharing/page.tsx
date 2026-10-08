// app/navigator/home-sharing/page.tsx
// Navigator view: all active home sharing referrals, update status, add notes, match members

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import HomeSharingNavigatorClient from '@/components/home-sharing/HomeSharingNavigatorClient'

async function getNavigatorSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm || !['admin', 'navigator'].includes(fm.role ?? '')) return null
  return fm
}

export default async function NavigatorHomeSharingPage() {
  const fm = await getNavigatorSession()
  if (!fm) redirect('/login')

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: referrals } = await (admin as any)
    .from('home_sharing_referrals')
    .select(`
      id, role, status, created_at, updated_at,
      home_description, rent_expectation, preferred_move_in, house_rules,
      budget_description, desired_location, move_in_by,
      notes, navigator_notes,
      member:members!home_sharing_referrals_member_id_fkey(id, full_name, preferred_name, phone, city, state),
      matched_member:members!home_sharing_referrals_matched_member_id_fkey(id, full_name, preferred_name),
      navigator:members!home_sharing_referrals_navigator_id_fkey(id, full_name, preferred_name)
    `)
    .not('status', 'in', '("closed")')
    .order('created_at', { ascending: false })

  const { data: allMembers } = await admin
    .from('members')
    .select('id, full_name, preferred_name')
    .order('full_name')

  return (
    <HomeSharingNavigatorClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      referrals={(referrals ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      allMembers={(allMembers ?? []) as any}
      navigatorMemberId={fm.member_id ?? ''}
    />
  )
}
