// app/navigator/members/[id]/page.tsx
// Navigator member detail page — profile overview + "Suggest an introduction" action.

import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavigatorMemberDetailClient from '@/components/navigator/NavigatorMemberDetailClient'

// ── Auth guard (server-side) ──────────────────────────────────────────────────

async function getStaffSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!fm || (fm.role !== 'admin' && fm.role !== 'navigator')) return null
  return fm
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function NavigatorMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: memberId } = await params

  const staff = await getStaffSession()
  if (!staff) redirect('/login')

  const admin = createAdminClient()

  // Fetch member
  const { data: member } = await admin
    .from('members')
    .select(
      `id, full_name, preferred_name, email, phone, city, state,
       directory_bio, directory_opt_in,
       risk_level, aria_call_opted_in, created_at,
       subscription_tier`,
    )
    .eq('id', memberId)
    .maybeSingle()

  if (!member) notFound()

  // Fetch their navigator-introduced connections
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: introductions } = await (admin as any)
    .from('member_connections')
    .select(
      `id, created_at, status, intro_note, requester_accepted, recipient_accepted,
       requester:members!member_connections_requester_id_fkey(id, preferred_name, full_name),
       recipient:members!member_connections_recipient_id_fkey(id, preferred_name, full_name)`,
    )
    .or(`requester_id.eq.${memberId},recipient_id.eq.${memberId}`)
    .not('introduced_by', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <NavigatorMemberDetailClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      member={member as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      introductions={(introductions ?? []) as any}
    />
  )
}
