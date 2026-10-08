// app/api/navigator/members/[memberId]/route.ts
// GET — fetch full member profile for the navigator console.
// Returns fields needed for the member detail view including introductions.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function resolveStaffContext(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, member_id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!fm) return null
  if (fm.role !== 'admin' && fm.role !== 'navigator') return null
  return { familyMemberId: fm.id as string, role: fm.role as string }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: memberId } = await params
  const supabase = await createClient()

  const staff = await resolveStaffContext(supabase)
  if (!staff) {
    return NextResponse.json({ error: 'Not authorised — staff only' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Member core profile (email not a column on members — use family_members for contact)
  const { data: member } = await admin
    .from('members')
    .select(
      `id, full_name, preferred_name, phone, city, state,
       directory_bio, directory_opt_in,
       risk_level, aria_call_opted_in, created_at,
       subscription_tier`,
    )
    .eq('id', memberId)
    .maybeSingle()

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  // Their connections (navigator-introduced ones)
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

  return NextResponse.json({ member, introductions: introductions ?? [] })
}
