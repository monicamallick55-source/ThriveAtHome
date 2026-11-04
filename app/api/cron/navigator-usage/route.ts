// app/api/cron/navigator-usage/route.ts
// Monthly cron: recompute navigator usage for all members in current period
// Vercel cron: "0 6 1 * *" (1st of each month, 6am UTC)

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function billingPeriod(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAdmin = createAdminClient() as any
  const period = billingPeriod()

  // Get all members who have time logs this period
  const { data: memberRows } = await supabaseAdmin
    .from('navigator_time_log')
    .select('member_id')
    .eq('billing_period', period)

  const memberIds = [...new Set(((memberRows ?? []) as Array<{ member_id: string }>).map(r => r.member_id))]
  const updated: string[] = []

  for (const memberId of memberIds) {
    const { data: member } = await supabaseAdmin.from('members').select('plan_tier').eq('id', memberId).maybeSingle()
    const tier = member?.plan_tier ?? 'basic'
    const { data: config } = await supabaseAdmin.from('navigator_seat_config').select('monthly_minutes').eq('plan_tier', tier).maybeSingle()
    const allocated = config?.monthly_minutes ?? 30

    const { data: logs } = await supabaseAdmin
      .from('navigator_time_log')
      .select('duration_minutes')
      .eq('member_id', memberId)
      .eq('billing_period', period)
      .not('duration_minutes', 'is', null)

    const used = ((logs ?? []) as Array<{ duration_minutes: number }>).reduce((s, l) => s + l.duration_minutes, 0)
    const overage = Math.max(0, used - allocated)

    await supabaseAdmin.from('navigator_usage_summary').upsert(
      { member_id: memberId, billing_period: period, plan_tier: tier, allocated_minutes: allocated, used_minutes: used, overage_minutes: overage, last_computed_at: new Date().toISOString() },
      { onConflict: 'member_id,billing_period' }
    )

    if (overage > 0) {
      // Create navigator task to review overage
      const { data: existing } = await supabaseAdmin
        .from('navigator_tasks')
        .select('id')
        .eq('type', 'navigator_overage')
        .contains('metadata', { member_id: memberId, billing_period: period })
        .maybeSingle()

      if (!existing) {
        await supabaseAdmin.from('navigator_tasks').insert({
          type: 'navigator_overage',
          member_id: memberId,
          priority: 'medium',
          title: `Navigator overage: ${overage} min over limit`,
          body: `Member used ${used} min of navigator time in ${period} (allocated ${allocated} min, ${overage} min overage). Consider plan upgrade conversation.`,
          metadata: { member_id: memberId, billing_period: period, used_minutes: used, allocated_minutes: allocated, overage_minutes: overage },
          status: 'open',
        })
      }
    }

    updated.push(memberId)
  }

  return NextResponse.json({ updated: updated.length, period, ran_at: new Date().toISOString() })
}
