import { sendOrgEnrollmentAlert } from '@/lib/email/resend'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'
import { requireServerEnv } from '@/lib/env'
import {
  upsertSubscription,
  cancelMemberSubscription,
} from '@/lib/data/billing'
import type { PlanTier } from '@/lib/interfaces/BillingProvider'

// Stripe SDK v22: period dates are on the first subscription item, not the subscription root.
function getSubscriptionPeriod(subscription: Stripe.Subscription): { start: string; end: string } {
  const item = subscription.items.data[0]
  const start = item?.current_period_start
    ? new Date(item.current_period_start * 1000).toISOString()
    : null
  const end = item?.current_period_end
    ? new Date(item.current_period_end * 1000).toISOString()
    : null
  return { start: start ?? new Date().toISOString(), end: end ?? new Date().toISOString() }
}

// Stripe SDK v22: subscription on invoice is at invoice.parent.subscription_details.subscription
function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const sub = invoice.parent?.subscription_details?.subscription
  if (!sub) return null
  return typeof sub === 'string' ? sub : sub.id
}

// Map monthly price amount (cents) → plan tier
const AMOUNT_TO_TIER: Record<number, PlanTier> = {
  3900: 'basic',
  7900: 'complete',
  9900: 'complete',
  19900: 'premier',
}

function getPlanTierFromSubscription(subscription: Stripe.Subscription): PlanTier {
  const amount = subscription.items.data[0]?.price?.unit_amount ?? 0
  return AMOUNT_TO_TIER[amount] ?? 'basic'
}

function getStripeClient(): Stripe {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (Stripe as any)(requireServerEnv('STRIPE_SECRET_KEY'))
}

