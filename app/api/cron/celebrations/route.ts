// app/api/cron/celebrations/route.ts
// G7.2 — Celebrations cron: inject Aria context 7 days out and day-of
// Schedule: daily at 9am UTC
// Cron expression: 0 9 * * *

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  let totalNotified = 0
  let totalAria = 0

  // ── 1. 7-day advance: set aria_notified_7d ────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sevenDayEvents } = await (admin as any)
    .from('family_events')
    .select('id, member_id, title, event_type, event_date, notes')
    .eq('event_date', sevenDays)
    .eq('aria_notified_7d', false)
    .is('cancelled_at', null)
    .limit(100)

  for (const ev of (sevenDayEvents ?? [])) {
    // Insert aria_call_context so next call mentions the upcoming event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('aria_call_contexts').upsert({
      member_id: ev.member_id,
      context_type: 'upcoming_event',
      context_key: `family_event_${ev.id}`,
      content: `In 7 days: ${ev.title} (${ev.event_type}) on ${ev.event_date}. ${ev.notes ?? ''}`.trim(),
      expires_at: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'member_id,context_key' }).catch(() => null)  // table may not exist yet — graceful

    // Mark notified
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('family_events')
      .update({ aria_notified_7d: true })
      .eq('id', ev.id)

    // Navigator task
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('navigator_tasks').insert({
      member_id: ev.member_id,
      task_type: 'upcoming_celebration',
      priority: 'low',
      description: `${ev.title} in 7 days — consider a warm message or gift suggestion.`,
      metadata: { event_id: ev.id, event_type: ev.event_type, event_date: ev.event_date },
    }).catch(() => null)

    totalAria++
  }

  // ── 2. Day-of: set aria_notified_1d + family_notified ─────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: todayEvents } = await (admin as any)
    .from('family_events')
    .select(`
      id, member_id, title, event_type, event_date, notes, recurring,
      members!inner(full_name)
    `)
    .eq('event_date', today)
    .eq('aria_notified_1d', false)
    .is('cancelled_at', null)
    .limit(100)

  for (const ev of (todayEvents ?? [])) {
    // Inject day-of Aria context (higher priority)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('aria_call_contexts').upsert({
      member_id: ev.member_id,
      context_type: 'event_today',
      context_key: `family_event_today_${ev.id}`,
      content: `TODAY is ${ev.title}! This is a ${ev.event_type}. ${ev.notes ?? ''} Make sure to warmly celebrate this special day.`.trim(),
      expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'member_id,context_key' }).catch(() => null)

    // Mark all notified
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('family_events')
      .update({ aria_notified_1d: true, family_notified: true })
      .eq('id', ev.id)

    // If recurring, create next year's instance
    if (ev.recurring) {
      const nextDate = new Date(ev.event_date + 'T12:00:00Z')
      nextDate.setFullYear(nextDate.getFullYear() + 1)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from('family_events').insert({
        member_id: ev.member_id,
        created_by: null,    // system-generated recurrence
        event_type: ev.event_type,
        title: ev.title,
        event_date: nextDate.toISOString().slice(0, 10),
        recurring: true,
        notes: ev.notes,
      }).catch(() => null)
    }

    totalNotified++
    totalAria++
  }

  console.log(`[celebrations-cron] 7d: ${sevenDayEvents?.length ?? 0} events, day-of: ${todayEvents?.length ?? 0} events`)

  return NextResponse.json({
    ok: true,
    sevenDay: sevenDayEvents?.length ?? 0,
    dayOf: todayEvents?.length ?? 0,
    totalAria,
    totalNotified,
    date: today,
  })
}
