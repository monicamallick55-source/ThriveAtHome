// app/school-admin/[slug]/page.tsx
// G7.9 — K-12 school partner admin portal

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import SchoolAdminClient from './SchoolAdminClient'

export default async function SchoolAdminPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) redirect('/dashboard')

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: school } = await (admin as any)
    .from('school_partners')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!school) redirect('/navigator')

  // Load activity types for this grade band (and 'mixed')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: activities } = await (admin as any)
    .from('youth_activity_types')
    .select('*')
    .in('grade_band', school.grade_band === 'mixed'
      ? ['k_5', '6_8', '9_12']
      : [school.grade_band])
    .eq('active', true)
    .order('grade_band')

  // Load time_bank_credits from student volunteers linked to this school
  // For now: all 'youth' category volunteers with a note referencing the school
  // In production you'd have school_partner_id on volunteers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessions } = await (admin as any)
    .from('time_bank_credits')
    .select('id, performed_at, hours, category, notes, volunteers(first_name, last_initial, volunteer_category)')
    .eq('category', 'youth')
    .order('performed_at', { ascending: false })
    .limit(300)

  return (
    <SchoolAdminClient
      school={school}
      activities={activities ?? []}
      sessions={sessions ?? []}
    />
  )
}
