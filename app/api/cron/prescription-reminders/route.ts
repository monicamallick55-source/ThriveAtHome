// app/api/cron/prescription-reminders/route.ts
// Sends SMS/call reminders for medication refills
// Schedule: daily at 9:00 AM — { "path": "/api/cron/prescription-reminders", "schedule": "0 14 * * *" } (UTC=9AM PT)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret') || req.headers.get('authorization')?.replace('Bearer ', '')
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }


  // Find members with prescriptions due for refill in next 3 days
  const now = new Date()
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const { data: prescriptions, error } = await db
    .from('member_prescriptions')
    .select(`
      id, member_id, medication_name, refill_due_date, days_supply,
      members!inner(id, first_name, phone, subscription_status)
    `)
    .lte('refill_due_date', in3Days.toISOString().slice(0, 10))
    .gte('refill_due_date', now.toISOString().slice(0, 10))
    .eq('members.subscription_status', 'active')
    .eq('reminder_sent_today', false)

  if (error) {
    // Table may not exist yet — log and skip gracefully
    if (error.code === '42P01') {
      console.warn('[prescription-reminders] member_prescriptions table does not exist yet — skipping')
      return NextResponse.json({ sent: 0, message: 'Table not yet created' })
    }
    console.error('[prescription-reminders] DB error:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!prescriptions || prescriptions.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No refills due' })
  }

  let sent = 0
  for (const rx of prescriptions) {
    const member = rx.members
    if (!member?.phone) continue

    const dueDate = new Date(rx.refill_due_date)
    const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    const urgency = daysLeft <= 1 ? 'TODAY' : `in ${daysLeft} days`

    const message = `Hi ${member.first_name}! Your ThriveAtHome prescription reminder: ${rx.medication_name} is due for refill ${urgency} (${rx.refill_due_date}). Call your pharmacy or reply HELP and your Care Navigator will assist.`

    // Queue SMS
    await supabaseAdmin.from('notification_queue').insert({
      member_id: member.id,
      channel: 'sms',
      phone: member.phone,
      message,
    }).catch((err: any) => console.warn('[prescription-reminders] queue insert warning:', err))

    // Mark reminder sent
    await db
      .from('member_prescriptions')
      .update({ reminder_sent_today: true })
      .eq('id', rx.id)

    sent++
  }

  return NextResponse.json({ queued: sent, total_found: prescriptions.length })
}

export async function GET(req: NextRequest) { return POST(req) }
