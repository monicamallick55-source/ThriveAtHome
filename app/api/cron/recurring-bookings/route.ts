// Daily cron — turns due recurring_service_schedules rows into real service_bookings
// and advances each schedule to its next occurrence (Batch 3, item 2).
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
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const todayStr = today.toISOString().slice(0, 10)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: due, error } = await (admin.from as any)('recurring_service_schedules')
    .select('id, member_id, service_type, cadence, day_of_week, time_of_day, notes, next_run_date')
    .eq('is_active', true)
    .lte('next_run_date', todayStr)

  if (error) {
    console.error('[cron/recurring-bookings]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results = { due: (due ?? []).length, created: 0, skipped: 0 }

  for (const s of due ?? []) {
    const runDate: string = s.next_run_date
    const requestedFor = s.time_of_day
      ? new Date(`${runDate}T${s.time_of_day}:00Z`).toISOString()
      : new Date(`${runDate}T15:00:00Z`).toISOString()

    // Idempotency guard — don't double-create for the same schedule + date.
    const { data: existing } = await admin
      .from('service_bookings')
      .select('id')
      .eq('member_id', s.member_id)
      .eq('service_type', s.service_type)
      .eq('requested_for', requestedFor)
      .maybeSingle()

    if (!existing) {
      const { error: insErr } = await admin.from('service_bookings').insert({
        member_id: s.member_id,
        service_type: s.service_type,
        status: 'requested',
        requested_for: requestedFor,
        notes: s.notes ?? 'Auto-created from a recurring schedule.',
        booking_details: { recurring_schedule_id: s.id, cadence: s.cadence } as never,
      })
      if (insErr) { console.error('[cron/recurring-bookings] insert failed:', insErr); results.skipped++; continue }
      results.created++
    } else {
      results.skipped++
    }

    // Advance next_run_date by the cadence (7 or 14 days), keeping the weekday.
    const step = s.cadence === 'biweekly' ? 14 : 7
    const next = new Date(`${runDate}T00:00:00Z`)
    do { next.setUTCDate(next.getUTCDate() + step) } while (next <= today)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from as any)('recurring_service_schedules')
      .update({ next_run_date: next.toISOString().slice(0, 10), last_generated_at: new Date().toISOString() })
      .eq('id', s.id)
  }

  return NextResponse.json({ ok: true, ...results })
}
