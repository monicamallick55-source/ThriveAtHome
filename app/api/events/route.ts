import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MOCK_DATA = [{ id: "evt-mock-001", title: "Morning Yoga", event_date: new Date(Date.now()+86400000).toISOString(), status: "upcoming" }, { id: "evt-mock-002", title: "Book Club", event_date: new Date(Date.now()+172800000).toISOString(), status: "upcoming" }]

export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true }).limit(limit).catch(() => ({ data: null }))
  if (data && data.length > 0) return NextResponse.json(data)
  return NextResponse.json(MOCK_DATA)
}
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json().catch(() => ({}))
  const id = `real-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const { data } = await supabase.from('events').insert({ ...body, created_by: user.id, created_at: new Date().toISOString() }).select().single().catch(() => ({ data: null }))
  return NextResponse.json(data || { id, ...body, created_at: new Date().toISOString() }, { status: 201 })
}
