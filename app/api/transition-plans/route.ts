import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { resolveMemberContext } from '@/lib/data/members'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const supabase = await createClient()
  const { data, error } = await (supabase.from as any)('transition_plans')
    .select('*, transition_plan_steps(*)')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await resolveMemberContext(user.id)
  if (!memberId) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const body = await req.json()
  const { plan_type, title, target_date, notes, steps } = body
  if (!plan_type || !title) return NextResponse.json({ error: 'plan_type and title required' }, { status: 400 })

  const supabase = await createClient()
  const { data: plan, error } = await (supabase.from as any)('transition_plans')
    .insert({ member_id: memberId, plan_type, title, target_date, notes, created_by: memberId })
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (steps?.length) {
    await (supabase.from as any)('transition_plan_steps').insert(
      steps.map((s: any, i: number) => ({ plan_id: plan.id, step_order: i, title: s.title, description: s.description, due_date: s.due_date }))
    )
  }

  return NextResponse.json(plan, { status: 201 })
}
