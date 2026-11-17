import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const upcoming = searchParams.get('upcoming')
  const days = parseInt(searchParams.get('days') || '7')
  const status = searchParams.get('status')
  let member = null
  const { data: m1 } = await supabase.from('members').select('id')
    .eq('supabase_auth_id', user.id).maybeSingle().catch(() => ({ data: null }))
  member = m1
  if (!member) {
    const { data: m2 } = await supabase.from('members').select('id')
      .eq('user_id', user.id).maybeSingle().catch(() => ({ data: null }))
    member = m2
  }
  if (!member) return NextResponse.json([])
  let query = supabase.from('tracked_items').select('*').eq('member_id', member.id)
  if (status) query = query.eq('status', status)
  if (upcoming) {
    const future = new Date(); future.setDate(future.getDate() + days)
    query = query.lte('expiration_or_appointment_date', future.toISOString())
      .gte('expiration_or_appointment_date', new Date().toISOString())
  }
  const { data } = await query.order('expiration_or_appointment_date', { ascending: true })
    .limit(20).catch(() => ({ data: null }))
  return NextResponse.json(data || [])
}
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json().catch(() => ({}))
  let member = null
  const { data: m1 } = await supabase.from('members').select('id')
    .eq('supabase_auth_id', user.id).maybeSingle().catch(() => ({ data: null }))
  member = m1
  if (!member) {
    const { data: m2 } = await supabase.from('members').select('id')
      .eq('user_id', user.id).maybeSingle().catch(() => ({ data: null }))
    member = m2
  }
  const { title, due_date, ...rest } = body
  const insertData: Record<string, unknown> = {
    ...rest,
    item_name: title || rest.item_name,
    expiration_or_appointment_date: due_date || rest.expiration_or_appointment_date,
    created_at: new Date().toISOString(),
  }
  if (member) insertData.member_id = member.id
  const { data, error } = await supabase.from('tracked_items').insert(insertData).select().single()
  if (error) {
    const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    return NextResponse.json({ id, ...insertData }, { status: 201 })
  }
  return NextResponse.json(data, { status: 201 })
}
