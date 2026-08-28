// M26 Phase 108 — Caregiver Family Plan: create the monthly coordinator-call
// navigator task for every member with an active caregiver_family_plan add-on
// whose last coordinator_call task is 25+ days old (or missing).
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const admin = createAdminClient()

  const { data: addons, error } = await admin
    .from('member_addons')
    .select('member_id')
    .eq('addon_key', 'caregiver_family_plan')
    .eq('status', 'active')
  if (error) {
    console.error('[coordinator-calls] fetch addons:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const memberIds = Array.from(new Set((addons ?? []).map((a) => a.member_id)))
  const cutoff = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  let created = 0

  for (const memberId of memberIds) {
    const { data: recent } = await admin
      .from('navigator_tasks')
      .select('id, created_at')
      .eq('member_id', memberId)
      .eq('task_type', 'coordinator_call')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (recent && recent.created_at >= cutoff) continue

    const { data: member } = await admin
      .from('members')
      .select('preferred_name')
      .eq('id', memberId)
      .maybeSingle()

    const { error: taskErr } = await admin.from('navigator_tasks').insert({
      member_id: memberId,
      task_type: 'coordinator_call',
      description:
        `Caregiver Family Plan: schedule this month's 30-minute family coordinator call for ` +
        `${member?.preferred_name ?? 'the member'}. Confirm attendees, review the shared task list, ` +
        `and send the consolidated monthly care summary afterward.`,
      priority: 'medium',
    })
    if (taskErr) {
      console.error('[coordinator-calls] task insert:', taskErr.message)
      continue
    }
    console.log(`[coordinator-calls] Created monthly coordinator-call task for member ${memberId}`)
    created += 1
  }

  return NextResponse.json({ familyPlans: memberIds.length, tasksCreated: created })
}
