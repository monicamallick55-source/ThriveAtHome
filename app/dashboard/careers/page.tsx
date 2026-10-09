// app/dashboard/careers/page.tsx
// Member view: career profile + job board

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import CareersClient from '@/components/careers/CareersClient'

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

export default async function CareersPage() {
  const fm = await getSession()
  if (!fm) redirect('/login')

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (admin as any)
    .from('career_profiles')
    .select('*')
    .eq('member_id', fm.member_id)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: opportunities } = await (admin as any)
    .from('career_opportunities')
    .select('id, title, organization, description, work_type, location, remote_ok, hours_per_week, pay, skills_desired, closes_on, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: interests } = await (admin as any)
    .from('career_interests')
    .select('id, opportunity_id, status')
    .eq('member_id', fm.member_id)

  return (
    <CareersClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profile={(profile ?? null) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      opportunities={(opportunities ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      interests={(interests ?? []) as any}
    />
  )
}
