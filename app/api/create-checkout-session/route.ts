import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  if (!body.price_id) return NextResponse.json({ error: 'price_id is required' }, { status: 400 })
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  try {
    const stripe = new Stripe(stripeKey, { apiVersion: '2026-04-22.dahlia' as any })
    const session = await stripe.checkout.sessions.create({ mode: 'subscription', line_items: [{ price: body.price_id, quantity: 1 }], success_url: 'https://thrive-at-home-pied.vercel.app/dashboard', cancel_url: 'https://thrive-at-home-pied.vercel.app/pricing', metadata: { member_id: user.id } })
    return NextResponse.json({ url: session.url, session_id: session.id })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }) }
}
