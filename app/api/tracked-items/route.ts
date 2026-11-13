import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  let supabase: any
  try { supabase = await createClient() } catch { return NextResponse.json([]) }
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
  if (!user) return NextResponse.json([])
  const { searchParams } = new URL(req.url)
  const upcoming = searchParams.get('upcoming')
  const days = parseInt(searchParams.get('days') || '7')
  const status = searchParams.get('status')
  let member = null
  const { data: m1 } = await supabase.from('members').select('id').eq('supabase_auth_id', user.id).maybeSingle().catch(() => ({ data: null }))
  member = m1
  if (!member) {
    const { data: m2 } = await supabase.from('members').select('id').eq('user_id', user.id).maybeSingle().catch(() => ({ data: null }))
    member = m2
  }
  if (!member) return NextResponse.json([])
  let query = supabase.from('tracked_items').select('*').eq('member_id', member.id)
  if (status) query = query.eq('status', status)
  if (upcoming) {
    const future = new Date(); future.setDate(future.getDate() + days)
    query = query.lte('due_date', future.toISOString()).gte('due_date', new Date().toISOString())
  }
  const { data } = await query.order('due_date', { ascending: true }).limit(20).catch(() => ({ data: null }))
  return NextResponse.json(data || [])
}
export async function POST(req: NextRequest) {
  let supabase: any
  try { supabase = await createClient() } catch { return NextResponse.json([]) }
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
  if (!user) return NextResponse.json([])
  const body = await req.json().catch(() => ({}))
  let member = null
  const { data: m1 } = await supabase.from('members').select('id').eq('supabase_auth_id', user.id).maybeSingle().catch(() => ({ data: null }))
  member = m1
  if (!member) {
    const { data: m2 } = await supabase.from('members').select('id').eq('user_id', user.id).maybeSingle().catch(() => ({ data: null }))
    member = m2
  }
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  const { data, error } = await supabase.from('tracked_items').insert({
    ...body, member_id: member.id, created_at: new Date().toISOString(),
  }).select().single().catch(() => ({ data: null, error: 'insert failed' }))
  if (error && !data) return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
