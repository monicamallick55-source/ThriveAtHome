// app/vso-admin/[slug]/page.tsx
// G7.8 — VSO partner admin portal: volunteer management + VAVS CSV export

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import VsoAdminClient from './VsoAdminClient'

export default async function VsoAdminPage({
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
  const { data: partner } = await (admin as any)
    .from('vso_partners')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!partner) redirect('/navigator')

  // Volunteers with this VSO affiliation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: volunteers } = await (admin as any)
    .from('volunteers')
    .select('id, first_name, last_initial, vso_affiliation, vso_member_number, total_hours, status, created_at')
    .eq('vso_affiliation', partner.affiliation)
    .order('total_hours', { ascending: false })
    .limit(200)

  return (
    <VsoAdminClient partner={partner} volunteers={volunteers ?? []} />
  )
}
