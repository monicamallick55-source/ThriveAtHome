// app/api/transition-plans/route.ts
// GET — list transition plans for member (or all for staff)
// POST — navigator creates a new 6-week plan

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const DEFAULT_STEPS = [
  // Week 1 — Research
  { week_number: 1, category: 'research', title: 'Research facility options', description: 'Identify 3–5 facilities that meet the member\'s needs, budget, and location preferences.', sort_order: 1 },
  { week_number: 1, category: 'research', title: 'Check facility reviews and ratings', description: 'Review state inspection reports and ratings at Medicare.gov/care-compare.', sort_order: 2 },
  // Week 2 — Visits
  { week_number: 2, category: 'visits', title: 'Schedule facility tours', description: 'Book visits to the top 2–3 facilities. Note staff warmth, cleanliness, and activity programmes.', sort_order: 1 },
  { week_number: 2, category: 'transport', title: 'Arrange transport to tours', description: 'Coordinate transport for the member and family to attend facility visits.', sort_order: 2 },
  // Week 3 — Paperwork
  { week_number: 3, category: 'paperwork', title: 'Gather key documents', description: 'Medical records, insurance cards, advance directive, financial statements, and identification.', sort_order: 1 },
  { week_number: 3, category: 'paperwork', title: 'Review admission agreement', description: 'Have the attorney or trusted advisor review the facility\'s admission contract before signing.', sort_order: 2 },
  // Week 4 — Family coordination
  { week_number: 4, category: 'family', title: 'Family meeting', description: 'Bring family together to align on the decision, roles on moving day, and ongoing visit schedules.', sort_order: 1 },
  { week_number: 4, category: 'family', title: 'Assign family roles', description: 'Who coordinates the move? Who handles utilities/address change? Who does daily calls the first week?', sort_order: 2 },
  // Week 5 — Moving day plan
  { week_number: 5, category: 'moving', title: 'Pack personal items', description: 'Choose meaningful items, photos, and comfort objects. Label everything clearly.', sort_order: 1 },
  { week_number: 5, category: 'transport', title: 'Book moving transport', description: 'Arrange vehicle or moving service for furniture and belongings.', sort_order: 2 },
  { week_number: 5, category: 'moving', title: 'Update address and utilities', description: 'Notify post office, Medicare, Social Security, bank, and subscription services.', sort_order: 3 },
  // Week 6 — Post-move
  { week_number: 6, category: 'post_move', title: 'Move-in day support', description: 'Navigator or family present on move-in day to help the member settle in.', sort_order: 1 },
  { week_number: 6, category: 'post_move', title: 'Day-3 check-in call', description: 'Grace or navigator calls the member on day 3 to see how they are settling.', sort_order: 2 },
  { week_number: 6, category: 'post_move', title: 'Week-2 family update', description: 'Navigator sends a written update to the family about the member\'s adjustment.', sort_order: 3 },
]

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('member_id')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  let query = admin
    .from('transition_plans')
    .select(`
      id, created_at, updated_at, member_id, title, status, family_can_view,
      target_move_date, facility_name, facility_address, notes,
      member:members(id, full_name, preferred_name),
      navigator:family_members(id, member:members(full_name)),
      steps:transition_plan_steps(id, week_number, title, description, due_date, completed_at, category, sort_order)
    `)
    .order('created_at', { ascending: false })

  const { data: isStaff } = await supabase.rpc('is_staff')

  if (isStaff && memberId) {
    query = query.eq('member_id', memberId)
  } else if (!isStaff) {
    // Member sees own plans (RLS handles it but we scope anyway)
    const { data: fm } = await supabase
      .from('family_members')
      .select('member_id')
      .eq('supabase_auth_id', user.id)
      .maybeSingle()
    if (fm) query = query.eq('member_id', fm.member_id)
  }

  const { data: plans, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ plans: plans ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) return NextResponse.json({ error: 'Staff only' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { member_id, title, target_move_date, facility_name, family_can_view } = body as {
    member_id?: string
    title?: string
    target_move_date?: string
    facility_name?: string
    family_can_view?: boolean
  }

  if (!member_id) return NextResponse.json({ error: 'member_id required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  // Get navigator's family_member id
  const { data: navFm } = await admin
    .from('family_members')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  const { data: plan, error: planError } = await admin
    .from('transition_plans')
    .insert({
      member_id,
      navigator_id: navFm?.id ?? null,
      title: title ?? 'Facility Move Plan',
      target_move_date: target_move_date ?? null,
      facility_name: facility_name ?? null,
      family_can_view: family_can_view ?? false,
    })
    .select()
    .single()

  if (planError) return NextResponse.json({ error: planError.message }, { status: 500 })

  // Seed default 6-week steps
  const steps = DEFAULT_STEPS.map(s => ({ ...s, plan_id: plan.id }))
  await admin.from('transition_plan_steps').insert(steps)

  // Notify member
  await admin.from('realtime_notifications').insert({
    member_id,
    type: 'system_message',
    title: 'Your navigator has started a move planning checklist',
    body: 'Your navigator created a 6-week plan to help with your upcoming facility move. You can view it in your dashboard.',
    severity: 'info',
  })

  return NextResponse.json({ plan }, { status: 201 })
}
