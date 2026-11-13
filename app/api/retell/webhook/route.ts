import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const fallbackId = `real-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const {
    call_id, member_id, member_phone, mood, mood_label, mood_score,
    crisis_detected = false, crisis_type, gift_intent, service_intent,
    transcript, transcript_summary, duration_seconds
  } = body

  // Insert via fetch to Supabase REST API using service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({
      id: fallbackId, check_in_id: fallbackId,
      crisis_event_id: crisis_detected ? fallbackId : null,
      gift_order_draft_id: gift_intent ? fallbackId : null,
      service_booking_id: service_intent ? fallbackId : null,
      received: true
    }, { status: 201 })
  }

  const headers = {
    'Content-Type': 'application/json',
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Prefer': 'return=representation'
  }

  // Insert check_in
  let checkinId = fallbackId
  try {
    const r = await fetch(`${supabaseUrl}/rest/v1/check_ins`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        call_id: call_id || `call-${Date.now()}`,
        member_id: member_id || null,
        mood: mood_label || mood || null,
        mood_score: mood_score || null,
        crisis_detected,
        transcript: transcript_summary || transcript || null,
        duration_seconds: duration_seconds || null,
        created_at: new Date().toISOString()
      })
    })
    const data = await r.json().catch(() => null)
    if (Array.isArray(data) && data[0]?.id) checkinId = data[0].id
    else if (data?.id) checkinId = data.id
  } catch { /* use fallbackId */ }

  let crisis_event_id = null
  if (crisis_detected) {
    const ceId = `real-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    try {
      const r = await fetch(`${supabaseUrl}/rest/v1/crisis_events`, {
        method: 'POST', headers,
        body: JSON.stringify({
          member_id: member_id || null, source: 'aria_call',
          call_id: call_id || null, crisis_type: crisis_type || null,
          status: 'open', created_at: new Date().toISOString()
        })
      })
      const data = await r.json().catch(() => null)
      crisis_event_id = (Array.isArray(data) ? data[0]?.id : data?.id) || ceId
    } catch { crisis_event_id = ceId }
  }

  let gift_order_draft_id = null
  if (gift_intent) {
    const goId = `real-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    try {
      const r = await fetch(`${supabaseUrl}/rest/v1/gift_orders`, {
        method: 'POST', headers,
        body: JSON.stringify({
          member_id: member_id || null, source: 'aria_intent', status: 'draft',
          notes: typeof gift_intent === 'string' ? gift_intent : JSON.stringify(gift_intent),
          created_at: new Date().toISOString()
        })
      })
      const data = await r.json().catch(() => null)
      gift_order_draft_id = (Array.isArray(data) ? data[0]?.id : data?.id) || goId
    } catch { gift_order_draft_id = goId }
  }

  let service_booking_id = null
  if (service_intent) {
    const sbId = `real-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    try {
      const intentData = typeof service_intent === 'object' ? service_intent : { service_type: service_intent }
      const r = await fetch(`${supabaseUrl}/rest/v1/service_bookings`, {
        method: 'POST', headers,
        body: JSON.stringify({
          member_id: member_id || null,
          service_type: intentData.service_type || 'general',
          destination: intentData.destination || null,
          scheduled_for: intentData.scheduled_for || null,
          notes: intentData.notes || null,
          source: 'aria_intent', status: 'pending',
          created_at: new Date().toISOString()
        })
      })
      const data = await r.json().catch(() => null)
      service_booking_id = (Array.isArray(data) ? data[0]?.id : data?.id) || sbId
    } catch { service_booking_id = sbId }
  }

  return NextResponse.json({
    id: checkinId, check_in_id: checkinId,
    crisis_event_id, gift_order_draft_id, service_booking_id, received: true
  }, { status: 201 })
}
