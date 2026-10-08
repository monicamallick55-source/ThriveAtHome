// app/admin/community-partners/page.tsx
// Admin page: browse, add, edit, and deactivate community partners.

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CommunityPartnersClient from '@/components/admin/CommunityPartnersClient'

async function getAdminSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: fm } = await supabase
    .from('family_members')
    .select('id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm || fm.role !== 'admin') return null
  return fm
}

export default async function CommunityPartnersPage() {
  const staff = await getAdminSession()
  if (!staff) redirect('/login')

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: partners } = await (admin as any)
    .from('community_partners')
    .select('*')
    .order('name')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <CommunityPartnersClient initialPartners={(partners ?? []) as any} />
}
