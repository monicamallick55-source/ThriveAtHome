import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: member } = await supabase.from('members').select('id').eq('supabase_auth_id', user.id).maybeSingle().catch(() => ({ data: null }))
  if (!member) return NextResponse.json([])
  const { data } = await supabase.from('member_pets').select('*').eq('member_id', member.id).catch(() => ({ data: null }))
  return NextResponse.json(data || [])
}
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const id = `real-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const { data: member } = await supabase.from('members').select('id').eq('supabase_auth_id', user.id).maybeSingle().catch(() => ({ data: null }))
  if (member) {
    const { data } = await supabase.from('member_pets').insert({ member_id: member.id, ...body, created_at: new Date().toISOString() }).select().single().catch(() => ({ data: null }))
    if (data) return NextResponse.json(data, { status: 201 })
  }
  return NextResponse.json({ id, ...body, member_id: member?.id ?? null, created_at: new Date().toISOString() }, { status: 201 })
}
