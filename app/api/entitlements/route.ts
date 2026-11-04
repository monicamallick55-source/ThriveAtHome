/**
 * app/api/entitlements/route.ts — G5.7
 * GET /api/entitlements — returns the current member's plan limits + usage
 */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getPlanLimits } from '@/lib/entitlements/planLimits'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await supabase
      .from('members')
      .select('id, plan_tier')
      .eq('supabase_auth_id', user.id)
      .single()

    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const limits = getPlanLimits(member.plan_tier)

    // Count buddy calls this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: buddyCallsUsed } = await supabase
      .from('buddy_calls')
      .select('id', { count: 'exact', head: true })
      .eq('member_id', member.id)
      .gte('created_at', startOfMonth.toISOString())

    // Count navigator hours this month
    const { data: navHours } = await supabase
      .from('navigator_sessions')
      .select('duration_minutes')
      .eq('member_id', member.id)
      .gte('created_at', startOfMonth.toISOString())

    const navigatorMinutesUsed = (navHours ?? []).reduce(
      (sum: number, s: { duration_minutes: number }) => sum + (s.duration_minutes ?? 0), 0
    )
    const navigatorHoursUsed = Math.round(navigatorMinutesUsed / 60 * 10) / 10

    return NextResponse.json({
      plan_tier: member.plan_tier ?? 'basics',
      limits,
      usage: {
        buddy_calls_this_month: buddyCallsUsed ?? 0,
        navigator_hours_this_month: navigatorHoursUsed,
      },
      at_limit: {
        buddy_calls: (buddyCallsUsed ?? 0) >= limits.buddyCallsPerMonth,
        navigator_hours: navigatorHoursUsed >= limits.navigatorHoursPerMonth,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
