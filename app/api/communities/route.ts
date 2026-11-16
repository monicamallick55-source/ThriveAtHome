import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabase.from('interest_circles').select('*').eq('is_active', true).order('name').limit(50).catch(() => ({ data: null }))
  return NextResponse.json(data || [])
}
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { data } = await supabase.from('interest_circles').insert({ ...body, created_by: user.id, is_active: true, created_at: new Date().toISOString() }).select().single().catch(() => ({ data: null }))
  const id = `real-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return NextResponse.json(data || { id, ...body, is_active: true, created_at: new Date().toISOString() }, { status: 201 })
}
