import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' as any })

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_CAMPAIGN_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed' && event.type !== 'payment_intent.succeeded') {
    return NextResponse.json({ received: true })
  }

  const admin = createAdminClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const campaignId = session.metadata?.campaign_id
    if (!campaignId) return NextResponse.json({ received: true })

    const amount = (session.amount_total ?? 0) / 100
    const customerEmail = session.customer_details?.email
    const customerName = session.customer_details?.name

    // Check if donor is a member
    const { data: donor } = await admin.from('members')
      .select('id').eq('supabase_auth_id', (customerEmail) ?? '').maybeSingle()

    await admin.from('campaign_donations').insert({
      campaign_id: campaignId,
      donor_member_id: donor?.id || null,
      donor_name: customerName || 'Anonymous',
      donor_email: customerEmail,
      amount,
      stripe_payment_intent_id: session.payment_intent as string,
      is_anonymous: false,
    })
  }

  return NextResponse.json({ received: true })
}
