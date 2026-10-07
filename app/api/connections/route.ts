import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'No member linked' }, { status: 403 })

  const supabase = await createClient()
  const { data, error } = await (supabase.from as any)('member_connections')
    .select('*, requester:members!requester_id(id,preferred_name,full_name), addressee:members!addressee_id(id,preferred_name,full_name)')
    .or(`requester_id.eq.${memberId},addressee_id.eq.${memberId}`)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'No member linked' }, { status: 403 })

  const supabase = await createClient()

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { addressee_id, intro_note } = body as { addressee_id?: string; intro_note?: string }
  if (!addressee_id) return NextResponse.json({ error: 'addressee_id required' }, { status: 400 })
  if (addressee_id === memberId) return NextResponse.json({ error: 'Cannot connect with yourself' }, { status: 400 })

  // Check shared circle or org
  const { data: myCircles } = await (supabase.from as any)('circle_memberships')
    .select('circle_id').eq('member_id', memberId)
  const { data: theirCircles } = await (supabase.from as any)('circle_memberships')
    .select('circle_id').eq('member_id', addressee_id)
  const myIds = new Set((myCircles ?? []).map((r: any) => r.circle_id))
  const sharedCircle = (theirCircles ?? []).some((r: any) => myIds.has(r.circle_id))

  // Check shared org
  const { data: myMember } = await supabase.from('members').select('organization_id').eq('id', memberId).maybeSingle()
  const { data: theirMember } = await supabase.from('members').select('organization_id').eq('id', addressee_id).maybeSingle()
  const sharedOrg = (myMember as any)?.organization_id &&
    (myMember as any).organization_id === (theirMember as any)?.organization_id

  if (!sharedCircle && !sharedOrg) {
    return NextResponse.json({ error: 'You must share a circle or organization to connect' }, { status: 403 })
  }

  // Max 10 pending outgoing
  const { count } = await (supabase.from as any)('member_connections')
    .select('id', { count: 'exact', head: true })
    .eq('requester_id', memberId).eq('status', 'pending')
  if ((count ?? 0) >= 10) {
    return NextResponse.json({ error: 'Maximum 10 pending requests at a time' }, { status: 429 })
  }

  const { data, error } = await (supabase.from as any)('member_connections')
    .insert({ requester_id: memberId, addressee_id, intro_note: intro_note ?? null, status: 'pending' })
    .select().maybeSingle()
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Connection already exists' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
