// app/api/cron/notification-drain/route.ts
// Drains the notification_queue table — sends pending SMS via Twilio and email via Resend.
// Runs every 5 minutes via vercel.json cron.
// Auth: CRON_SECRET header (same pattern as all other cron routes).

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const BATCH_SIZE = 50          // rows per run
const MAX_RETRIES = 3          // give up after 3 failed attempts

interface QueueRow {
  id: string
  channel: 'sms' | 'email' | 'push'
  phone?: string | null
  email?: string | null
  subject?: string | null
  device_token?: string | null
  message: string
  retry_count: number
  member_id?: string | null
}

export async function GET(req: NextRequest) {
  // Auth check
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const now = new Date().toISOString()

  // Fetch pending rows that are due and haven't exceeded retry limit
  const { data: rows, error: fetchErr } = await db
    .from('notification_queue')
    .select('id, channel, phone, email, subject, device_token, message, retry_count, member_id')
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .lt('retry_count', MAX_RETRIES)
    .order('scheduled_at', { ascending: true })
    .limit(BATCH_SIZE) as { data: QueueRow[] | null; error: { message: string } | null }

  if (fetchErr) {
    console.error('[notification-drain] fetch error:', fetchErr.message)
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({ drained: 0 })
  }

  const results = { sent: 0, failed: 0, skipped: 0 }

  for (const row of rows as QueueRow[]) {
    try {
      let ok = false

      if (row.channel === 'sms') {
        ok = await sendSms(row.phone, row.message)
      } else if (row.channel === 'email') {
        ok = await sendEmail(row.email, row.subject ?? 'ThriveAtHome', row.message)
      } else if (row.channel === 'push') {
        // Push not yet wired — log and skip gracefully
        console.log(`[notification-drain][push] device_token=${row.device_token} msg="${row.message.slice(0, 60)}"`)
        ok = true // treat as sent so it doesn't loop forever
      } else {
        results.skipped++
        continue
      }

      if (ok) {
        await db
          .from('notification_queue')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', row.id)
        results.sent++
      } else {
        throw new Error('Provider returned failure')
      }
    } catch (err) {
      console.error(`[notification-drain] failed id=${row.id}:`, String(err))
      const newRetry = row.retry_count + 1
      const isFinal = newRetry >= MAX_RETRIES
      await db
        .from('notification_queue')
        .update({
          retry_count: newRetry,
          ...(isFinal ? { status: 'failed', failed_at: new Date().toISOString() } : {}),
        })
        .eq('id', row.id)
      results.failed++
    }
  }

  console.log(`[notification-drain] sent=${results.sent} failed=${results.failed} skipped=${results.skipped}`)
  return NextResponse.json({ drained: rows.length, ...results })
}

// ─── SMS via Twilio ────────────────────────────────────────────────────────────
async function sendSms(to: string | null | undefined, body: string): Promise<boolean> {
  const sid  = process.env.TWILIO_ACCOUNT_SID
  const auth = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER

  if (!sid || !auth || !from) {
    // Keys not configured — log and treat as "sent" so queue doesn't fill up in dev
    console.log(`[notification-drain][sms][STUB] to=${to} body="${body.slice(0, 80)}"`)
    return true
  }
  if (!to) return false

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${sid}:${auth}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
    }
  )
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error(`[notification-drain][sms] Twilio error ${res.status}: ${text.slice(0, 200)}`)
    return false
  }
  return true
}

// ─── Email via Resend ─────────────────────────────────────────────────────────
async function sendEmail(to: string | null | undefined, subject: string, text: string): Promise<boolean> {
  const key  = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL ?? 'ThriveAtHome <noreply@thriveathome.com>'

  if (!key) {
    console.log(`[notification-drain][email][STUB] to=${to} subject="${subject}" body="${text.slice(0, 80)}"`)
    return true
  }
  if (!to) return false

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, text }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    console.error(`[notification-drain][email] Resend error ${res.status}:`, data)
    return false
  }
  return true
}
