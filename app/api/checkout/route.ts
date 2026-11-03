// app/api/checkout/route.ts — Stripe checkout session creation
// Supports: basics/complete × monthly/annual = 4 B2C price points
//           b2b_enrollment = $3,300 one-time B2B enrollment fee
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' as any })

// Price ID env vars — set these in Vercel:
// STRIPE_PRICE_BASICS_MONTHLY    — e.g. price_xxx
// STRIPE_PRICE_BASICS_ANNUAL     — e.g. price_yyy
// STRIPE_PRICE_COMPLETE_MONTHLY  — e.g. price_zzz
// STRIPE_PRICE_COMPLETE_ANNUAL   — e.g. price_aaa
// STRIPE_PRICE_B2B_ENROLLMENT    — $3,300 one-time B2B enrollment
const PRICE_MAP: Record<string, string | undefined> = {
  basics_monthly:   process.env.STRIPE_PRICE_BASICS_MONTHLY,
  basics_annual:    process.env.STRIPE_PRICE_BASICS_ANNUAL,
  complete_monthly: process.env.STRIPE_PRICE_COMPLETE_MONTHLY,
  complete_annual:  process.env.STRIPE_PRICE_COMPLETE_ANNUAL,
  b2b_enrollment:   process.env.STRIPE_PRICE_B2B_ENROLLMENT,
}

const B2B_PLANS = ['b2b_enrollment']
const B2C_PLANS = ['basics', 'complete']

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { plan, billing, email, org_id } = body as {
    plan?: string
    billing?: string
    email?: string
    org_id?: string
  }

  if (!plan) {
    return NextResponse.json({ error: 'plan is required' }, { status: 400 })
  }

  const isB2B = B2B_PLANS.includes(plan)
  const isB2C = B2C_PLANS.includes(plan)

  if (!isB2B && !isB2C) {
    return NextResponse.json({ error: `Unknown plan: ${plan}` }, { status: 400 })
  }

  // B2C requires billing cycle
  if (isB2C && (!billing || !['monthly', 'annual'].includes(billing))) {
    return NextResponse.json({ error: 'billing must be monthly or annual for B2C plans' }, { status: 400 })
  }

  const priceKey = isB2B ? plan : `${plan}_${billing}`
  const priceId = PRICE_MAP[priceKey]

  if (!priceId) {
    console.error(`[checkout] Missing env var for price key: ${priceKey}`)
    return NextResponse.json(
      { error: `Payment is not yet configured for this plan (${priceKey}). Please contact support.` },
      { status: 503 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thriveathome.vercel.app'

  try {
    let session: Stripe.Checkout.Session

    if (isB2B) {
      // B2B: one-time payment mode
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        customer_email: email || undefined,
        success_url: `${appUrl}/for-organizations/signup/success?session_id={CHECKOUT_SESSION_ID}&org_id=${org_id || ''}`,
        cancel_url: `${appUrl}/for-organizations/signup?step=5&org_id=${org_id || ''}&cancelled=1`,
        metadata: { plan, org_id: org_id || '', source: 'b2b_wizard' },
      })
    } else {
      // B2C: subscription mode
      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        customer_email: email || undefined,
        success_url: `${appUrl}/signup/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}&billing=${billing}`,
        cancel_url: `${appUrl}/signup?plan=${plan}&billing=${billing}&cancelled=1`,
        subscription_data: { metadata: { plan, billing: billing!, source: 'signup_wizard' } },
        metadata: { plan, billing: billing! },
        allow_promotion_codes: true,
      })
    }

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[checkout] Stripe error:', message)
    return NextResponse.json({ error: 'Failed to create checkout session', detail: message }, { status: 500 })
  }
}
