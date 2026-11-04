/**
 * app/api/corporate-volunteers/tier/route.ts — G5.10
 * GET /api/corporate-volunteers/tier?program_id=UUID
 * Returns tier, hours_total, tier_target, progress_pct, next_tier
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const TIER_CONFIG = {
  partner: { target: 200, next: 'champion', label: 'Community Partner' },
  champion: { target: 500, next: 'leader', label: 'Community Champion' },
  leader: { target: 500, next: null, label: 'Community Leader' },
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const programId = new URL(req.url).searchParams.get('program_id')
    if (!programId) return NextResponse.json({ error: 'program_id required' }, { status: 400 })

    const { data: program } = await supabase
      .from('corporate_volunteer_programs')
      .select('id, name, tier, employer_id')
      .eq('id', programId)
      .single()
    if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 404 })

    // Sum hours for this program's volunteers
    const { data: hoursData } = await supabase
      .from('volunteer_hours')
      .select('hours')
      .eq('program_id', programId)
    const totalHours = (hoursData ?? []).reduce((sum: number, h: any) => sum + (h.hours ?? 0), 0)

    const tier = program.tier ?? 'partner'
    const config = TIER_CONFIG[tier as keyof typeof TIER_CONFIG] ?? TIER_CONFIG.partner
    const pct = Math.min(Math.round((totalHours / config.target) * 100), 100)

    return NextResponse.json({
      program_id: programId,
      name: program.name,
      tier,
      tier_label: config.label,
      hours_total: totalHours,
      tier_target: config.target,
      progress_pct: pct,
      next_tier: config.next,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
