/**
 * app/api/transition-plans/route.ts — G7.15 Facility-Move Planning
 *
 * GET  /api/transition-plans            — member or navigator sees member's plans
 * POST /api/transition-plans            — create a new transition plan
 *
 * A transition plan walks a member (and their navigator) through the steps
 * of moving to assisted living, memory care, or another facility:
 *   - Benefits screening (Medi-Cal, VA, etc.)
 *   - Facility research / tours
 *   - Legal and financial prep (POA, trust, asset review)
 *   - Family conversation checklist
 *   - Moving coordination
 *   - Post-move follow-up
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DEFAULT_STEPS = [
  {
    step_number: 1,
    title: 'Benefits screening',
    description: 'Review Medi-Cal, VA, and SSI eligibility with your navigator. These can cover a large portion of facility costs.',
    category: 'financial',
    resources: ['Benefits finder', 'CalFresh enrollment', 'VA benefits line'],
  },
  {
    step_number: 2,
    title: 'Legal and financial preparation',
    description: 'Ensure durable power of attorney, healthcare directive, and trust or will documents are in place.',
    category: 'legal',
    resources: ['Trusted advisor directory', 'Legal Aid'],
  },
  {
    step_number: 3,
    title: 'Family conversation',
    description: 'Have a guided conversation with family members about preferences, timeline, and cost-sharing.',
    category: 'family',
    resources: ['Family meeting guide', 'Grief support'],
  },
  {
    step_number: 4,
    title: 'Facility research',
    description: 'Research facilities using state licensing records, reviews, and your navigator\'s knowledge of local options.',
    category: 'research',
    resources: ['CA Dept of Social Services CCLD', 'AARP facility ratings'],
  },
  {
    step_number: 5,
    title: 'Facility tours',
    description: 'Tour 2–3 facilities. Your navigator can join by phone. Use the checklist to compare each one.',
    category: 'research',
    resources: ['Tour checklist'],
  },
  {
    step_number: 6,
    title: 'Application and deposit',
    description: 'Once a facility is selected, complete the application, review the residency agreement, and pay deposit.',
    category: 'logistics',
    resources: ['Residency agreement review guide'],
  },
  {
    step_number: 7,
    title: 'Moving coordination',
    description: 'Arrange movers, donate or store belongings, and notify change of address.',
    category: 'logistics',
    resources: ['Moving checklist'],
  },
  {
    step_number: 8,
    title: 'Post-move follow-up',
    description: 'Your navigator will check in at 1 week, 1 month, and 3 months. Many people need adjustment support.',
    category: 'wellbeing',
    resources: ['Grace (AI companion)', 'Grief support', 'Family update'],
  },
]

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('member_id')

  let query = supabase
    .from('transition_plans')
    .select(`
      id, member_id, plan_type, status, target_date, notes,
      created_at, updated_at,
      transition_plan_steps (
        id, step_number, title, description, category,
        status, completed_at, navigator_notes, resources
      )
    `)
    .order('created_at', { ascending: false })

  if (memberId) query = query.eq('member_id', memberId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ plans: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { member_id, plan_type, target_date, notes } = body

  if (!member_id || !plan_type) {
    return NextResponse.json({ error: 'member_id and plan_type required' }, { status: 400 })
  }

  // Create the plan
  const { data: plan, error: planError } = await supabase
    .from('transition_plans')
    .insert({
      member_id,
      plan_type,
      status: 'active',
      target_date: target_date ?? null,
      notes: notes ?? null,
      created_by: user.id,
    })
    .select()
    .single()

  if (planError) return NextResponse.json({ error: planError.message }, { status: 500 })

  // Seed default steps for facility-move plans
  if (plan_type === 'facility_move') {
    const steps = DEFAULT_STEPS.map((step) => ({
      transition_plan_id: plan.id,
      member_id,
      step_number: step.step_number,
      title: step.title,
      description: step.description,
      category: step.category,
      resources: step.resources,
      status: 'pending',
    }))

    await supabase.from('transition_plan_steps').insert(steps)
      .then(({ error: _e }: { error: unknown }) => void _e)
  }

  // Create navigator task
  await supabase.from('navigator_tasks').insert({
    member_id,
    title: `Transition plan created: ${plan_type.replace(/_/g, ' ')}`,
    description: `A ${plan_type.replace(/_/g, ' ')} transition plan has been created. Begin with benefits screening and ensure legal documents are in place.`,
    priority: 'high',
    category: 'transition',
    status: 'pending',
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    metadata: { plan_id: plan.id, plan_type },
  }).then(({ error: _e }: { error: unknown }) => void _e)

  // Re-fetch with steps
  const { data: fullPlan } = await supabase
    .from('transition_plans')
    .select('*, transition_plan_steps(*)')
    .eq('id', plan.id)
    .single()

  return NextResponse.json({ plan: fullPlan }, { status: 201 })
}
