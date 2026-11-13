import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: circles, error } = await supabase.from('interest_circles').select('id, name, description, category, member_count, meeting_frequency, is_virtual').order('member_count', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const { data: memberships } = await supabase.from('circle_members').select('circle_id').eq('user_id', user.id)
  const memberSet = new Set((memberships ?? []).map((m: any) => m.circle_id))
  const result = (circles ?? []).map((c: any) => ({ ...c, is_member: memberSet.has(c.id) }))
  return NextResponse.json({ circles: result, total: result.length })
}
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { data, error } = await supabase.from('interest_circles').insert({ ...body, created_by: user.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
