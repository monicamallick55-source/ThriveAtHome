import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const assignment_id = searchParams.get('assignment_id')
  let query = supabase.from('buddy_calls').select('*')
  if (assignment_id) query = query.eq('assignment_id', assignment_id)
  const { data, error } = await query.order('created_at', { ascending: false }).limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { data, error } = await supabase.from('buddy_calls').insert({ ...body, created_at: new Date().toISOString() }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (body.concern_flag && body.member_id) await supabase.from('navigator_tasks').insert({ member_id: body.member_id, type: 'concern_follow_up', source: 'buddy_call', source_id: data.id, status: 'open', priority: 'high', created_at: new Date().toISOString() })
  return NextResponse.json(data, { status: 201 })
}
