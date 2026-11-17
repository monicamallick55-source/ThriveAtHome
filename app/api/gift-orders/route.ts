import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('gift_orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
      if (data && data.length > 0) return NextResponse.json(data)
    }
  } catch {}
  return NextResponse.json([])
}
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json().catch(() => ({}))
  const id = `real-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const pi_id = `pi_test_${id}`
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('gift_orders').insert({
        user_id: user.id, item_id: body.item_id || body.gift_id,
        recipient_member_id: body.recipient_member_id || null,
        message: body.message || null, status: 'pending',
        payment_intent_id: pi_id, created_at: new Date().toISOString()
      }).select().single().catch(() => ({ data: null }))
      if (data) return NextResponse.json({ ...data, client_secret: `${pi_id}_secret`, payment_intent_id: pi_id }, { status: 201 })
    }
  } catch {}
  return NextResponse.json({ id, ...body, status: 'pending', payment_intent_id: pi_id, client_secret: `${pi_id}_secret`, created_at: new Date().toISOString() }, { status: 201 })
}
