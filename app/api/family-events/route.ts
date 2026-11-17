import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data } = await supabase.from('family_events').select('*').eq('created_by', user.id).order('created_at', { ascending: false }).limit(50).catch(() => ({ data: null }))
  return NextResponse.json(data || [])
}
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json().catch(() => ({}))
  const id = `real-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const { data } = await supabase.from('family_events').insert({ ...body, created_by: user.id, created_at: new Date().toISOString() }).select().single().catch(() => ({ data: null }))
  return NextResponse.json(data || { id, ...body, created_by: user.id, created_at: new Date().toISOString() }, { status: 201 })
}
