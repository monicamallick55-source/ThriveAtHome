import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function authOk(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const h = req.headers.get('x-cron-secret')
    ?? req.headers.get('authorization')?.replace('Bearer ', '')
  return h === secret
}

export async function GET(req: NextRequest) { return POST(req) }

export async function POST(req: NextRequest) {
  if (!authOk(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')

  // Find members with birthday today (stored as MM-DD or YYYY-MM-DD)
  const { data: members, error } = await supabase
    .from('members')
    .select('id, full_name, phone_number, aria_call_opted_in, date_of_birth')
    .eq('status', 'active')
    .not('date_of_birth', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const birthdayMembers = (members ?? []).filter(m => {
    const dob = m.date_of_birth as string
    if (!dob) return false
    // Support both YYYY-MM-DD and MM-DD
    const parts = dob.split('-')
    const mPart = parts.length === 3 ? parts[1] : parts[0]
    const dPart = parts.length === 3 ? parts[2] : parts[1]
    return mPart === mm && dPart?.substring(0, 2) === dd
  })

  let called = 0
  let posts = 0

  for (const member of birthdayMembers) {
    // 1. Create community birthday post
    await supabase.from('community_posts').insert({
      member_id: member.id,
      post_type: 'birthday',
      content: `Wishing ${member.full_name} a wonderful birthday today! 🎂`,
      is_auto: true,
    })
    posts++

    // 2. Joy call on birthday (opted-in members only, skip if in active grief)
    if (member.aria_call_opted_in) {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      let griefCount = 0
      try {
        const { count: gc } = await supabase
          .from('grief_support_requests')
          .select('id', { count: 'exact', head: true })
          .eq('member_id', member.id)
          .eq('status', 'active')
          .gte('created_at', ninetyDaysAgo)
        griefCount = gc ?? 0
      } catch (_e) {
        griefCount = 0 // table may not exist yet
      }

      if (griefCount > 0) {
        console.log(`[Cron/celebrations] skipping Joy call for ${member.id} — active grief support`)
      } else {
        const joyAgentId = process.env.RETELL_JOY_AGENT_ID
        if (joyAgentId && member.phone_number) {
          const r = await fetch('https://api.retellai.com/v2/create-phone-call', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from_number: process.env.TWILIO_PHONE_NUMBER,
              to_number: member.phone_number,
              agent_id: joyAgentId,
              metadata: {
                member_id: member.id,
                call_type: 'celebration',
                celebration_type: 'birthday',
              },
            }),
          }).catch(err => { console.error('[Joy] call failed:', err); return null })
          if (r?.ok) called++
        } else {
          console.log(`[Cron/celebrations] RETELL_JOY_AGENT_ID not set — stub for ${member.id}`)
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    birthday_members: birthdayMembers.length,
    community_posts: posts,
    joy_calls: called,
    ran_at: new Date().toISOString(),
  })
}
