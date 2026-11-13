import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const member_id = searchParams.get('member_id')
  let query = supabase.from('crisis_events').select('*, members(first_name, last_name)')
  if (status) query = query.eq('status', status)
  if (member_id) query = query.eq('member_id', member_id)
  const { data, error } = await query.order('created_at', { ascending: false }).limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { data, error } = await supabase.from('crisis_events').insert({ ...body, created_by: user.id, status: 'open', created_at: new Date().toISOString() }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (body.member_id) await supabase.from('navigator_tasks').insert({ member_id: body.member_id, type: 'crisis_response', status: 'open', priority: 'urgent', source: 'crisis_event', source_id: data.id, created_at: new Date().toISOString() })
  return NextResponse.json(data, { status: 201 })
}
