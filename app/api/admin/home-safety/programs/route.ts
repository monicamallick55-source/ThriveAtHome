// app/api/admin/home-safety/programs/route.ts
// GET  — list all safety programs (staff)
// POST — create a new program (staff)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function resolveAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: fm } = await supabase
    .from('family_members')
    .select('id, role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!fm || fm.role !== 'admin') return null
  return fm
}

export async function GET() {
  const supabase = await createClient()
  const staff = await resolveAdmin(supabase)
  if (!staff) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('safety_programs')
    .select(`
      *,
      contractor_partner:community_partners!safety_programs_contractor_partner_id_fkey(id, name),
      income_referral_partner:community_partners!safety_programs_income_referral_partner_id_fkey(id, name),
      enrollments:safety_program_enrollments(count)
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const staff = await resolveAdmin(supabase)
  if (!staff) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const {
    name, program_year, description, eligibility, capacity_households,
    enrollment_open, starts_on, ends_on, free_item_budget_cents,
    subsidy_per_home_cents, contractor_partner_id, income_referral_partner_id,
    sponsors, org_id,
  } = body

  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })
  if (!program_year?.trim()) return NextResponse.json({ error: 'program_year required' }, { status: 400 })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('safety_programs')
    .insert({
      name: name.trim(),
      program_year: program_year.trim(),
      description: description?.trim() ?? null,
      eligibility: eligibility ?? {},
      capacity_households: capacity_households ?? 20,
      enrollment_open: enrollment_open ?? true,
      starts_on: starts_on ?? null,
      ends_on: ends_on ?? null,
      free_item_budget_cents: free_item_budget_cents ?? 0,
      subsidy_per_home_cents: subsidy_per_home_cents ?? 0,
      contractor_partner_id: contractor_partner_id ?? null,
      income_referral_partner_id: income_referral_partner_id ?? null,
      sponsors: sponsors ?? [],
      org_id: org_id ?? null,
      created_by: staff.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Seed default work tiers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('safety_work_tiers').insert([
    { program_id: data.id, tier_key: 'basic', label: 'Basic Safety Package', description: 'Grab bars, smoke alarms, bulbs, batteries — free to all enrolled households' },
    { program_id: data.id, tier_key: 'enhanced', label: 'Enhanced Safety Package', description: 'Basic package plus additional modifications; some items may have a member cost' },
  ])

  return NextResponse.json(data, { status: 201 })
}
