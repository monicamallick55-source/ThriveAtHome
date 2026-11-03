// app/api/cron/check-ins/route.ts
// Escalation handler: flags members whose daily check-in call was missed or reported concern
// Schedule: daily at 11:00 AM (after Aria calls complete) — { "path": "/api/cron/check-ins", "schedule": "0 18 * * *" }
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

  const today = new Date().toISOString().slice(0, 10)

  // Find active members who had no check-in call completed today
  const { data: activeMembers, error: membersErr } = await db
    .from('members')
    .select('id, first_name, last_name, phone, subscription_status')
    .eq('subscription_status', 'active')
    .not('phone', 'is', null)

  if (membersErr) {
    console.error('[check-ins] Members query error:', membersErr)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  // Get members who had a completed call today
  const { data: calledToday } = await db
    .from('call_logs')
    .select('member_id')
    .eq('call_type', 'aria_checkin')
    .in('status', ['completed', 'ended'])
    .gte('created_at', `${today}T00:00:00Z`)

  const calledIds = new Set((calledToday || []).map((r: any) => r.member_id))

  const missed = (activeMembers || []).filter((m: any) => !calledIds.has(m.id))

  if (missed.length === 0) {
    return NextResponse.json({ flagged: 0, message: 'All members reached today' })
  }

  console.log(`[check-ins] ${missed.length} members missed check-in — creating navigator tasks`)

  let flagged = 0
  for (const member of missed) {
    // Check if already flagged today to avoid duplicates
    const { count } = await db
      .from('navigator_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('member_id', member.id)
      .eq('task_type', 'missed_checkin')
      .gte('created_at', `${today}T00:00:00Z`)

    if ((count ?? 0) > 0) continue

    await supabaseAdmin.from('navigator_tasks').insert({
      member_id: member.id,
      task_type: 'missed_checkin',
      description: `${member.first_name} ${member.last_name} missed their daily Aria check-in call on ${today}. Please call or SMS to confirm they are okay. Phone: ${member.phone}`,
      priority: 'high',
    })

    // Also queue an SMS to the member
    if (member.phone) {
      await supabaseAdmin.from('notification_queue').insert({
        member_id: member.id,
        channel: 'sms',
        phone: member.phone,
        message: `Hi ${member.first_name}! We missed you on your ThriveAtHome check-in today. Just reply OK and we'll know you're well — or call us at 1-800-THRIVE1 and someone will call you right back.`,
      }).catch(() => null)
    }

    flagged++
  }

  return NextResponse.json({ flagged, total_missed: missed.length })
}

export async function GET(req: NextRequest) { return POST(req) }
