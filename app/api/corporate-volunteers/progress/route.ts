/**
 * app/api/corporate-volunteers/progress/route.ts — G7.11 Corporate Volunteer Tiers
 *
 * GET /api/corporate-volunteers/progress?org_id=<id>
 *   Returns the corporate volunteer programme's progress toward each tier,
 *   used to render the tier progress bar in the employer-admin portal.
 *
 * Tier definitions (from migration 095):
 *   bronze  — 5+ volunteers enrolled OR 20+ hours/quarter
 *   silver  — 15+ volunteers OR 60+ hours/quarter  + member_impact report
 *   gold    — 50+ volunteers OR 200+ hours/quarter + dedicated coordinator
 *
 * Tier is set on the corporate_volunteer_programs.tier column.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TIER_THRESHOLDS = {
  bronze: { volunteers: 5, hours_per_quarter: 20 },
  silver: { volunteers: 15, hours_per_quarter: 60 },
  gold: { volunteers: 50, hours_per_quarter: 200 },
}

type Tier = 'none' | 'bronze' | 'silver' | 'gold'

function computeEarnedTier(volunteerCount: number, quarterlyHours: number): Tier {
  if (
    volunteerCount >= TIER_THRESHOLDS.gold.volunteers ||
    quarterlyHours >= TIER_THRESHOLDS.gold.hours_per_quarter
  ) return 'gold'
  if (
    volunteerCount >= TIER_THRESHOLDS.silver.volunteers ||
    quarterlyHours >= TIER_THRESHOLDS.silver.hours_per_quarter
  ) return 'silver'
  if (
    volunteerCount >= TIER_THRESHOLDS.bronze.volunteers ||
    quarterlyHours >= TIER_THRESHOLDS.bronze.hours_per_quarter
  ) return 'bronze'
  return 'none'
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('org_id')
  if (!orgId) return NextResponse.json({ error: 'org_id required' }, { status: 400 })

  // Fetch the programme
  const { data: program } = await supabase
    .from('corporate_volunteer_programs')
    .select('id, company_name, tier, coordinator_name, coordinator_email, enrolled_count, active_since')
    .eq('id', orgId)
    .single()

  if (!program) return NextResponse.json({ error: 'Programme not found' }, { status: 404 })

  // Count enrolled volunteers for this org
  const { count: volunteerCount } = await supabase
    .from('volunteers')
    .select('id', { count: 'exact', head: true })
    .eq('corporate_program_id', orgId)
    .eq('volunteer_category', 'corporate')

  // Sum hours logged in the current quarter via time_bank_entries
  const quarterStart = getQuarterStart()
  const { data: hoursData } = await supabase
    .from('time_bank_entries')
    .select('hours')
    .eq('corporate_program_id', orgId)
    .gte('earned_at', quarterStart.toISOString())

  const quarterlyHours = (hoursData ?? []).reduce(
    (sum: number, row: { hours: number }) => sum + (row.hours ?? 0),
    0
  )

  const earnedTier = computeEarnedTier(volunteerCount ?? 0, quarterlyHours)

  // Auto-update tier on the programme if it changed
  if (earnedTier !== program.tier && earnedTier !== 'none') {
    await supabase
      .from('corporate_volunteer_programs')
      .update({ tier: earnedTier, enrolled_count: volunteerCount ?? 0 })
      .eq('id', orgId)
  }

  return NextResponse.json({
    program: {
      id: program.id,
      company_name: program.company_name,
      current_tier: program.tier ?? 'none',
      earned_tier: earnedTier,
      coordinator_name: program.coordinator_name,
      coordinator_email: program.coordinator_email,
    },
    stats: {
      volunteer_count: volunteerCount ?? 0,
      quarterly_hours: quarterlyHours,
      quarter_start: quarterStart.toISOString().split('T')[0],
    },
    thresholds: TIER_THRESHOLDS,
    next_tier: getNextTierProgress(volunteerCount ?? 0, quarterlyHours, program.tier ?? 'none'),
  })
}

function getQuarterStart(): Date {
  const now = new Date()
  const month = now.getMonth()
  const quarterMonth = Math.floor(month / 3) * 3
  return new Date(now.getFullYear(), quarterMonth, 1)
}

function getNextTierProgress(
  volunteerCount: number,
  quarterlyHours: number,
  currentTier: string
): {
  next_tier: string | null
  volunteers_needed: number
  hours_needed: number
  volunteers_progress_pct: number
  hours_progress_pct: number
} | null {
  const tierOrder: Tier[] = ['none', 'bronze', 'silver', 'gold']
  const currentIdx = tierOrder.indexOf(currentTier as Tier)
  if (currentIdx === tierOrder.length - 1) return null // already at gold

  const nextTier = tierOrder[currentIdx + 1] as keyof typeof TIER_THRESHOLDS
  const thresholds = TIER_THRESHOLDS[nextTier]

  return {
    next_tier: nextTier,
    volunteers_needed: Math.max(0, thresholds.volunteers - volunteerCount),
    hours_needed: Math.max(0, thresholds.hours_per_quarter - quarterlyHours),
    volunteers_progress_pct: Math.min(100, Math.round((volunteerCount / thresholds.volunteers) * 100)),
    hours_progress_pct: Math.min(100, Math.round((quarterlyHours / thresholds.hours_per_quarter) * 100)),
  }
}
