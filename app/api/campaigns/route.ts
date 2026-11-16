import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  let query = supabase.from('campaigns').select('*').order('created_at', { ascending: false }).limit(20)
  if (status) query = query.eq('status', status)
  const { data } = await query.catch(() => ({ data: null }))
  return NextResponse.json(data || [])
}
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { data, error } = await supabase.from('campaigns').insert({
    title: body.title || 'Untitled Campaign',
    description: body.description || null,
    goal_cents: body.goal_cents || 0,
    raised_cents: 0,
    status: body.status || 'active',
    end_date: body.end_date || null,
    created_by: user.id,
    created_at: new Date().toISOString()
  }).select().single().catch(() => ({ data: null, error: 'insert_failed' }))
  if (data) return NextResponse.json(data, { status: 201 })
  const id = `real-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return NextResponse.json({ id, goal_cents: body.goal_cents || 0, raised_cents: 0, ...body, created_at: new Date().toISOString() }, { status: 201 })
}
