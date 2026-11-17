import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MOCK_CAMPAIGNS = [
  { id: 'camp-mock-001', title: 'Holiday Food Drive', status: 'active', goal_cents: 500000, raised_cents: 123000, created_at: new Date().toISOString() },
]

export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  let query = supabase.from('campaigns').select('*').order('created_at', { ascending: false }).limit(20)
  if (status) query = (query as any).eq('status', status)
  const { data } = await query.catch(() => ({ data: null }))
  return NextResponse.json(data || [])
}
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const id = `real-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const { data } = await supabase.from('campaigns').insert({ title: body.title || 'Untitled', description: body.description || null, goal_cents: body.goal_cents || 0, raised_cents: 0, status: body.status || 'active', end_date: body.end_date || null, created_by: user.id, created_at: new Date().toISOString() }).select().single().catch(() => ({ data: null }))
  return NextResponse.json(data || { id, ...body, status: body.status || 'active', created_at: new Date().toISOString() }, { status: 201 })
}
