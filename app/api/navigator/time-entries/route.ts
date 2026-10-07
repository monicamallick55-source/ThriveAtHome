import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth'
import { getEntitlements, navigatorUsagePct } from '@/lib/plans/entitlements'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data: fm } = await (supabase.from as any)('family_members')
    .select('id, role').eq('supabase_auth_id', user.id).maybeSingle()
  if (!['navigator', 'admin'].includes(fm?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('member_id')
  if (!memberId) return NextResponse.json({ error: 'member_id required' }, { status: 400 })

  const admin = createAdminClient()

  // Get member plan tier
  const { data: member } = await admin.from('members').select('plan_tier').eq('id', memberId).maybeSingle()
  const tier = (member as any)?.plan_tier ?? 'basics'
  const ent = getEntitlements(tier)

  // Sum minutes this calendar month
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { data: entries } = await (admin.from as any)('navigator_time_entries')
    .select('id, minutes, activity, logged_at, navigator_id')
    .eq('member_id', memberId)
    .gte('logged_at', monthStart.toISOString())
    .order('logged_at', { ascending: false })

  const minutesUsed = (entries ?? []).reduce((sum: number, e: any) => sum + e.minutes, 0)
  const usagePct = navigatorUsagePct(tier, minutesUsed)

  return NextResponse.json({
    member_id: memberId,
    plan_tier: tier,
    navigator_hours_per_month: ent.navigatorHoursPerMonth,
    minutes_used_this_month: minutesUsed,
    usage_pct: usagePct,
    at_80_pct: usagePct >= 80,
    over_limit: usagePct >= 100,
    entries: entries ?? [],
  })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data: fm } = await (supabase.from as any)('family_members')
    .select('id, role').eq('supabase_auth_id', user.id).maybeSingle()
  if (!['navigator', 'admin'].includes(fm?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { member_id, minutes, activity } = body as { member_id?: string; minutes?: number; activity?: string }
  if (!member_id || !minutes || !activity) {
    return NextResponse.json({ error: 'member_id, minutes, and activity are required' }, { status: 400 })
  }
  if (typeof minutes !== 'number' || minutes <= 0 || minutes > 480) {
    return NextResponse.json({ error: 'minutes must be between 1 and 480' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('navigator_time_entries').insert({
    member_id,
    navigator_id: fm.id,
    minutes,
    activity: String(activity).trim().slice(0, 200),
    logged_at: new Date().toISOString(),
  }).select().maybeSingle()

  if (error) {
    console.error('[time-entries] insert error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
