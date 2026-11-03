// app/api/cron/birthday-arc/route.ts
// Birthday arc: 3-day celebration sequence (SMS day-before + call on birthday + family portal notification)
// Schedule: daily at 7:00 AM — { "path": "/api/cron/birthday-arc", "schedule": "0 14 * * *" }
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const RETELL_API_KEY     = process.env.RETELL_API_KEY
const BIRTHDAY_AGENT_ID  = process.env.RETELL_BIRTHDAY_AGENT_ID || process.env.RETELL_ARIA_AGENT_ID

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret') || req.headers.get('authorization')?.replace('Bearer ', '')
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = supabaseAdmin as any
  const now = new Date()
  const todayMMDD = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const tomorrowMMDD = `${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`

  // Fetch active members
  const { data: members, error } = await db
    .from('members')
    .select('id, first_name, last_name, phone, date_of_birth, subscription_status')
    .eq('subscription_status', 'active')
    .not('date_of_birth', 'is', null)

  if (error) {
    console.error('[birthday-arc] DB error:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  const birthdayToday   : any[] = []
  const birthdayTomorrow: any[] = []

  for (const member of (members || [])) {
    if (!member.date_of_birth) continue
    const dob = member.date_of_birth as string
    const dobMMDD = dob.slice(5, 10)  // "MM-DD" from "YYYY-MM-DD"
    if (dobMMDD === todayMMDD) birthdayToday.push(member)
    if (dobMMDD === tomorrowMMDD) birthdayTomorrow.push(member)
  }

  let smsQueued = 0, callsInitiated = 0

  // Day-before SMS
  for (const member of birthdayTomorrow) {
    if (!member.phone) continue
    await db.from('notification_queue').insert({
      member_id: member.id,
      channel: 'sms',
      phone: member.phone,
      message: `🎂 Hi ${member.first_name}! Tomorrow is your birthday and the whole ThriveAtHome community can't wait to celebrate you. Have a wonderful day — we'll be calling in the morning!`,
    }).catch(() => null)
    smsQueued++
  }

  // Birthday call via Retell
  for (const member of birthdayToday) {
    if (!member.phone || !RETELL_API_KEY || !BIRTHDAY_AGENT_ID) continue

    try {
      const age = member.date_of_birth
        ? now.getFullYear() - parseInt(member.date_of_birth.slice(0, 4))
        : null

      const res = await fetch('https://api.retellai.com/v2/create-phone-call', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RETELL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: BIRTHDAY_AGENT_ID,
          from_number: process.env.RETELL_PHONE_NUMBER,
          to_number: member.phone,
          retell_llm_dynamic_variables: {
            member_name: member.first_name,
            member_id: member.id,
            call_type: 'birthday',
            age: age ? String(age) : '',
          },
        }),
      })

      if (res.ok) {
        const callData = await res.json()
        await db.from('call_logs').insert({
          member_id: member.id,
          call_type: 'birthday',
          retell_call_id: callData.call_id,
          status: 'initiated',
        }).catch(() => null)
        callsInitiated++
      } else {
        console.warn(`[birthday-arc] Call failed for ${member.id}:`, await res.text())
      }
    } catch (err) {
      console.error(`[birthday-arc] Error initiating call for ${member.id}:`, err)
    }

    // Also notify family portal via navigator task
    await db.from('navigator_tasks').insert({
      member_id: member.id,
      task_type: 'birthday_notification',
      description: `Today is ${member.first_name}'s birthday! Consider sending a family portal note or arranging a surprise if family is enrolled.`,
      priority: 'low',
    }).catch(() => null)
  }

  return NextResponse.json({
    birthday_today: birthdayToday.length,
    birthday_tomorrow: birthdayTomorrow.length,
    calls_initiated: callsInitiated,
    sms_queued: smsQueued,
  })
}

export async function GET(req: NextRequest) { return POST(req) }
