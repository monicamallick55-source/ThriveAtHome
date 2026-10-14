// app/api/transition-plans/route.ts
// G7.15 — Facility-move planning workflow
// GET  — list plans for member (staff, navigator, or family when family_can_see=true)
// POST — navigator creates a new plan with 6-week auto-checklist
// PATCH — mark step complete, update plan status, toggle family visibility

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 6-week facility-move checklist template
const MOVE_CHECKLIST: Array<{ week: number; step: number; title: string; description: string; requiresTransport: boolean }> = [
  // Week 1 — Assessment & Planning
  { week: 1, step: 1, title: 'Initial assessment meeting', description: 'Navigator meets with member and family to assess needs, preferences, and timeline for the move.', requiresTransport: false },
  { week: 1, step: 2, title: 'Research facility options', description: 'Identify 3–5 suitable facilities based on care level, location, cost, and member preferences.', requiresTransport: false },
  { week: 1, step: 3, title: 'Schedule facility tours', description: 'Book tours at top 2–3 candidate facilities with member and key family members.', requiresTransport: true },

  // Week 2 — Decision & Paperwork
  { week: 2, step: 4, title: 'Facility tours', description: 'Accompany member and family on tours. Take notes and photos for comparison.', requiresTransport: true },
  { week: 2, step: 5, title: 'Select facility', description: 'Review tour notes with member and family. Confirm facility selection and place hold if available.', requiresTransport: false },
  { week: 2, step: 6, title: 'Obtain admission paperwork', description: 'Request and review admission agreement, fee schedule, and care plan from chosen facility.', requiresTransport: false },

  // Week 3 — Medical & Financial Prep
  { week: 3, step: 7, title: 'Medical records transfer', description: 'Request transfer of medical records, medication list, and care history to new facility.', requiresTransport: false },
  { week: 3, step: 8, title: 'Financial & benefits review', description: 'Confirm payment method (Medicare, Medicaid, private pay). Coordinate with Benefits Hub if needed.', requiresTransport: false },
  { week: 3, step: 9, title: 'Sign admission agreement', description: 'Review and sign admission agreement with member and power-of-attorney family member.', requiresTransport: true },

  // Week 4 — Logistics
  { week: 4, step: 10, title: 'Sort and donate belongings', description: 'Help member decide what to bring, store, donate, or gift. Coordinate donations pickup if needed.', requiresTransport: false },
  { week: 4, step: 11, title: 'Arrange moving help', description: 'Coordinate volunteers, family, or professional movers for moving day. Book transport for member.', requiresTransport: false },
  { week: 4, step: 12, title: 'Notify service providers', description: 'Update address with USPS, Medicare, Social Security, bank, pharmacy, and other key services.', requiresTransport: false },

  // Week 5 — Move Day Prep
  { week: 5, step: 13, title: 'Personalize new room', description: 'Arrange delivery of photos, furniture, and meaningful items to new room before move-in.', requiresTransport: true },
  { week: 5, step: 14, title: 'Move day transport', description: 'Transport member to new facility on move day. Ensure family or navigator present for first hours.', requiresTransport: true },
  { week: 5, step: 15, title: 'Meet care team', description: 'Introduce member and family to facility care team, roommate if applicable, and key staff.', requiresTransport: false },

  // Week 6 — Adjustment & Follow-up
  { week: 6, step: 16, title: '3-day check-in call', description: 'Navigator calls member 3 days after move-in to assess comfort, identify any issues.', requiresTransport: false },
  { week: 6, step: 17, title: '1-week family debrief', description: 'Check in with family on how member is adjusting. Address any concerns with facility.', requiresTransport: false },
  { week: 6, step: 18, title: '30-day post-move review', description: 'Schedule 30-day review with facility care team and family. Update care plan as needed.', requiresTransport: false },
]

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const url = new URL(req.url)
  const memberId = url.searchParams.get('memberId')
  const planId = url.searchParams.get('planId')

  const admin = createAdminClient()

  // If planId specified, return plan + steps
  if (planId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: plan, error } = await (admin as any)
      .from('transition_plans')
      .select('*, steps:transition_plan_steps(*)')
      .eq('id', planId)
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    return NextResponse.json({ plan })
  }

  if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: plans, error } = await (admin as any)
    .from('transition_plans')
    .select('*, steps:transition_plan_steps(id, step_number, title, completed_at, due_date)')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ plans })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Staff only
  const { data: fm } = await supabase
    .from('family_members')
    .select('id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm || !['staff', 'navigator', 'admin'].includes((fm as any).role)) {
    return NextResponse.json({ error: 'Staff only' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const memberId: string | null = typeof body?.memberId === 'string' ? body.memberId : null
  const planType: string = typeof body?.planType === 'string' ? body.planType : 'facility_move'
  const title: string = typeof body?.title === 'string' ? body.title.slice(0, 200) : 'Facility Move Plan'
  const targetDate: string | null = typeof body?.targetDate === 'string' ? body.targetDate : null
  const familyCanSee: boolean = body?.familyCanSee !== false

  if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })

  const admin = createAdminClient()

  // Create the plan
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: plan, error: planError } = await (admin as any)
    .from('transition_plans')
    .insert({
      member_id: memberId,
      navigator_id: fm.id,
      plan_type: planType,
      title,
      target_date: targetDate,
      family_can_see: familyCanSee,
      status: 'active',
    })
    .select('id')
    .single()

  if (planError) return NextResponse.json({ error: planError.message }, { status: 500 })

  // Auto-generate 6-week checklist
  const startDate = targetDate ? new Date(targetDate) : new Date()
  // Target date is end of week 6; week 1 starts 6 weeks before target
  const week1Start = new Date(startDate)
  week1Start.setDate(week1Start.getDate() - 35) // 5 weeks before target

  const steps = MOVE_CHECKLIST.map((tpl) => {
    const dueDate = new Date(week1Start)
    dueDate.setDate(dueDate.getDate() + (tpl.week - 1) * 7 + 6) // end of each week
    return {
      plan_id: plan.id,
      step_number: tpl.step,
      week_number: tpl.week,
      title: tpl.title,
      description: tpl.description,
      due_date: dueDate.toISOString().split('T')[0],
      requires_transport: tpl.requiresTransport,
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: stepsError } = await (admin as any)
    .from('transition_plan_steps')
    .insert(steps)

  if (stepsError) return NextResponse.json({ error: stepsError.message }, { status: 500 })

  // Create navigator task
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('navigator_tasks').insert({
    member_id: memberId,
    task_type: 'transition_plan_started',
    priority: 'high',
    description: `Facility move plan "${title}" created. 18-step, 6-week checklist generated.`,
    metadata: { plan_id: plan.id, target_date: targetDate },
  }).catch(() => null)

  return NextResponse.json({ ok: true, planId: plan.id, stepsCreated: steps.length }, { status: 201 })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: fm } = await supabase
    .from('family_members')
    .select('id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { planId, stepId, action } = body

  const admin = createAdminClient()

  if (action === 'complete_step' && stepId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from('transition_plan_steps')
      .update({
        completed_at: new Date().toISOString(),
        completed_by: fm.id,
        notes: body.notes ?? null,
      })
      .eq('id', stepId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'uncomplete_step' && stepId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from('transition_plan_steps')
      .update({ completed_at: null, completed_by: null })
      .eq('id', stepId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'update_plan' && planId) {
    const updates: Record<string, unknown> = {}
    if (body.status) updates.status = body.status
    if (body.familyCanSee !== undefined) updates.family_can_see = body.familyCanSee
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.targetDate !== undefined) updates.target_date = body.targetDate

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from('transition_plans')
      .update(updates)
      .eq('id', planId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
