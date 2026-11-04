/**
 * app/api/gift-orders/route.ts — G7.3 Gift orders API
 *
 * POST  /api/gift-orders  — member places a gift order
 * GET   /api/gift-orders  — member sees their own sent orders; family sees received orders
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getItem, requiresFamilyApproval } from '@/lib/gifts/catalog'
import { goodsProvider } from '@/lib/gifts/provider'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const view = searchParams.get('view') ?? 'sent'   // 'sent' | 'received'

  if (view === 'received') {
    // Family member: see gifts sent to their family member profiles
    const { data: familyMember } = await supabase
      .from('family_members')
      .select('id')
      .eq('supabase_auth_id', user.id)
      .single()

    if (!familyMember) return NextResponse.json({ orders: [] })

    const { data: orders, error } = await supabase
      .from('gift_orders')
      .select('*')
      .eq('to_family_member_id', familyMember.id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ orders })
  }

  // Default: member sees gifts they've sent
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!member) return NextResponse.json({ orders: [] })

  const { data: orders, error } = await supabase
    .from('gift_orders')
    .select(`
      *,
      to_family_member:family_members(id, name, email)
    `)
    .eq('from_member_id', member.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ orders })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await supabase
    .from('members')
    .select('id, first_name, last_name')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 403 })

  const body = await req.json()
  const {
    catalog_item_id,
    to_family_member_id,
    personalization,
    delivery_address,
    quantity = 1,
    // If client is completing after Stripe checkout:
    stripe_session_id,
  } = body

  // Validate catalog item
  const item = getItem(catalog_item_id)
  if (!item) return NextResponse.json({ error: 'Unknown catalog item' }, { status: 400 })
  if (!item.available) return NextResponse.json({ error: 'Item not available' }, { status: 400 })

  // Validate family member belongs to this member
  const { data: fm } = await supabase
    .from('family_members')
    .select('id, name, email, member_id')
    .eq('id', to_family_member_id)
    .eq('member_id', member.id)
    .single()

  if (!fm) return NextResponse.json({ error: 'Family member not found' }, { status: 404 })

  const totalCents = item.price_cents * quantity
  const requiresApproval = needsFamilyApproval(item)
  const status = requiresApproval ? 'needs_family_approval' : item.price_cents === 0 ? 'paid' : 'pending'

  // Create order row
  const { data: order, error: insertErr } = await supabase
    .from('gift_orders')
    .insert({
      from_member_id: member.id,
      to_family_member_id,
      catalog_item_id,
      kind: item.kind,
      title: item.title,
      price_cents: item.price_cents,
      quantity,
      personalization,
      delivery_address: delivery_address ?? null,
      status,
      needs_family_approval: requiresApproval,
      aria_intent_detected: body.aria_intent_detected ?? false,
      aria_call_id: body.aria_call_id ?? null,
    })
    .select()
    .single()

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  // Free items — fulfil immediately via stub
  if (totalCents === 0) {
    const result = await goodsProvider.placeOrder({
      recipientName: fm.name,
      recipientEmail: fm.email,
      giftOrderId: order.id,
      catalogItemId: catalog_item_id,
      personalization,
      quantity,
    })

    if (result.success) {
      await supabase
        .from('gift_orders')
        .update({
          status: 'fulfilled',
          estimated_delivery: result.estimatedDelivery,
          tracking_number: result.trackingNumber,
          carrier: result.carrier,
        })
        .eq('id', order.id)
    }

    return NextResponse.json({ order: { ...order, status: result.success ? 'fulfilled' : 'pending' } })
  }

  // Paid items — create Stripe Checkout session (if Stripe configured)
  if (!requiresApproval && !stripe_session_id && stripe) {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: item.price_cents,
            product_data: {
              name: item.title,
              description: `Gift for ${fm.name}`,
            },
          },
          quantity,
        },
      ],
      metadata: {
        gift_order_id: order.id,
        purpose: 'gift',
        member_id: member.id,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/gifts?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/gifts?cancelled=1`,
    })

    await supabase
      .from('gift_orders')
      .update({ stripe_session_id: session.id, status: 'processing' })
      .eq('id', order.id)

    return NextResponse.json({ order, checkout_url: session.url })
  }

  return NextResponse.json({ order })
}
