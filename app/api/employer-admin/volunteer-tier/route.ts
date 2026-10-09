// app/api/employer-admin/volunteer-tier/route.ts
// GET — current tier, hours logged, progress toward next tier
// PATCH — staff can update tier/hour_target manually

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const TIER_TARGETS: Record<string, number> = {
  partner: 200,
  champion: 500,
  leader: 1000,
}

const TIER_NEXT: Record<string, string | null> = {
  partner: 'champion',
  champion: 'leader',
  leader: null,
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const programId = searchParams.get('program_id')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  let query = admin
    .from('corporate_volunteer_programs')
    .select('id, name, tier, hour_target, recognition_badge_url, employer:employers(id, name, slug)')

  if (programId) {
    query = query.eq('id', programId).maybeSingle()
    const { data: program, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!program) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Sum hours for this program
    const { data: hoursData } = await admin
      .from('volunteer_hours')
      .select('hours')
      .eq('corporate_program_id', programId)

    const totalHours = (hoursData ?? []).reduce((s: number, r: Record<string, number>) => s + (r.hours ?? 0), 0)
    const tier = program.tier ?? 'partner'
    const target = TIER_TARGETS[tier] ?? 200
    const nextTier = TIER_NEXT[tier] ?? null

    return NextResponse.json({
      program,
      total_hours: totalHours,
      tier,
      hour_target: target,
      progress_pct: Math.min(100, Math.round((totalHours / target) * 100)),
      next_tier: nextTier,
      next_tier_target: nextTier ? TIER_TARGETS[nextTier] : null,
    })
  }

  // List all programs
  const { data: programs, error } = await query.order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ programs: programs ?? [] })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) return NextResponse.json({ error: 'Staff only' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { program_id, tier, recognition_badge_url } = body as {
    program_id?: string
    tier?: string
    recognition_badge_url?: string
  }

  if (!program_id) return NextResponse.json({ error: 'program_id required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  const update: Record<string, unknown> = {}
  if (tier) {
    update.tier = tier
    update.hour_target = TIER_TARGETS[tier] ?? 200
  }
  if (recognition_badge_url !== undefined) update.recognition_badge_url = recognition_badge_url

  const { data: program, error } = await admin
    .from('corporate_volunteer_programs')
    .update(update)
    .eq('id', program_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ program })
}
