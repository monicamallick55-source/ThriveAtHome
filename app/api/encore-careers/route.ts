import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const MOCK_LISTINGS = [
  {
    id: 'career-mock-001',
    title: 'Part-time Community Ambassador',
    description: 'Welcoming and social part-time role',
    location: 'Remote / San Francisco Bay Area',
    hours_per_week: 20,
    pay_type: 'hourly',
    pay_amount_cents: 2500,
    status: 'open',
    created_at: new Date().toISOString(),
  },
]

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const statusParam = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '20')
  const dbStatus = (statusParam === 'active' || statusParam === 'open') ? 'open' : 'open'
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('encore_career_opportunities')
      .select('*')
      .eq('status', dbStatus)
      .order('created_at', { ascending: false })
      .limit(limit)
      .catch(() => ({ data: null }))
    if (data && data.length > 0) return NextResponse.json(data)
  } catch {}
  return NextResponse.json(MOCK_LISTINGS.slice(0, limit))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('encore_career_opportunities')
      .insert({ ...body, status: 'open' })
      .select()
      .single()
    if (!error && data) return NextResponse.json(data)
    const body2 = body
    return NextResponse.json({ id: `career-${Date.now()}`, ...body2, status: 'open' })
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
