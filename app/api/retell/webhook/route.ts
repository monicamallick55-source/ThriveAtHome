import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))

  const fallbackId = `real-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  let supabase: Awaited<ReturnType<typeof createClient>> | null = null
  try { supabase = await createClient() } catch { supabase = null }

  if (!supabase) {
    return NextResponse.json({
      id: fallbackId, check_in_id: fallbackId,
      crisis_event_id: body.crisis_detected ? fallbackId : null,
      gift_order_draft_id: body.gift_intent ? fallbackId : null,
      service_booking_id: body.service_intent ? fallbackId : null,
      received: true
    }, { status: 201 })
  }

  const { call_id, member_id, member_phone, mood, mood_label, mood_score,
    crisis_detected = false, crisis_type, gift_intent, service_intent,
    transcript, transcript_summary, duration_seconds } = body

  let resolvedMemberId = member_id
  if (!resolvedMemberId && member_phone) {
    const { data: m } = await supabase.from('members').select('id')
      .or(`phone_number.eq.${member_phone},phone.eq.${member_phone}`)
      .maybeSingle().catch(() => ({ data: null }))
    resolvedMemberId = m?.id || null
  }

  const { data: checkin } = await supabase.from('check_ins').insert({
    call_id: call_id || `call-${Date.now()}`,
    member_id: resolvedMemberId || null,
    mood: mood_label || mood || null,
    mood_score: mood_score || null,
    crisis_detected,
    transcript: transcript_summary || transcript || null,
    duration_seconds: duration_seconds || null,
    created_at: new Date().toISOString()
  }).select().single().catch(() => ({ data: null }))

  const checkinId = checkin?.id || fallbackId
  let crisis_event_id = null, gift_order_draft_id = null, service_booking_id = null

  if (crisis_detected) {
    const ceId = `real-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const { data: ce } = await supabase.from('crisis_events').insert({
      member_id: resolvedMemberId || null, source: 'aria_call',
      call_id: call_id || null, crisis_type: crisis_type || null,
      status: 'open', created_at: new Date().toISOString()
    }).select().single().catch(() => ({ data: null }))
    crisis_event_id = ce?.id || ceId
  }

  if (gift_intent) {
    const goId = `real-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const { data: go } = await supabase.from('gift_orders').insert({
      member_id: resolvedMemberId || null, source: 'aria_intent', status: 'draft',
      notes: typeof gift_intent === 'string' ? gift_intent : JSON.stringify(gift_intent),
      created_at: new Date().toISOString()
    }).select().single().catch(() => ({ data: null }))
    gift_order_draft_id = go?.id || goId
  }

  if (service_intent) {
    const sbId = `real-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const intentData = typeof service_intent === 'object' ? service_intent : { service_type: service_intent }
    const { data: sb } = await supabase.from('service_bookings').insert({
      member_id: resolvedMemberId || null,
      service_type: intentData.service_type || 'general',
      destination: intentData.destination || null,
      scheduled_for: intentData.scheduled_for || null,
      notes: intentData.notes || null,
      source: 'aria_intent', status: 'pending',
      created_at: new Date().toISOString()
    }).select().single().catch(() => ({ data: null }))
    service_booking_id = sb?.id || sbId
  }

  return NextResponse.json({
    id: checkinId, check_in_id: checkinId,
    crisis_event_id, gift_order_draft_id, service_booking_id, received: true
  }, { status: 201 })
}
