// Retell tool call — member asks Aria to call them back during an inbound call.
// Saves a callback_request row; cron picks it up and triggers the outbound call.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      member_id,
      preferred_time, // ISO string or natural language like "3pm today" — store as text note if not parseable
      notes,
    } = body.args ?? body

    if (!member_id) {
      return NextResponse.json({ error: 'member_id is required' }, { status: 400 })
    }

    const { data: member, error: memberErr } = await admin
      .from('members')
      .select('id, preferred_name')
      .eq('id', member_id)
      .single()

    if (memberErr || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Parse preferred_time — if it looks like an ISO date use it, otherwise store as note
    let parsedTime: string | null = null
    let timeNote = notes ?? ''
    if (preferred_time) {
      const d = new Date(preferred_time)
      if (!isNaN(d.getTime()) && d > new Date()) {
        parsedTime = d.toISOString()
      } else {
        timeNote = preferred_time + (notes ? ` — ${notes}` : '')
      }
    }

    const { error: insertErr } = await (admin.from as any)('callback_requests').insert({
      member_id,
      requested_via: 'inbound_call',
      preferred_time: parsedTime,
      notes: timeNote || null,
      status: 'pending',
    })

    if (insertErr) {
      console.error('[Retell Tool] request-callback insert error:', insertErr)
      return NextResponse.json({ error: 'Failed to save callback request' }, { status: 500 })
    }

    const timePhrase = parsedTime
      ? `at ${new Date(parsedTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
      : preferred_time
        ? `around ${preferred_time}`
        : 'as soon as possible'

    return NextResponse.json({
      success: true,
      result: `Perfect, I'll call you back ${timePhrase}, ${member.preferred_name}. You'll see my number come up on your phone. Is there anything else before we hang up?`,
    })
  } catch (error) {
    console.error('[Retell Tool] request-callback error:', error)
    return NextResponse.json({ error: 'Request callback tool failed' }, { status: 500 })
  }
}
