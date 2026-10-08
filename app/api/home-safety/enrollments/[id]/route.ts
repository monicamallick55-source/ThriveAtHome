// app/api/admin/home-safety/enrollments/[id]/route.ts
// GET  — enrollment detail with check, proposal, go-bag (admin/navigator)
// PATCH — update enrollment status, assign volunteer, pick work tier, build proposal

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function resolveStaff(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: fm } = await supabase
    .from('family_members')
    .select('id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm || (fm.role !== 'admin' && fm.role !== 'navigator')) return null
  return fm
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const staff = await resolveStaff(supabase)
  if (!staff) return NextResponse.json({ error: 'Staff only' }, { status: 403 })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: enrollment } = await (admin as any)
    .from('safety_program_enrollments')
    .select(`
      *,
      member:members(id, full_name, preferred_name, phone, city, state, subscription_tier),
      volunteer:members!safety_program_enrollments_volunteer_id_fkey(id, full_name, preferred_name),
      program:safety_programs(id, name, program_year, subsidy_per_home_cents),
      checks:home_safety_checks(*, items:home_safety_items(*)),
      proposals:safety_proposals(*, lines:safety_proposal_lines(*)),
      go_bags(*),
      emergency_magnets(*)
    `)
    .eq('id', id)
    .maybeSingle()

  if (!enrollment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(enrollment)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const staff = await resolveStaff(supabase)
  if (!staff) return NextResponse.json({ error: 'Staff only' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const admin = createAdminClient()

  // Special action: assign volunteer (enforce max 5)
  if (body.action === 'assign_volunteer') {
    const { volunteer_id } = body
    if (!volunteer_id) return NextResponse.json({ error: 'volunteer_id required' }, { status: 400 })

    // Get program_id for this enrollment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: enr } = await (admin as any)
      .from('safety_program_enrollments')
      .select('program_id')
      .eq('id', id)
      .maybeSingle()
    if (!enr) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })

    // Count how many active homes this volunteer already has
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (admin as any)
      .from('safety_program_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('program_id', enr.program_id)
      .eq('volunteer_id', volunteer_id)
      .not('status', 'in', '("declined","withdrawn")')

    // Get max_households for volunteer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: volRecord } = await (admin as any)
      .from('safety_program_volunteers')
      .select('max_households')
      .eq('program_id', enr.program_id)
      .eq('volunteer_id', volunteer_id)
      .maybeSingle()

    const max = volRecord?.max_households ?? 5
    if ((count ?? 0) >= max) {
      return NextResponse.json({ error: `This volunteer already has ${count} assigned homes (max ${max})` }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from('safety_program_enrollments')
      .update({ volunteer_id })
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // Special action: create proposal with line items
  if (body.action === 'create_proposal') {
    const { tier_key, lines } = body
    if (!tier_key) return NextResponse.json({ error: 'tier_key required' }, { status: 400 })
    if (!Array.isArray(lines)) return NextResponse.json({ error: 'lines array required' }, { status: 400 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: proposal, error: propError } = await (admin as any)
      .from('safety_proposals')
      .insert({
        enrollment_id: id,
        tier_key,
        status: 'draft',
        total_free_cents: lines.filter((l: Record<string, number>) => l.member_cost_cents === 0 && l.subsidy_cents === 0).reduce((s: number, l: Record<string, number>) => s + (l.est_cost_cents ?? 0), 0),
        total_subsidy_cents: lines.reduce((s: number, l: Record<string, number>) => s + (l.subsidy_cents ?? 0), 0),
        total_member_cents: lines.reduce((s: number, l: Record<string, number>) => s + (l.member_cost_cents ?? 0), 0),
      })
      .select()
      .single()

    if (propError) return NextResponse.json({ error: propError.message }, { status: 500 })

    const lineRows = lines.map((l: Record<string, unknown>) => ({
      proposal_id: proposal.id,
      item_key: l.item_key,
      description: l.description,
      route: l.route ?? 'contractor',
      est_cost_cents: l.est_cost_cents ?? 0,
      contractor_discount_cents: l.contractor_discount_cents ?? 0,
      subsidy_cents: l.subsidy_cents ?? 0,
      member_cost_cents: l.member_cost_cents ?? 0,
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: lineError } = await (admin as any)
      .from('safety_proposal_lines')
      .insert(lineRows)

    if (lineError) return NextResponse.json({ error: lineError.message }, { status: 500 })

    // Update enrollment status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('safety_program_enrollments')
      .update({ status: 'proposal_sent' })
      .eq('id', id)

    return NextResponse.json(proposal, { status: 201 })
  }

  // General status/field update
  const allowed = ['status', 'income_qualified', 'comments']
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: Record<string, any> = {}
  for (const key of allowed) {
    if (key in body) patch[key] = body[key]
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('safety_program_enrollments')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
