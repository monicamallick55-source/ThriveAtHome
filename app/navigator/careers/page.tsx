// app/navigator/careers/page.tsx
// Navigator/staff view: post and manage career opportunities

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import CareersAdminClient from '@/components/careers/CareersAdminClient'

async function getStaffSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm?.member_id) return null
  // Check is_staff
  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) return null
  return fm
}

export default async function CareersAdminPage() {
  const fm = await getStaffSession()
  if (!fm) redirect('/login')

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: opportunities } = await (admin as any)
    .from('career_opportunities')
    .select('id, title, organization, description, work_type, location, remote_ok, hours_per_week, pay, skills_desired, industries, apply_url, apply_email, closes_on, status, created_at')
    .order('created_at', { ascending: false })

  // Interest counts per opportunity
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: interestCounts } = await (admin as any)
    .from('career_interests')
    .select('opportunity_id, status')

  return (
    <CareersAdminClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      opportunities={(opportunities ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      interestCounts={(interestCounts ?? []) as any}
    />
  )
}
