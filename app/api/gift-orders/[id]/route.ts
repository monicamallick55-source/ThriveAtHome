/**
 * app/api/gift-orders/[id]/route.ts — G7.3
 *
 * PATCH /api/gift-orders/[id] — family approves or admin updates status
 * GET   /api/gift-orders/[id] — single order
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { goodsProvider } from '@/lib/gifts/provider'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: order, error } = await supabase
    .from('gift_orders')
    .select(`*, to_family_member:family_members(id,name,email)`)
    .eq('id', id)
    .single()

  if (error || !order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ order })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action } = body  // 'approve' | 'cancel' | 'mark_delivered'

  const { data: order, error: fetchErr } = await supabase
    .from('gift_orders')
    .select(`*, to_family_member:family_members(id,name,email,member_id)`)
    .eq('id', id)
    .single()

  if (fetchErr || !order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const fm = Array.isArray(order.to_family_member)
    ? order.to_family_member[0]
    : order.to_family_member

  if (action === 'approve') {
    // Family member can approve their own gifts
    const { data: familyMember } = await supabase
      .from('family_members')
      .select('id')
      .eq('supabase_auth_id', user.id)
      .eq('id', fm?.id ?? '')
      .single()

    if (!familyMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Place the order via provider
    const result = await goodsProvider.placeOrder({
      recipientName: fm.name,
      recipientEmail: fm.email,
      giftOrderId: order.id,
      catalogItemId: order.catalog_item_id,
      personalization: order.personalization,
      quantity: order.quantity,
    })

    await supabase
      .from('gift_orders')
      .update({
        status: result.success ? 'fulfilled' : 'paid',
        needs_family_approval: false,
        family_approved_by: familyMember.id,
        family_approved_at: new Date().toISOString(),
        estimated_delivery: result.estimatedDelivery ?? null,
        tracking_number: result.trackingNumber ?? null,
        carrier: result.carrier ?? null,
      })
      .eq('id', id)

    return NextResponse.json({ success: true })
  }

  if (action === 'cancel') {
    if (order.stripe_payment_intent) {
      // Cancel via vendor if applicable
      // (stub: no-op)
    }
    await supabase
      .from('gift_orders')
      .update({ status: 'cancelled' })
      .eq('id', id)

    return NextResponse.json({ success: true })
  }

  if (action === 'mark_delivered') {
    await supabase
      .from('gift_orders')
      .update({ status: 'fulfilled', delivered_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
