// app/dashboard/home-sharing/page.tsx
// Member view: home sharing interest form + status

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import HomeSharingMemberClient from '@/components/home-sharing/HomeSharingMemberClient'

async function getSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  return fm?.member_id ? fm : null
}

export default async function HomeSharingPage() {
  const fm = await getSession()
  if (!fm) redirect('/login')

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: referral } = await (admin as any)
    .from('home_sharing_referrals')
    .select('*')
    .eq('member_id', fm.member_id)
    .not('status', 'in', '("closed")')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <HomeSharingMemberClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      referral={(referral ?? null) as any}
    />
  )
}
