// app/api/cron/transition-steps/route.ts
// Daily cron: open navigator tasks for transition steps that are now due
// Vercel cron: "0 11 * * *" (11am UTC)

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any
  const now = new Date().toISOString()

  // Find steps that are due and not yet completed/skipped
  const { data: dueSteps } = await db
    .from('life_transition_steps')
    .select('id, navigator_task_id, transition_id, step_key')
    .lte('scheduled_for', now)
    .is('completed_at', null)
    .is('skipped_at', null)

  const opened: string[] = []

  for (const step of (dueSteps ?? [])) {
    if (step.navigator_task_id) {
      // Flip scheduled → open
      await db
        .from('navigator_tasks')
        .update({ status: 'open' })
        .eq('id', step.navigator_task_id)
        .eq('status', 'scheduled')

      opened.push(`${step.transition_id}:${step.step_key}`)
    }
  }

  return NextResponse.json({ opened, count: opened.length, ran_at: now })
}
