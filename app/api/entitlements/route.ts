/**
 * app/api/entitlements/route.ts — G5.7 Plan Entitlements & Navigator Hours Seat Enforcement
 *
 * GET  /api/entitlements            — member's current plan entitlements + usage
 * GET  /api/entitlements?admin=true — org-level seat usage (admin only)
 * POST /api/entitlements/check      — gate check: can member use X feature?
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Map plan tier → entitlements
const PLAN_ENTITLEMENTS: Record<string, {
  navigator_hours_per_month: number
  buddy_calls_per_month: number
  group_events_per_month: number
  volunteer_requests_per_month: number
  ai_calls_per_month: number
  family_members: number
  can_access_marketplace: boolean
  can_access_encore_careers: boolean
  can_access_home_safety: boolean
}> = {
  basic: {
    navigator_hours_per_month: 1,
    buddy_calls_per_month: 2,
    group_events_per_month: 4,
    volunteer_requests_per_month: 2,
    ai_calls_per_month: 10,
    family_members: 2,
    can_access_marketplace: false,
    can_access_encore_careers: false,
    can_access_home_safety: true,
  },
  standard: {
    navigator_hours_per_month: 3,
    buddy_calls_per_month: 8,
    group_events_per_month: 12,
    volunteer_requests_per_month: 6,
    ai_calls_per_month: 30,
    family_members: 4,
    can_access_marketplace: true,
    can_access_encore_careers: true,
    can_access_home_safety: true,
  },
  premium: {
    navigator_hours_per_month: 10,
    buddy_calls_per_month: 999,
    group_events_per_month: 999,
    volunteer_requests_per_month: 999,
    ai_calls_per_month: 100,
    family_members: 8,
    can_access_marketplace: true,
    can_access_encore_careers: true,
    can_access_home_safety: true,
  },
  enterprise: {
    navigator_hours_per_month: 999,
    buddy_calls_per_month: 999,
    group_events_per_month: 999,
    volunteer_requests_per_month: 999,
    ai_calls_per_month: 999,
    family_members: 999,
    can_access_marketplace: true,
    can_access_encore_careers: true,
    can_access_home_safety: true,
  },
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await supabase
      .from('members')
      .select('id, org_id, role, plan_tier, subscription_status')
      .eq('user_id', user.id)
      .single()

    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const url = new URL(req.url)
    const adminView = url.searchParams.get('admin') === 'true'

    if (adminView && ['admin', 'navigator'].includes(member.role)) {
      const { data: orgMembers } = await supabase
        .from('members')
        .select('id, plan_tier, subscription_status, first_name, last_name, email')
        .eq('org_id', member.org_id)
        .eq('subscription_status', 'active')

      const tierCounts: Record<string, number> = {}
      ;(orgMembers ?? []).forEach((m: any) => {
        const t = m.plan_tier ?? 'basic'
        tierCounts[t] = (tierCounts[t] ?? 0) + 1
      })

      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const { data: navTasks } = await supabase
        .from('navigator_tasks')
        .select('member_id, completed_at')
        .eq('org_id', member.org_id)
        .gte('completed_at', monthStart.toISOString())
        .not('completed_at', 'is', null)

      return NextResponse.json({
        org_members: orgMembers ?? [],
        tier_counts: tierCounts,
        navigator_tasks_completed_this_month: (navTasks ?? []).length,
        total_active_members: (orgMembers ?? []).length,
      })
    }

    const tier = member.plan_tier ?? 'basic'
    const entitlements = PLAN_ENTITLEMENTS[tier] ?? PLAN_ENTITLEMENTS.basic

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const [
      { count: buddyCalls },
      { count: volunteerRequests },
      { count: navTasksThisMonth },
    ] = await Promise.all([
      supabase.from('buddy_calls').select('*', { count: 'exact', head: true })
        .eq('member_id', member.id).gte('created_at', monthStart.toISOString()),
      supabase.from('volunteer_requests').select('*', { count: 'exact', head: true })
        .eq('member_id', member.id).gte('created_at', monthStart.toISOString()),
      supabase.from('navigator_tasks').select('*', { count: 'exact', head: true })
        .eq('member_id', member.id).gte('created_at', monthStart.toISOString()),
    ])

    return NextResponse.json({
      tier,
      subscription_status: member.subscription_status,
      entitlements,
      usage: {
        buddy_calls_this_month: buddyCalls ?? 0,
        volunteer_requests_this_month: volunteerRequests ?? 0,
        navigator_tasks_this_month: navTasksThisMonth ?? 0,
      },
      limits_remaining: {
        buddy_calls: Math.max(0, entitlements.buddy_calls_per_month - (buddyCalls ?? 0)),
        volunteer_requests: Math.max(0, entitlements.volunteer_requests_per_month - (volunteerRequests ?? 0)),
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await supabase
      .from('members')
      .select('id, org_id, plan_tier, subscription_status')
      .eq('user_id', user.id)
      .single()

    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const body = await req.json()
    const { feature } = body

    if (!feature) return NextResponse.json({ error: 'feature is required' }, { status: 400 })

    if (member.subscription_status !== 'active') {
      return NextResponse.json({ allowed: false, reason: 'Subscription is not active' })
    }

    const tier = member.plan_tier ?? 'basic'
    const ent = PLAN_ENTITLEMENTS[tier] ?? PLAN_ENTITLEMENTS.basic

    const boolGates: Record<string, boolean> = {
      marketplace: ent.can_access_marketplace,
      encore_careers: ent.can_access_encore_careers,
      home_safety: ent.can_access_home_safety,
    }

    if (feature in boolGates) {
      return NextResponse.json({
        allowed: boolGates[feature],
        reason: boolGates[feature] ? null : `${feature} requires ${tier === 'basic' ? 'Standard' : 'Premium'} plan or higher`,
        tier,
      })
    }

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    if (feature === 'buddy_call') {
      const { count } = await supabase.from('buddy_calls').select('*', { count: 'exact', head: true })
        .eq('member_id', member.id).gte('created_at', monthStart.toISOString())
      const used = count ?? 0
      const limit = ent.buddy_calls_per_month
      return NextResponse.json({ allowed: used < limit, used, limit, remaining: Math.max(0, limit - used), tier })
    }

    if (feature === 'volunteer_request') {
      const { count } = await supabase.from('volunteer_requests').select('*', { count: 'exact', head: true })
        .eq('member_id', member.id).gte('created_at', monthStart.toISOString())
      const used = count ?? 0
      const limit = ent.volunteer_requests_per_month
      return NextResponse.json({ allowed: used < limit, used, limit, remaining: Math.max(0, limit - used), tier })
    }

    if (feature === 'navigator_hours') {
      const { count } = await supabase.from('navigator_tasks').select('*', { count: 'exact', head: true })
        .eq('member_id', member.id).gte('created_at', monthStart.toISOString())
      const used = count ?? 0
      const limit = ent.navigator_hours_per_month
      return NextResponse.json({ allowed: used < limit, used, limit, remaining: Math.max(0, limit - used), tier })
    }

    return NextResponse.json({ allowed: true, tier, reason: 'Unknown feature — allowed by default' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
