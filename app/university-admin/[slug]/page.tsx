// app/university-admin/[slug]/page.tsx
// G7.7 — University partner admin: enrolled students, hours, semester CSV export

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import UniversityAdminClient from './UniversityAdminClient'

export default async function UniversityAdminPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Must be staff or university admin
  const { data: isStaff } = await supabase.rpc('is_staff')
  // For now, staff-only; in production we'd check a university_admin_users table
  if (!isStaff) redirect('/dashboard')

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: partner } = await (admin as any)
    .from('university_partners')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!partner) redirect('/navigator')

  // Enrolled student volunteers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: students } = await (admin as any)
    .from('volunteers')
    .select('id, first_name, last_initial, total_hours, status, created_at, student_id_verified')
    .eq('university_partner_id', partner.id)
    .order('total_hours', { ascending: false })
    .limit(200)

  return (
    <UniversityAdminClient
      partner={partner}
      students={students ?? []}
    />
  )
}
