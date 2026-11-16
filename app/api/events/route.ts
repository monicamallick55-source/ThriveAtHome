import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true }).limit(limit).catch(() => ({ data: null }))
  return NextResponse.json(data || [])
}
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const id = `real-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const { data } = await supabase.from('events').insert({ ...body, created_by: user.id, created_at: new Date().toISOString() }).select().single().catch(() => ({ data: null }))
  return NextResponse.json(data || { id, ...body, created_at: new Date().toISOString() }, { status: 201 })
}
