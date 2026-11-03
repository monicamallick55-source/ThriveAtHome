// app/api/cron/send-sms/route.ts
// Processes pending rows in notification_queue (channel = 'sms') and sends via Twilio.
// Runs on cron schedule — set in vercel.json: { "path": "/api/cron/send-sms", "schedule": "*/5 * * * *" }
// or trigger manually.  Protected by CRON_SECRET header.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN
const TWILIO_FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER   // e.g. +18005551234

const BATCH_SIZE = 25  // max messages per cron run to stay within Twilio rate limits

interface QueueRow {
  id: string
  member_id: string
  phone: string
  message: string
  channel: string
  status?: string
}

async function sendViaTwilio(to: string, body: string): Promise<{ sid?: string; error?: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    return { error: 'Twilio credentials not configured' }
  }

  // Normalise phone number — must be E.164
  let phone = to.trim().replace(/[\s\-().]/g, '')
  if (!phone.startsWith('+')) phone = `+1${phone}`

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
  const params = new URLSearchParams({
    To: phone,
    From: TWILIO_FROM_NUMBER,
    Body: body,
  })

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const data = await res.json() as { sid?: string; message?: string; code?: number }

    if (!res.ok) {
      return { error: `Twilio ${res.status}: ${data.message ?? 'Unknown error'} (code ${data.code})` }
    }

    return { sid: data.sid }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

export async function POST(req: NextRequest) {
  // Auth check
  const cronSecret = req.headers.get('x-cron-secret') || req.headers.get('authorization')?.replace('Bearer ', '')
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    return NextResponse.json({ error: 'Twilio not configured', details: 'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in Vercel env vars' }, { status: 503 })
  }


  // Fetch pending SMS queue items
  const { data: rows, error: fetchError } = await db
    .from('notification_queue')
    .select('id, member_id, phone, message, channel, status')
    .eq('channel', 'sms')
    .in('status', ['pending', null])
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (fetchError) {
    console.error('[send-sms] Failed to fetch queue:', fetchError)
    return NextResponse.json({ error: 'DB error', detail: fetchError.message }, { status: 500 })
  }

  const queue: QueueRow[] = rows || []
  if (queue.length === 0) {
    return NextResponse.json({ sent: 0, message: 'Queue empty' })
  }

  console.log(`[send-sms] Processing ${queue.length} SMS messages`)

  const results = await Promise.allSettled(
    queue.map(async (row) => {
      // Mark as processing to prevent duplicate sends
      await db
        .from('notification_queue')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', row.id)

      const { sid, error: sendError } = await sendViaTwilio(row.phone, row.message)

      if (sendError) {
        console.error(`[send-sms] Failed row ${row.id}:`, sendError)
        await db
          .from('notification_queue')
          .update({
            status: 'failed',
            error: sendError,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id)
        return { id: row.id, success: false, error: sendError }
      }

      await db
        .from('notification_queue')
        .update({
          status: 'sent',
          external_id: sid,
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)

      console.log(`[send-sms] Sent to ${row.phone}, sid=${sid}`)
      return { id: row.id, success: true, sid }
    })
  )

  const sent    = results.filter(r => r.status === 'fulfilled' && ((r.value as { success: boolean; skipped?: boolean }) .success)).length
  const failed  = results.filter(r => r.status === 'fulfilled' && !((r.value as { success: boolean; skipped?: boolean }) .success)).length
  const crashed = results.filter(r => r.status === 'rejected').length

  return NextResponse.json({
    processed: queue.length,
    sent,
    failed,
    crashed,
  })
}

// Also allow GET for manual trigger via Vercel cron (which uses GET by default)
export async function GET(req: NextRequest) {
  return POST(req)
}
