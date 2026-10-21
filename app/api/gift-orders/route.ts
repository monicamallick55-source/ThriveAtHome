// app/api/gift-orders/route.ts
// G7.3 — Senior places a gift order for a family member
// GET  — list own gift orders
// POST — place a new gift order (free: direct insert; paid: Stripe PI)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGiftById } from '@/lib/gifts/catalog'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!member) return NextResponse.json({ error: 'Members only' }, { status: 403 })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('gift_orders')
    .select('*')
    .eq('member_id', member.id)
    .not('status', 'eq', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ orders: data })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Only members can send gifts (not family)
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()
  if (!member) return NextResponse.json({ error: 'Members only — only your account can send gifts' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { giftId, recipientName, recipientEmail, message, eventId } = body

  if (!giftId || typeof giftId !== 'string') {
    return NextResponse.json({ error: 'giftId required' }, { status: 400 })
  }
  if (!recipientName || typeof recipientName !== 'string') {
    return NextResponse.json({ error: 'recipientName required' }, { status: 400 })
  }

  const gift = getGiftById(giftId)
  if (!gift) {
    return NextResponse.json({ error: 'Invalid giftId' }, { status: 400 })
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  if (gift.amountCents === null || gift.amountCents === 0) {
    // Free gift (digital card) — insert directly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from('gift_orders')
      .insert({
        member_id: member.id,
        recipient_name: recipientName,
        recipient_email: recipientEmail ?? null,
        gift_type: gift.type,
        gift_label: gift.label,
        amount_cents: 0,
        message: typeof message === 'string' ? message.slice(0, 500) : null,
        status: 'processing',
        event_id: eventId ?? null,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // TODO: send digital card email in production
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('gift_orders')
      .update({ status: 'delivered' })
      .eq('id', data.id)

    return NextResponse.json({ ok: true, orderId: data.id, requiresPayment: false }, { status: 201 })
  }

  // Paid gift — create a Stripe PaymentIntent
  // For now, insert as 'pending' and return clientSecret placeholder
  // In production: integrate with Stripe here
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('gift_orders')
    .insert({
      member_id: member.id,
      recipient_name: recipientName,
      recipient_email: recipientEmail ?? null,
      gift_type: gift.type,
      gift_label: gift.label,
      amount_cents: gift.amountCents,
      message: typeof message === 'string' ? message.slice(0, 500) : null,
      status: 'pending',
      event_id: eventId ?? null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // TODO: create Stripe PaymentIntent and store stripe_pi_id
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  // const pi = await stripe.paymentIntents.create({ amount: gift.amountCents, currency: 'usd', metadata: { order_id: data.id } })
  // await db.from('gift_orders').update({ stripe_pi_id: pi.id }).eq('id', data.id)
  // return NextResponse.json({ ok: true, orderId: data.id, requiresPayment: true, clientSecret: pi.client_secret })

  return NextResponse.json({
    ok: true,
    orderId: data.id,
    requiresPayment: true,
    amountCents: gift.amountCents,
    // clientSecret: pi.client_secret   ← enable when Stripe live
    note: 'Stripe integration pending live keys',
  }, { status: 201 })
}
