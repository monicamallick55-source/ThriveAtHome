// app/api/webhooks/stripe-subscriptions/route.ts
// Full Stripe subscription lifecycle handler + welcome email + plan provisioning
// Webhook events handled:
//   checkout.session.completed   → provision member, send welcome email
//   customer.subscription.updated → sync plan/status changes (upgrades, downgrades, renewals)
//   customer.subscription.deleted → mark member inactive
//   invoice.payment_failed        → flag member, notify care team
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' as any })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Map Stripe Price IDs → internal plan names
function priceIdToPlan(priceId: string | null | undefined): 'basics' | 'complete' | null {
  if (!priceId) return null
  const basics = [
    process.env.STRIPE_PRICE_BASICS_MONTHLY,
    process.env.STRIPE_PRICE_BASICS_ANNUAL,
  ]
  const complete = [
    process.env.STRIPE_PRICE_COMPLETE_MONTHLY,
    process.env.STRIPE_PRICE_COMPLETE_ANNUAL,
  ]
  if (basics.includes(priceId)) return 'basics'
  if (complete.includes(priceId)) return 'complete'
  return null
}

async function sendWelcomeEmail(email: string, firstName: string, plan: string) {
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
  const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'hello@thriveathome.com'

  if (!SENDGRID_API_KEY) {
    console.warn('[welcome-email] SENDGRID_API_KEY not set — skipping email')
    return
  }

  const planName = plan === 'complete' ? 'Thrive Complete' : 'Thrive Basics'
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://thriveathome.vercel.app'}/dashboard`

  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: #2d6a4f; padding: 32px 40px; border-radius: 16px 16px 0 0; text-align: center;">
        <h1 style="color: #fff; font-size: 28px; margin: 0; letter-spacing: -0.5px;">Welcome to ThriveAtHome!</h1>
      </div>
      <div style="background: #f7faf7; padding: 40px; border-radius: 0 0 16px 16px; border: 1px solid #d4edda;">
        <p style="font-size: 17px; margin-top: 0;">Dear ${firstName},</p>
        <p style="font-size: 15px; color: #444; line-height: 1.7;">
          You're now a <strong style="color: #2d6a4f;">${planName}</strong> member — and we're so glad you're here.
          ThriveAtHome is your companion for living confidently, safely, and joyfully at home.
        </p>
        <div style="background: #fff; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #e0ede8;">
          <h2 style="font-size: 16px; color: #2d6a4f; margin-top: 0;">What to expect next</h2>
          <ul style="padding-left: 20px; margin: 0; color: #555; font-size: 14px; line-height: 2;">
            <li>Quinn, your AI concierge, will call to introduce herself within <strong>24 hours</strong></li>
            <li>Your daily Aria check-in calls will begin <strong>tomorrow morning</strong></li>
            <li>Your family portal is ready — invite loved ones to stay connected</li>
          </ul>
        </div>
        <div style="text-align: center; margin-top: 32px;">
          <a href="${dashboardUrl}" style="background: #2d6a4f; color: #fff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block;">
            Go to my dashboard →
          </a>
        </div>
        <p style="font-size: 12px; color: #aaa; text-align: center; margin-top: 32px;">
          Questions? Reply to this email or call <strong>1-800-THRIVE1</strong>
        </p>
      </div>
    </div>
  `

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }], subject: `Welcome to ThriveAtHome, ${firstName}! 🌿` }],
        from: { email: SENDGRID_FROM_EMAIL, name: 'ThriveAtHome' },
        content: [{ type: 'text/html', value: html }],
      }),
    })
    if (!res.ok) {
      const errBody = await res.text()
      console.error('[welcome-email] SendGrid error:', res.status, errBody)
    } else {
      console.log(`[welcome-email] Sent to ${email}`)
    }
  } catch (err) {
    console.error('[welcome-email] fetch error:', err)
  }
}

async function provisionMember(session: Stripe.CheckoutSession) {
  // Get subscription to extract price info
  let plan: 'basics' | 'complete' | null = null
  let stripeSubscriptionId: string | null = null
  let stripeCustomerId: string | null = null

  if (session.subscription) {
    stripeSubscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription.id
    stripeCustomerId = typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id ?? null

    try {
      const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId)
      const priceId = sub.items.data[0]?.price?.id
      plan = priceIdToPlan(priceId)
    } catch (err) {
      console.error('[provision] Failed to retrieve subscription:', err)
    }
  }

  // Fallback: read from metadata
  if (!plan) {
    plan = (session.metadata?.plan as 'basics' | 'complete') || 'basics'
  }

  const email = session.customer_details?.email
  const name = session.customer_details?.name || ''
  const [firstName, ...rest] = name.split(' ')
  const lastName = rest.join(' ')

  if (!email) {
    console.warn('[provision] No customer email in session')
    return
  }

  // Upsert member record
  const { error: upsertError } = await supabaseAdmin
    .from('members')
    .upsert(
      {
        email,
        first_name: firstName || '',
        last_name: lastName || '',
        plan,
        subscription_status: 'active',
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        onboarded_at: new Date().toISOString(),
      },
      { onConflict: 'email', ignoreDuplicates: false }
    )

  if (upsertError) {
    console.error('[provision] DB upsert error:', upsertError)
  } else {
    console.log(`[provision] Member provisioned: ${email} → ${plan}`)
    await sendWelcomeEmail(email, firstName || 'Friend', plan)
  }
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const priceId = sub.items.data[0]?.price?.id
  const plan = priceIdToPlan(priceId)
  const status = sub.status // active, past_due, canceled, etc.
  const stripeCustomerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id

  const updates: Record<string, unknown> = {
    subscription_status: status,
    stripe_subscription_id: sub.id,
    updated_at: new Date().toISOString(),
  }
  if (plan) updates.plan = plan

  const { error } = await supabaseAdmin
    .from('members')
    .update(updates)
    .eq('stripe_customer_id', stripeCustomerId)

  if (error) {
    console.error('[subscription-updated] DB error:', error)
  } else {
    console.log(`[subscription-updated] Updated member for customer ${stripeCustomerId}: plan=${plan}, status=${status}`)
  }
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const stripeCustomerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id

  const { error } = await supabaseAdmin
    .from('members')
    .update({
      subscription_status: 'canceled',
      plan: null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', stripeCustomerId)

  if (error) {
    console.error('[subscription-deleted] DB error:', error)
  } else {
    console.log(`[subscription-deleted] Canceled member for customer ${stripeCustomerId}`)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const stripeCustomerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id

  if (!stripeCustomerId) return

  const { error } = await supabaseAdmin
    .from('members')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', stripeCustomerId)

  if (error) {
    console.error('[payment-failed] DB error:', error)
  } else {
    console.log(`[payment-failed] Marked member past_due for customer ${stripeCustomerId}`)
  }

  // Alert care team
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/internal/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-cron-secret': process.env.CRON_SECRET! },
      body: JSON.stringify({
        type: 'payment_failed',
        subject: `Payment failed — member ${stripeCustomerId}`,
        body: `Invoice ${invoice.id} failed for Stripe customer ${stripeCustomerId}. Amount: $${((invoice.amount_due ?? 0) / 100).toFixed(2)}.`,
      }),
    })
  } catch {
    // non-critical
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET

  if (!webhookSecret || !sig) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[stripe-subscriptions webhook] Invalid signature:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log(`[stripe-subscriptions webhook] Event: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.CheckoutSession
        if (session.mode === 'subscription') {
          await provisionMember(session)
        }
        break
      }
      case 'customer.subscription.updated': {
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      }
      case 'customer.subscription.deleted': {
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      }
      case 'invoice.payment_failed': {
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
      }
      default:
        // Silently acknowledge unhandled events
        break
    }
  } catch (err) {
    console.error(`[stripe-subscriptions webhook] Handler error for ${event.type}:`, err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
