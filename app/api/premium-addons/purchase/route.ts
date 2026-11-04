/**
 * app/api/premium-addons/purchase/route.ts — G7.23
 *
 * POST /api/premium-addons/purchase
 *   Creates a Stripe Checkout session for a premium add-on SKU.
 *
 * Body: { sku_id, member_id, quantity? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { sku_id, member_id, quantity = 1 } = body

  if (!sku_id || !member_id) {
    return NextResponse.json({ error: 'sku_id and member_id required' }, { status: 400 })
  }

  // Fetch the SKU
  const { data: addon } = await supabase
    .from('premium_addons')
    .select('*')
    .eq('id', sku_id)
    .eq('available', true)
    .single()

  if (!addon) return NextResponse.json({ error: 'Add-on not found or unavailable' }, { status: 404 })

  // extra_navigator_hours can be purchased in quantity 1–5
  const cappedQuantity = sku_id === 'extra_navigator_hours' ? Math.min(quantity, 5) : 1

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thriveatHome.com'
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        unit_amount: addon.price_cents,
        product_data: {
          name: addon.title,
          description: addon.description ?? undefined,
        },
      },
      quantity: cappedQuantity,
    }],
    metadata: {
      purpose: 'addon',
      sku_id: addon.id,
      sku_kind: addon.kind,
      member_id,
      quantity: String(cappedQuantity),
      purchased_by: user.id,
    },
    success_url: `${baseUrl}/dashboard/addons/success?sku=${addon.id}`,
    cancel_url: `${baseUrl}/dashboard/addons`,
  })

  return NextResponse.json({ checkout_url: session.url })
}
