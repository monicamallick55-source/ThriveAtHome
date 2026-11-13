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
  let member = null
  const { data: m1 } = await supabase.from('members').select('id').eq('supabase_auth_id', user.id).maybeSingle().catch(() => ({ data: null }))
  member = m1
  if (!member) { const { data: m2 } = await supabase.from('members').select('id').eq('user_id', user.id).maybeSingle().catch(() => ({ data: null })); member = m2 }
  if (!member) return NextResponse.json([])
  let query = supabase.from('tracked_items').select('*').eq('member_id', member.id)
  if (status) query = query.eq('status', status)
  if (upcoming) { const future = new Date(); future.setDate(future.getDate() + days); query = query.lte('due_date', future.toISOString()).gte('due_date', new Date().toISOString()) }
  const { data } = await query.order('due_date', { ascending: true }).limit(20).catch(() => ({ data: null }))
  return NextResponse.json(data || [])
}