export async function POST(req: Request) {
  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    const stripe = getStripeClient()
    const webhookSecret = requireServerEnv('STRIPE_WEBHOOK_SECRET')
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (e) {
    console.error('[webhook/stripe] Signature verification failed:', e)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  try {
    await handleStripeEvent(event)
  } catch (e) {
    // Log but always return 200 — Stripe retries on non-200
    console.error('[webhook/stripe] Event handling error:', e)
  }

  return NextResponse.json({ received: true })
}

async function handleStripeEvent(event: Stripe.Event) {
  const stripe = getStripeClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      // Org enrollment: one-time payment flow
      if (session.mode === 'payment' && session.metadata?.flow === 'org_enrollment') {
        const meta = session.metadata
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (supabaseUrl && supabaseKey) {
          const { createClient } = await import('@supabase/supabase-js')
          const db = createClient(supabaseUrl, supabaseKey)
          const stripeCustomerId = typeof session.customer === 'string' ? session.customer : (session.customer as any)?.id ?? ''
          const stripePaymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent as any)?.id ?? ''
          // Update payment record to succeeded
          await db.from('org_enrollment_payments')
            .update({ status: 'succeeded', completed_at: new Date().toISOString(), stripe_pi_id: stripePaymentIntentId })
            .eq('stripe_session_id', session.id)
          // Create the community org record
          const { data: org } = await db.from('community_orgs').insert({
            org_name: meta.org_name,
            org_type: meta.org_type,
            contact_name: meta.contact_name,
            contact_email: meta.contact_email,
            contact_phone: meta.contact_phone ?? null,
            city: meta.city ?? null,
            state: meta.state ?? null,
            website: meta.website ?? null,
            org_size: meta.org_size ?? null,
            mission_statement: meta.mission_statement ?? null,
            enrollment_status: 'paid',
            enrollment_paid_at: new Date().toISOString(),
            stripe_customer_id: stripeCustomerId,
            stripe_payment_intent_id: stripePaymentIntentId,
          }).select('id').single()
          // Link payment record to the new org
          if (org?.id) {
            await db.from('org_enrollment_payments').update({ org_id: org.id }).eq('stripe_session_id', session.id)
          }
          console.log('[webhook/stripe] org enrollment paid:', meta.org_name, org?.id)
        }
        break
      }
      // Campaign donation: one-time payment flow
      if (session.mode === 'payment' && session.metadata?.type === 'campaign_donation') {
        const meta = session.metadata
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (supabaseUrl && supabaseKey) {
          const { createClient } = await import('@supabase/supabase-js')
          const db = createClient(supabaseUrl, supabaseKey)
          const stripePaymentIntentId = typeof session.payment_intent === 'string'
            ? session.payment_intent
            : (session.payment_intent as any)?.id ?? ''
          await db.from('campaign_donations')
            .update({ status: 'completed', stripe_payment_intent: stripePaymentIntentId })
            .eq('stripe_session_id', session.id)
          console.log('[webhook/stripe] campaign donation completed:', meta.campaign_id, session.id)
        }
        break
      }
      if (session.mode !== 'subscription') break

      const memberId = session.metadata?.member_id
      if (!memberId) {
        console.error('[webhook/stripe] checkout.session.completed: missing member_id in metadata')
        break
      }

      const stripeCustomerId = typeof session.customer === 'string'
        ? session.customer
        : (session.customer as Stripe.Customer | null)?.id ?? ''
      const stripeSubscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : (session.subscription as Stripe.Subscription | null)?.id ?? ''

      if (!stripeSubscriptionId) {
        console.error('[webhook/stripe] checkout.session.completed: missing subscription ID')
        break
      }

      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
      const planTier = getPlanTierFromSubscription(subscription)
      const { start, end } = getSubscriptionPeriod(subscription)

      const { error: upsertErr } = await upsertSubscription({
        memberId,
        stripeCustomerId,
        stripeSubscriptionId,
        planTier,
        status: subscription.status,
        currentPeriodStart: start,
        currentPeriodEnd: end,
        monthlyAmountCents: subscription.items.data[0]?.price?.unit_amount ?? null,
      })

      if (upsertErr) {
        console.error(`[webhook/stripe] checkout.session.completed: upsertSubscription failed for member ${memberId}:`, upsertErr)
      } else {
        console.log(`[webhook/stripe] Subscription created for member ${memberId}: ${planTier}`)
      }
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const stripeSubscriptionId = getInvoiceSubscriptionId(invoice)
      if (!stripeSubscriptionId) break

      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
      const memberId = subscription.metadata?.member_id
      if (!memberId) {
        console.warn('[webhook/stripe] invoice.payment_succeeded: no member_id in sub metadata, skipping')
        break
      }

      const planTier = getPlanTierFromSubscription(subscription)
      const stripeCustomerId = typeof subscription.customer === 'string'
        ? subscription.customer
        : (subscription.customer as Stripe.Customer | null)?.id ?? ''
      const { start, end } = getSubscriptionPeriod(subscription)

      const { error: upsertErr2 } = await upsertSubscription({
        memberId,
        stripeCustomerId,
        stripeSubscriptionId,
        planTier,
        status: subscription.status,
        currentPeriodStart: start,
        currentPeriodEnd: end,
        monthlyAmountCents: subscription.items.data[0]?.price?.unit_amount ?? null,
      })

      if (upsertErr2) {
        console.error(`[webhook/stripe] invoice.payment_succeeded: upsertSubscription failed:`, upsertErr2)
      }
      console.log(`[webhook/stripe] Payment succeeded for subscription ${stripeSubscriptionId}`)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const stripeSubscriptionId = getInvoiceSubscriptionId(invoice)
      // Stub: log the failure; email notifications added in M10
      console.warn(`[webhook/stripe] Payment failed for subscription ${stripeSubscriptionId ?? 'unknown'} — email notification stub (M10)`)
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const memberId = subscription.metadata?.member_id
      if (!memberId) {
        console.warn('[webhook/stripe] customer.subscription.updated: no member_id in metadata')
        break
      }

      const planTier = getPlanTierFromSubscription(subscription)
      const stripeCustomerId = typeof subscription.customer === 'string'
        ? subscription.customer
        : (subscription.customer as Stripe.Customer | null)?.id ?? ''
      const { start, end } = getSubscriptionPeriod(subscription)

      const { error: upsertErr3 } = await upsertSubscription({
        memberId,
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        planTier,
        status: subscription.status,
        currentPeriodStart: start,
        currentPeriodEnd: end,
        monthlyAmountCents: subscription.items.data[0]?.price?.unit_amount ?? null,
      })

      if (upsertErr3) {
        console.error(`[webhook/stripe] customer.subscription.updated: upsertSubscription failed:`, upsertErr3)
      }
      console.log(`[webhook/stripe] Subscription updated: ${subscription.id} → ${planTier} (${subscription.status})`)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await cancelMemberSubscription(subscription.id)
      console.log(`[webhook/stripe] Subscription cancelled: ${subscription.id}`)
      break
    }
       case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      const admin = createAdminClient()
      // Celebration request payment
      const requestId = pi.metadata?.request_id
      if (requestId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any)
          .from('celebration_requests')
          .update({ status: 'active' })
          .eq('id', requestId)
        console.log(`[webhook/stripe] Celebration request ${requestId} marked active`)
        break
      }
      // Gift order payment
      const orderId = pi.metadata?.order_id
      if (orderId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any)
          .from('gift_orders')
          .update({ status: 'paid' })
          .eq('id', orderId)
        console.log(`[webhook/stripe] Gift order ${orderId} marked paid`)
      }
      break
    }
    default:
      // Unhandled event type — ignore silently
      break
  }
}
