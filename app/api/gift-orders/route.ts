import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('gift_orders').select('id, gift_id, status, recipient_name, message, created_at').eq('user_id', user.id).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [], total: (data ?? []).length })
}
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json().catch(() => ({}))
  const { data, error } = await supabase.from('gift_orders').insert({ user_id: user.id, gift_id: body.gift_id, recipient_name: body.recipient_name ?? null, message: body.message ?? null, status: 'pending', created_at: new Date().toISOString() }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
  // mock fallback
  const fbId = `order-${Date.now()}`
  return NextResponse.json({ id: fbId, client_secret: `pi_mock_${fbId}_secret`, payment_intent_id: `pi_mock_${fbId}`, status: 'pending' }, { status: 201 })
}
