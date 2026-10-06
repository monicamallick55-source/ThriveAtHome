import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: fm } = await supabase.from('family_members').select('member_id').eq('supabase_auth_id', user.id).single()
  if (!fm?.member_id) return NextResponse.json({ error: 'Not found' }, { status: 403 })
  const { data, error } = await supabase
    .from('transition_plans')
    .select('*, transition_plan_steps(*)')
    .eq('member_id', fm.member_id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: fm } = await supabase.from('family_members').select('member_id, id').eq('supabase_auth_id', user.id).single()
  if (!fm?.member_id) return NextResponse.json({ error: 'Not found' }, { status: 403 })
  const { pathway, family_can_view, notes } = await req.json()
  if (!pathway) return NextResponse.json({ error: 'pathway required' }, { status: 400 })
  const { data: plan, error } = await supabase
    .from('transition_plans')
    .insert({ member_id: fm.member_id, pathway, family_can_view: family_can_view ?? false, notes, started_by: fm.id })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create 6-week default steps
  const steps = Array.from({ length: 6 }, (_, i) => ({
    plan_id: plan.id,
    week_number: i + 1,
    title: `Week ${i + 1}`,
    sort_order: i,
  }))
  await supabase.from('transition_plan_steps').insert(steps)

  return NextResponse.json(plan, { status: 201 })
}
