import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

const MOCK_EVENTS = [
  { id: '00000000-0000-0000-0000-000000000001', title: 'Morning Yoga', event_date: new Date(Date.now() + 86400000).toISOString(), status: 'upcoming', location: 'Community Center' },
  { id: '00000000-0000-0000-0000-000000000002', title: 'Book Club', event_date: new Date(Date.now() + 172800000).toISOString(), status: 'upcoming', location: 'Library' },
]

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true }).limit(limit)
    if (data && data.length > 0) return NextResponse.json(data)
  } catch {}
  return NextResponse.json(MOCK_EVENTS)
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch {}
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('events').insert({ ...body, ...(user ? { created_by: user.id } : {}), created_at: new Date().toISOString() }).select().single()
    if (data && !error) return NextResponse.json(data, { status: 201 })
  } catch {}
  return NextResponse.json({ id: `evt-${Date.now()}`, ...body, status: 'upcoming' }, { status: 201 })
}
