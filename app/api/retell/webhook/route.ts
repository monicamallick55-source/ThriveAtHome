import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const supabase = await createClient()
  const { call_id, member_id, mood, crisis_detected = false, gift_intent, service_intent, transcript, duration_seconds } = body
  const { data: checkin, error: ciErr } = await supabase.from('check_ins').insert({ call_id: call_id || `call-${Date.now()}`, member_id: member_id || null, mood: mood || null, crisis_detected, transcript: transcript || null, duration_seconds: duration_seconds || null, created_at: new Date().toISOString() }).select().single()
  if (ciErr) return NextResponse.json({ error: ciErr.message }, { status: 500 })
  if (crisis_detected && member_id) await supabase.from('crisis_events').insert({ member_id, source: 'aria_call', call_id: call_id || null, status: 'open', created_at: new Date().toISOString() })
  if (gift_intent && member_id) await supabase.from('gift_orders').insert({ member_id, source: 'aria_intent', status: 'draft', notes: gift_intent, created_at: new Date().toISOString() })
  if (service_intent && member_id) await supabase.from('service_bookings').insert({ member_id, service_type: service_intent, source: 'aria_intent', status: 'pending', created_at: new Date().toISOString() })
  return NextResponse.json({ id: checkin.id, received: true }, { status: 201 })
}
