import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { data: member } = await supabase.from('members').select('id').eq('user_id', user.id).maybeSingle()
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  const { data, error } = await supabase.from('buddy_requests').insert({ member_id: member.id, preferred_interests: body.preferred_interests ?? [], preferred_call_day: body.preferred_call_day ?? null, preferred_call_time: body.preferred_call_time ?? null, notes: body.notes ?? null, status: 'pending', created_at: new Date().toISOString() }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: member } = await supabase.from('members').select('id').eq('user_id', user.id).maybeSingle()
  if (!member) return NextResponse.json({ data: null })
  const { data } = await supabase.from('buddy_requests').select('*').eq('member_id', member.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
  return NextResponse.json({ data })
}
