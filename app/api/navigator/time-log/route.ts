// app/api/navigator/time-log/route.ts
// POST — start or finish a navigator time entry
// GET  — fetch usage for a member in the current billing period

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function billingPeriod(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('member_id')
  const period = searchParams.get('period') ?? billingPeriod()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any

  // Verify staff or self
  const { data: isStaff } = await supabase.rpc('is_staff')
  let resolvedMemberId = memberId
  if (!isStaff) {
    const { data: member } = await db.from('members').select('id').eq('supabase_auth_id', user.id).maybeSingle()
    resolvedMemberId = member?.id ?? null
  }
  if (!resolvedMemberId) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  // Get usage summary
  const { data: summary } = await db
    .from('navigator_usage_summary')
    .select('*')
    .eq('member_id', resolvedMemberId)
    .eq('billing_period', period)
    .maybeSingle()

  // Get recent log entries
  const { data: logs } = await db
    .from('navigator_time_log')
    .select('id, started_at, ended_at, duration_minutes, log_type, notes, billing_period')
    .eq('member_id', resolvedMemberId)
    .eq('billing_period', period)
    .order('started_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ summary: summary ?? null, logs: logs ?? [], billing_period: period })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({})) as {
    action?: 'start' | 'end'
    member_id?: string
    task_id?: string
    log_type?: string
    notes?: string
    log_id?: string
    duration_minutes?: number
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any
  const period = billingPeriod()

  if (body.action === 'start') {
    if (!body.member_id) return NextResponse.json({ error: 'member_id required' }, { status: 400 })

    const { data: log, error } = await db
      .from('navigator_time_log')
      .insert({
        member_id: body.member_id,
        task_id: body.task_id ?? null,
        started_at: new Date().toISOString(),
        log_type: body.log_type ?? 'call',
        notes: body.notes ?? null,
        billing_period: period,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ log, action: 'started' }, { status: 201 })
  }

  if (body.action === 'end') {
    if (!body.log_id) return NextResponse.json({ error: 'log_id required' }, { status: 400 })

    const { data: log, error } = await db
      .from('navigator_time_log')
      .update({ ended_at: new Date().toISOString(), notes: body.notes ?? undefined })
      .eq('id', body.log_id)
      .is('ended_at', null)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!log) return NextResponse.json({ error: 'Log not found or already ended' }, { status: 404 })

    // Update usage summary
    await upsertUsageSummary(db, log.member_id, period)
    return NextResponse.json({ log, action: 'ended' })
  }

  return NextResponse.json({ error: 'action must be start or end' }, { status: 400 })
}

async function upsertUsageSummary(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  memberId: string,
  period: string
) {
  // Get member's plan tier
  const { data: member } = await db
    .from('members')
    .select('plan_tier')
    .eq('id', memberId)
    .maybeSingle()

  const tier = member?.plan_tier ?? 'basic'

  const { data: config } = await db
    .from('navigator_seat_config')
    .select('monthly_minutes')
    .eq('plan_tier', tier)
    .maybeSingle()

  const allocated = config?.monthly_minutes ?? 30

  // Sum used minutes
  const { data: logs } = await db
    .from('navigator_time_log')
    .select('duration_minutes')
    .eq('member_id', memberId)
    .eq('billing_period', period)
    .not('duration_minutes', 'is', null)

  const used = ((logs ?? []) as Array<{ duration_minutes: number }>)
    .reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0)

  const overage = Math.max(0, used - allocated)

  await db
    .from('navigator_usage_summary')
    .upsert(
      { member_id: memberId, billing_period: period, plan_tier: tier, allocated_minutes: allocated, used_minutes: used, overage_minutes: overage, last_computed_at: new Date().toISOString() },
      { onConflict: 'member_id,billing_period' }
    )
}
