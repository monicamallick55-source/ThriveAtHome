// app/api/advisor-connections/route.ts
// GET — list connections for member
// POST — member requests an introduction to a trusted advisor

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('member_id')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const { data: isStaff } = await supabase.rpc('is_staff')

  let query = admin
    .from('advisor_connections')
    .select(`
      id, created_at, status, member_note, navigator_notes, introduced_at,
      member:members(id, full_name, preferred_name),
      advisor:trusted_advisors(id, full_name, advisor_type, bio, phone, email, telehealth_ok, license_number, license_state)
    `)
    .order('created_at', { ascending: false })

  if (isStaff && memberId) {
    query = query.eq('member_id', memberId)
  } else if (!isStaff) {
    const { data: fm } = await supabase
      .from('family_members')
      .select('member_id')
      .eq('supabase_auth_id', user.id)
      .maybeSingle()
    if (!fm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    query = query.eq('member_id', fm.member_id)
  }

  const { data: connections, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ connections: connections ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { advisor_id, member_note } = body as { advisor_id?: string; member_note?: string }
  if (!advisor_id) return NextResponse.json({ error: 'advisor_id required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  // Get member_id from family_member or direct member
  const { data: fm } = await supabase
    .from('family_members')
    .select('member_id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!fm) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  // Guard: chaplain introductions are member_request_only — check it is allowed
  const { data: advisor } = await admin
    .from('trusted_advisors')
    .select('category, member_request_only, name')
    .eq('id', advisor_id)
    .maybeSingle()

  if (!advisor) return NextResponse.json({ error: 'Advisor not found' }, { status: 404 })
  // chaplain can only be requested (not auto-suggested) — the UI enforces this;
  // here we just ensure the row exists and is accessible

  const { data: connection, error } = await admin
    .from('advisor_connections')
    .insert({
      member_id: fm.member_id,
      advisor_id,
      member_note: member_note ?? null,
      status: 'requested',
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Introduction already requested' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notify staff
  await admin.from('realtime_notifications').insert({
    type: 'system_message',
    title: `Introduction request: ${advisor.name}`,
    body: `A member has requested a warm introduction to ${advisor.name} (${advisor.category}).`,
    severity: 'info',
    // staff-wide notification — member_id null or use a staff broadcast pattern
  })

  return NextResponse.json({ connection }, { status: 201 })
}
