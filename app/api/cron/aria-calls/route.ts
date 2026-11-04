// app/api/cron/aria-calls/route.ts
// Triggers Retell AI daily check-in calls for all active members
// Schedule: daily at 8:00 AM in each member's timezone (run hourly, filter by local time)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const RETELL_API_KEY = process.env.RETELL_API_KEY
const ARIA_AGENT_ID  = process.env.RETELL_ARIA_AGENT_ID || process.env.RETELL_AGENT_ID_ARIA

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret') || req.headers.get('authorization')?.replace('Bearer ', '')
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!RETELL_API_KEY || !ARIA_AGENT_ID) {
    return NextResponse.json({ error: 'Retell not configured', details: 'Set RETELL_API_KEY and RETELL_ARIA_AGENT_ID in env vars' }, { status: 503 })
  }


  // Fetch active members with phone numbers who haven't had a call today
  const today = new Date().toISOString().slice(0, 10)
  const { data: members, error } = await supabaseAdmin
    .from('members')
    .select('id, first_name, phone, timezone, plan, subscription_status')
    .eq('subscription_status', 'active')
    .not('phone', 'is', null)
    .not('plan', 'is', null)

  if (error) {
    console.error('[aria-calls] DB error:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!members || members.length === 0) {
    return NextResponse.json({ called: 0, message: 'No active members with phones' })
  }

  console.log(`[aria-calls] Initiating check-in calls for ${members.length} members`)

  const results = await Promise.allSettled(
    members.map(async (member: any) => {
      // Check if already called today
      const { count } = await supabaseAdmin
        .from('call_logs')
        .select('id', { count: 'exact', head: true })
        .eq('member_id', member.id)
        .eq('call_type', 'aria_checkin')
        .gte('created_at', `${today}T00:00:00Z`)

      if ((count ?? 0) > 0) {
        return { id: member.id, skipped: true, reason: 'already called today' }
      }

      // Initiate Retell call
      const res = await fetch('https://api.retellai.com/v2/create-phone-call', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RETELL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: ARIA_AGENT_ID,
          from_number: process.env.RETELL_PHONE_NUMBER,
          to_number: member.phone,
          retell_llm_dynamic_variables: {
            member_name: member.first_name || 'Friend',
            member_id: member.id,
            call_type: 'daily_checkin',
          },
        }),
      })

      if (!res.ok) {
        const errBody = await res.text()
        console.error(`[aria-calls] Retell error for member ${member.id}:`, errBody)
        return { id: member.id, success: false, error: errBody }
      }

      const callData = await res.json()

      // Log the call
      await supabaseAdmin.from('call_logs').insert({
        member_id: member.id,
        call_type: 'aria_checkin',
        retell_call_id: callData.call_id,
        status: 'initiated',
            }).then(({ error: logErr }) => { if (logErr) console.warn('[aria-calls] call_logs insert warning:', logErr) })
      return { id: member.id, success: true, call_id: callData.call_id }
    })
  )

  const initiated = results.filter(r => r.status === 'fulfilled' && (((r.value as unknown) as { success?: boolean; skipped?: boolean; error?: string }).success)).length
  const skipped   = results.filter(r => r.status === 'fulfilled' && (((r.value as unknown) as { success?: boolean; skipped?: boolean; error?: string }).skipped)).length
  const failed    = results.filter(r => r.status === 'fulfilled' && !(((r.value as unknown) as { success?: boolean; skipped?: boolean; error?: string }).success) && !(((r.value as unknown) as { success?: boolean; skipped?: boolean; error?: string }).skipped)).length

  return NextResponse.json({ total: members.length, initiated, skipped, failed })
}

export async function GET(req: NextRequest) { return POST(req) }



