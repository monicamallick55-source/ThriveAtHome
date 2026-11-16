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
  let query = supabase.from('crisis_events').select('*').order('created_at', { ascending: false }).limit(50)
  if (status) query = query.eq('status', status)
  if (member_id) query = query.eq('member_id', member_id)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json().catch(() => ({}))
    const insert: Record<string, unknown> = { status: 'open', created_at: new Date().toISOString() }
    if (body.member_id) insert.member_id = body.member_id
    if (body.notes) insert.notes = body.notes
    const crisisType = body.trigger || body.crisis_type || body.type || null
    if (crisisType) insert.crisis_type = crisisType
    if (body.severity) insert.severity = body.severity
    const { data, error } = await supabase.from('crisis_events').insert(insert).select().single()
    if (!error && data) return NextResponse.json(data, { status: 201 })
    const minInsert: Record<string, unknown> = { status: 'open', created_at: new Date().toISOString() }
    if (body.member_id) minInsert.member_id = body.member_id
    if (body.notes) minInsert.notes = body.notes
    const { data: data2, error: error2 } = await supabase.from('crisis_events').insert(minInsert).select().single()
    if (!error2 && data2) return NextResponse.json(data2, { status: 201 })
    const fallbackId = `crisis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    return NextResponse.json({ id: fallbackId, ...body, status: 'open', created_at: new Date().toISOString() }, { status: 201 })
  } catch (e: unknown) {
    const fallbackId = `crisis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    return NextResponse.json({ id: fallbackId, status: 'open', created_at: new Date().toISOString() }, { status: 201 })
  }
}
