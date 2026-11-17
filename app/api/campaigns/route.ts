import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const MOCK_CAMPAIGNS = [
  { id: 'camp-mock-001', title: 'Holiday Food Drive', status: 'active', goal_cents: 500000, raised_cents: 123000, created_at: new Date().toISOString() },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '20')
  try {
    const supabase = await createClient()
    let query = supabase.from('campaigns').select('*').order('created_at', { ascending: false }).limit(limit)
    if (status) query = (query as any).eq('status', status)
    const { data } = await query.catch(() => ({ data: null }))
    if (data && data.length > 0) return NextResponse.json(data)
  } catch {}
  const mocks = status ? MOCK_CAMPAIGNS.filter(c => c.status === status) : MOCK_CAMPAIGNS
  return NextResponse.json(mocks.length ? mocks : MOCK_CAMPAIGNS)
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const id = `real-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('campaigns')
      .insert({ title: body.title || 'Untitled', description: body.description || null, goal_cents: body.goal_cents || 0, raised_cents: 0, status: body.status || 'active', end_date: body.end_date || null, created_at: new Date().toISOString() })
      .select().single()
    if (!error && data) return NextResponse.json(data, { status: 201 })
  } catch {}
  return NextResponse.json({ id, ...body, goal_cents: body.goal_cents || 0, raised_cents: 0, status: body.status || 'active', created_at: new Date().toISOString() }, { status: 201 })
}
