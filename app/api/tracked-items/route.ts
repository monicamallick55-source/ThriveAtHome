import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const upcoming = searchParams.get('upcoming')
  const days = parseInt(searchParams.get('days') || '7')
  const status = searchParams.get('status')
  const { data: member } = await supabase.from('members').select('id').eq('user_id', user.id).maybeSingle()
  if (!member) return NextResponse.json({ data: [] })
  let query = supabase.from('tracked_items').select('*').eq('member_id', member.id)
  if (status) query = query.eq('status', status)
  if (upcoming) { const future = new Date(); future.setDate(future.getDate() + days); query = query.lte('due_date', future.toISOString()).gte('due_date', new Date().toISOString()) }
  const { data, error } = await query.order('due_date', { ascending: true }).limit(20)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { data: member } = await supabase.from('members').select('id').eq('user_id', user.id).maybeSingle()
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  const { data, error } = await supabase.from('tracked_items').insert({ ...body, member_id: member.id, created_at: new Date().toISOString() }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
