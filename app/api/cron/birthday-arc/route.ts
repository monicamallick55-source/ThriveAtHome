// app/api/cron/birthday-arc/route.ts
// G7.5 — Birthday arc: multi-step build-up for member birthdays
// Arc: D-5 (preview), D-3 (mention), D-1 (family reminder), D+1 (follow-up)
// Schedule: daily at 8am UTC
// Cron expression: 0 8 * * *

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const maxDuration = 60

interface ArcStep {
  offset: number   // days relative to birthday (negative = before)
  contextType: string
  contentTemplate: (memberName: string, daysUntil: number) => string
  navigatorNote: string | null
}

const ARC_STEPS: ArcStep[] = [
  {
    offset: -5,
    contextType: 'birthday_arc_preview',
    contentTemplate: (name, d) => `${name}'s birthday is coming up in ${d} days! Start weaving in warm, celebratory energy — ask if they have any plans, mention how much everyone who knows them cherishes them.`,
    navigatorNote: null,
  },
  {
    offset: -3,
    contextType: 'birthday_arc_building',
    contentTemplate: (name, d) => `${name}'s birthday is just ${d} days away! This is a great moment to ask what they'd love to do or hear on their special day. Let them feel how valued they are.`,
    navigatorNote: null,
  },
  {
    offset: -1,
    contextType: 'birthday_arc_eve',
    contentTemplate: (name) => `Tomorrow is ${name}'s birthday! Remind them how excited their family and care team are. This is a perfect call to express how much they mean to everyone. If they have any wishes, this is a great time to listen.`,
    navigatorNote: `Birthday tomorrow — consider a personal message or call`,
  },
  {
    offset: 1,
    contextType: 'birthday_arc_followup',
    contentTemplate: (name) => `${name}'s birthday was yesterday! Ask how they celebrated, what their favourite moment was, and if there's anything they're still wishing for. Let them relive the joy.`,
    navigatorNote: null,
  },
]

export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const today = new Date()
  today.setUTCHours(12, 0, 0, 0)

  let totalContextsSet = 0
  let totalSkipped = 0

  for (const step of ARC_STEPS) {
    const targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() - step.offset)  // offset negative = birthday in future

    const mmdd = targetDate.toISOString().slice(5, 10)  // "MM-DD"

    // Find members whose birthday falls on this date AND haven't opted out
    // Members table stores dob as date; we match month+day regardless of year
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: members } = await (admin as any)
      .from('members')
      .select('id, full_name, celebration_opt_out')
      .not('dob', 'is', null)
      .ilike('dob', `%-${mmdd}`)  // matches any year with this month-day
      .limit(100)

    for (const member of (members ?? [])) {
      // Skip if opted out of celebrations
      if (member.celebration_opt_out) { totalSkipped++; continue }

      // Skip if member has an active grief support request
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: grief } = await (admin as any)
        .from('grief_support_requests')
        .select('id')
        .eq('member_id', member.id)
        .eq('status', 'active')
        .limit(1)

      if ((grief?.length ?? 0) > 0) { totalSkipped++; continue }

      const daysFromToday = Math.abs(step.offset)
      const content = step.contentTemplate(member.full_name, daysFromToday)
      const contextKey = `birthday_arc_${member.id}_${step.contextType}_${today.getFullYear()}`

      // Inject Aria context
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from('aria_call_contexts').upsert({
        member_id: member.id,
        context_type: step.contextType,
        context_key: contextKey,
        content,
        expires_at: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'member_id,context_key' }).catch(() => null)

      // Create navigator task for D-1 only
      if (step.navigatorNote) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any).from('navigator_tasks').insert({
          member_id: member.id,
          task_type: 'birthday_reminder',
          priority: 'low',
          description: `${member.full_name} — ${step.navigatorNote}`,
          metadata: { arc_step: step.offset, birthday_mmdd: mmdd },
        }).catch(() => null)
      }

      totalContextsSet++
    }
  }

  return NextResponse.json({
    ok: true,
    totalContextsSet,
    totalSkipped,
    date: today.toISOString().slice(0, 10),
  })
}
