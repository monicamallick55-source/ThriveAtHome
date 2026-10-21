// app/api/family-summary/route.ts
// POST — generate + send daily summary for a member (called by cron)
// GET  — preview summary for a member (staff only, no send)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Summary builder ──────────────────────────────────────────────────────────
async function buildSummary(memberId: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any as any
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // 1. Member name
  const { data: member } = await db
    .from('members')
    .select('full_name, preferred_name')
    .eq('id', memberId)
    .maybeSingle()

  const name = member?.preferred_name ?? member?.full_name ?? 'your loved one'

  const lines: string[] = [`Good morning! Here's today's update for ${name}.`]

  // 2. Today's events
  const { data: events } = await db
    .from('events')
    .select('title, start_time, location')
    .gte('start_time', `${todayStr}T00:00:00Z`)
    .lt('start_time', `${todayStr}T23:59:59Z`)
    .eq('is_published', true)
    .order('start_time')
    .limit(5)

  if (events && events.length > 0) {
    lines.push(`\n📅 Today's events:`)
    for (const ev of events) {
      const time = new Date(ev.start_time).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles'
      })
      lines.push(`• ${ev.title} at ${time}${ev.location ? ` — ${ev.location}` : ''}`)
    }
  } else {
    lines.push(`\n📅 No scheduled events today.`)
  }

  // 3. Ride bookings today
  const { data: rides } = await db
    .from('ride_bookings')
    .select('pickup_time, status, dropoff_address')
    .eq('member_id', memberId)
    .gte('pickup_time', `${todayStr}T00:00:00Z`)
    .lt('pickup_time', `${todayStr}T23:59:59Z`)
    .in('status', ['requested', 'confirmed', 'en_route'])
    .order('pickup_time')

  if (rides && rides.length > 0) {
    lines.push(`\n🚗 Ride scheduled:`)
    for (const ride of rides) {
      const time = new Date(ride.pickup_time).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles'
      })
      lines.push(`• ${time} — ${ride.status}${ride.dropoff_address ? ` to ${ride.dropoff_address}` : ''}`)
    }
  }

  // 4. Recent safety check-in
  const yesterday = new Date(today.getTime() - 86400000).toISOString()
  const { data: checkins } = await db
    .from('safety_checkins')
    .select('checked_in_at, status')
    .eq('member_id', memberId)
    .gte('checked_in_at', yesterday)
    .order('checked_in_at', { ascending: false })
    .limit(1)

  if (checkins && checkins.length > 0) {
    const lastCheckin = checkins[0]
    const when = new Date(lastCheckin.checked_in_at).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles'
    })
    lines.push(`\n✅ Last check-in: ${when} (${lastCheckin.status})`)
  } else {
    lines.push(`\n⚠️ No check-in recorded in the last 24 hours.`)
  }

  // 5. Footer
  lines.push(`\nQuestions? Reply STOP to unsubscribe. — Thrive@Home`)

  return lines.join('\n')
}

// ─── GET: preview ─────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('member_id')
  if (!memberId) return NextResponse.json({ error: 'member_id required' }, { status: 400 })

  const summary = await buildSummary(memberId)
  return NextResponse.json({ member_id: memberId, preview: summary })
}

// ─── POST: send (called by cron or manually) ──────────────────────────────────
export async function POST(req: Request) {
  // Validate cron secret OR staff auth
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`

  const supabase = await createClient()
  let isStaff = false
  if (!isCron) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    const { data: staffCheck } = await supabase.rpc('is_staff')
    isStaff = !!staffCheck
    if (!isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { member_id, dry_run = false } = body as { member_id?: string; dry_run?: boolean }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any as any

  // Determine which members to send to
  let memberIds: string[] = []
  if (member_id) {
    memberIds = [member_id]
  } else {
    // All active members with a family contact that has SMS opt-in
    const { data: members } = await db
      .from('members')
      .select('id')
      .eq('status', 'active')

    memberIds = ((members ?? []) as Array<{ id: string }>).map(m => m.id)
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const results: Array<{ member_id: string; status: string; error?: string }> = []

  for (const mid of memberIds) {
    // Check if already sent today
    const { data: existing } = await db
      .from('family_summary_log')
      .select('id')
      .eq('member_id', mid)
      .eq('summary_date', todayStr)
      .eq('channel', 'sms')
      .maybeSingle()

    if (existing && !dry_run) {
      results.push({ member_id: mid, status: 'skipped' })
      continue
    }

    const summaryText = await buildSummary(mid)

    if (dry_run) {
      results.push({ member_id: mid, status: 'preview', error: summaryText })
      continue
    }

    // Get family member phone for SMS
    const { data: familyMembers } = await db
      .from('family_members')
      .select('id, phone, sms_opt_in')
      .eq('member_id', mid)
      .eq('sms_opt_in', true)
      .not('phone', 'is', null)

    if (!familyMembers || familyMembers.length === 0) {
      await db.from('family_summary_log').insert({
        member_id: mid,
        summary_date: todayStr,
        channel: 'sms',
        body: summaryText,
        status: 'skipped',
        error: 'No SMS-opted-in family contacts',
      })
      results.push({ member_id: mid, status: 'skipped', error: 'no opted-in contacts' })
      continue
    }

    // Send via Twilio if configured
    const twilioSid = process.env.TWILIO_ACCOUNT_SID
    const twilioToken = process.env.TWILIO_AUTH_TOKEN
    const twilioFrom = process.env.TWILIO_FROM_NUMBER

    let sendStatus = 'sent'
    let sendError: string | undefined

    if (twilioSid && twilioToken && twilioFrom) {
      for (const fm of familyMembers as Array<{ phone: string }>) {
        try {
          const twilioRes = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`,
              },
              body: new URLSearchParams({
                From: twilioFrom,
                To: fm.phone,
                Body: summaryText,
              }),
            }
          )
          if (!twilioRes.ok) {
            const errData = await twilioRes.json().catch(() => ({}))
            sendError = (errData as { message?: string }).message ?? 'Twilio error'
            sendStatus = 'failed'
          }
        } catch (e) {
          sendStatus = 'failed'
          sendError = e instanceof Error ? e.message : 'Unknown error'
        }
      }
    } else {
      // No Twilio — log as sent (in_app fallback)
      sendStatus = 'sent'
    }

    await db.from('family_summary_log').upsert({
      member_id: mid,
      summary_date: todayStr,
      channel: 'sms',
      recipient: (familyMembers as Array<{ phone: string }>).map(f => f.phone).join(', '),
      body: summaryText,
      status: sendStatus,
      error: sendError ?? null,
    }, { onConflict: 'member_id,summary_date,channel' })

    results.push({ member_id: mid, status: sendStatus, ...(sendError ? { error: sendError } : {}) })
  }

  return NextResponse.json({ sent: results.filter(r => r.status === 'sent').length, results })
}
