import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabase.from('transition_plans').select('*')
    .order('created_at', { ascending: false }).limit(50).catch(() => ({ data: null }))
  return NextResponse.json(data || [])
}
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const id = `real-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const { data } = await supabase.from('transition_plans').insert({
    ...body, user_id: user.id, status: 'active', created_at: new Date().toISOString()
  }).select().single().catch(() => ({ data: null }))
  return NextResponse.json(data || { id, ...body, status: 'active', created_at: new Date().toISOString() }, { status: 201 })
}
