// app/api/cron/milestone-birthdays/route.ts
// G7.6 — Milestone birthday detection (70/75/80/85/90/100)
// Runs 30 days before the milestone birthday to trigger enhanced programs
// Schedule: daily at 7am UTC
// Cron expression: 0 7 * * *

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMilestoneForAge } from '@/lib/celebrations/milestones'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const today = new Date()
  today.setUTCHours(12, 0, 0, 0)

  // Target: members whose birthday is exactly 30 days from now
  const target = new Date(today)
  target.setDate(target.getDate() + 30)
  const targetMmDd = target.toISOString().slice(5, 10)  // "MM-DD"

  // Find members with birthday on this date who aren't opted out
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: members } = await (admin as any)
    .from('members')
    .select('id, full_name, dob, celebration_opt_out')
    .not('dob', 'is', null)
    .ilike('dob', `%-${targetMmDd}`)
    .limit(50)

  let milestonesFound = 0

  for (const member of (members ?? [])) {
    if (member.celebration_opt_out) continue

    // Calculate the age they'll be turning
    const birth = new Date(member.dob + 'T12:00:00Z')
    const turningAge = target.getFullYear() - birth.getFullYear()

    const program = getMilestoneForAge(turningAge)
    if (!program) continue

    // Prevent duplicate tasks this year
    const taskKey = `milestone_${member.id}_age${turningAge}`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (admin as any)
      .from('navigator_tasks')
      .select('id')
      .eq('member_id', member.id)
      .contains('metadata', { milestone_key: taskKey })
      .limit(1)

    if ((existing?.length ?? 0) > 0) continue

    // Create high-priority navigator task
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('navigator_tasks').insert({
      member_id: member.id,
      task_type: 'milestone_birthday',
      priority: turningAge >= 90 ? 'critical' : turningAge >= 80 ? 'high' : 'medium',
      description: `${member.full_name} — ${program.label} in 30 days (${target.toISOString().slice(0, 10)}). ${program.navigatorTaskDescription}`,
      metadata: {
        milestone_key: taskKey,
        milestone_age: turningAge,
        milestone_label: program.label,
        birthday_date: target.toISOString().slice(0, 10),
        recommended_tier: program.celebrationTier,
      },
    }).catch(() => null)

    // Inject Aria context starting now (active for 35 days)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('aria_call_contexts').upsert({
      member_id: member.id,
      context_type: 'milestone_birthday_upcoming',
      context_key: `milestone_${member.id}_${turningAge}`,
      content: `MILESTONE BIRTHDAY: ${member.full_name} is turning ${turningAge} in 30 days! ${program.ariaSpeech} Begin warmly building excitement in calls leading up to the day.`,
      expires_at: new Date(target.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'member_id,context_key' }).catch(() => null)

    milestonesFound++
    console.log(`[milestone-birthdays] ${member.full_name} turning ${turningAge} on ${target.toISOString().slice(0, 10)}`)
  }

  return NextResponse.json({
    ok: true,
    targetDate: target.toISOString().slice(0, 10),
    milestonesFound,
  })
}
