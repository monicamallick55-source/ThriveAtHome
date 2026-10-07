import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ITEM_TYPE_DEFAULTS } from '@/lib/data/tracked-items-types'
import { runGraceCalls } from '@/lib/voice/outboundTriggers'

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

  const results = { reminded: 0, skipped: 0, errors: 0 }

  // Fetch all active tracked items
  const { data: items, error: fetchErr } = await admin
    .from('tracked_items')
    .select('*')
    .eq('status', 'active')
    .order('expiration_or_appointment_date', { ascending: true })

  if (fetchErr) {
    console.error('[tracked-item-reminders] DB error:', fetchErr)
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  for (const item of (items ?? [])) {
    try {
      const expiryDate = new Date(item.expiration_or_appointment_date)
      expiryDate.setUTCHours(0, 0, 0, 0)
      const reminderDate = new Date(expiryDate)
      reminderDate.setDate(reminderDate.getDate() - item.reminder_lead_days)

      // Only remind if today >= reminderDate
      if (today < reminderDate) { results.skipped++; continue }

      // Don't re-remind if already reminded today
      if (item.last_reminded_at) {
        const lr = new Date(item.last_reminded_at)
        if (lr.toISOString().slice(0, 10) === todayStr) { results.skipped++; continue }
      }

      // Don't remind if snoozed
      if (item.snoozed_until && new Date(item.snoozed_until) > today) { results.skipped++; continue }

      const daysUntil = Math.round((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      const defaults = ITEM_TYPE_DEFAULTS[item.item_type as keyof typeof ITEM_TYPE_DEFAULTS]
      const emoji = defaults?.emoji ?? '📅'
      const typeLabel = defaults?.label ?? item.item_type

      const isAppointment = item.category === 'appointment'
      const urgencyPrefix = daysUntil <= 0 ? 'Today: ' : daysUntil === 1 ? 'Tomorrow: ' : ''
      const countdownText = daysUntil <= 0
        ? 'today'
        : daysUntil === 1 ? 'tomorrow'
        : `in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`

      const notifTitle = isAppointment
        ? `${urgencyPrefix}${emoji} ${item.item_name} is ${countdownText}`
        : `${urgencyPrefix}${emoji} ${item.item_name} renews ${countdownText}`
      const notifBody = isAppointment
        ? `Reminder: your appointment "${item.item_name}" is on ${item.expiration_or_appointment_date}.`
        : `Your ${typeLabel.toLowerCase()} "${item.item_name}" expires on ${item.expiration_or_appointment_date}.`

      // Push realtime notification to family
      const { data: fms } = await admin
        .from('family_members')
        .select('id')
        .eq('member_id', item.member_id)

      for (const fm of (fms ?? [])) {
        try {
          await (admin as any).from('realtime_notifications').insert({
            member_id: item.member_id,
            type: 'important_date_reminder',
            severity: daysUntil <= 3 ? 'concern' : 'info',
            title: notifTitle,
            body: notifBody,
          })
        } catch (e) {
          console.error(`[tracked-item-reminders] notif insert failed fm ${fm.id}:`, e)
        }
      }

      // Update last_reminded_at
      try {
        await admin
          .from('tracked_items')
          .update({ last_reminded_at: new Date().toISOString() })
          .eq('id', item.id)
      } catch (e) {
        console.error(`[tracked-item-reminders] update last_reminded_at failed:`, e)
      }

      // Stub: flag item for Aria's next call so she can mention it naturally
      const ariaPhrase = isAppointment
        ? `I wanted to remind you about your appointment — ${item.item_name} — on ${item.expiration_or_appointment_date}.`
        : `I wanted to remind you that your ${ITEM_TYPE_DEFAULTS[item.item_type as keyof typeof ITEM_TYPE_DEFAULTS]?.label?.toLowerCase() ?? item.item_type} is coming up for renewal on ${item.expiration_or_appointment_date}.`
      console.log(`[STUB][Aria] Would inject into next call for member ${item.member_id}: "${ariaPhrase}"`)
      console.log(`[tracked-item-reminders] Reminded for item ${item.id} (${item.item_name}), ${daysUntil} days out`)
      results.reminded++
    } catch (e) {
      console.error(`[tracked-item-reminders] Error for item ${item.id}:`, e)
      results.errors++
    }
  }

  // Grace reminder calls for items due tomorrow with call_reminder = true
  let grace: Awaited<ReturnType<typeof runGraceCalls>> | null = null
  try {
    grace = await runGraceCalls()
  } catch (e) {
    console.error('[tracked-item-reminders] Grace calls failed:', e)
  }

  console.log('[tracked-item-reminders] Done:', results)
  return NextResponse.json({ success: true, today: todayStr, ...results, grace })
}
