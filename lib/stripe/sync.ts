// Server-side subscription sync — queries Stripe directly to create/update the subscriptions
// row when the webhook is unavailable (e.g. webhook secret not yet configured in Vercel).
import Stripe from 'stripe'
import { upsertSubscription } from '../data/billing'
import type { PlanTier } from '../interfaces/BillingProvider'

const AMOUNT_TO_TIER: Record<number, PlanTier> = {
  1900: 'basics',
  3900: 'connect',
  6900: 'complete',
  12900: 'premier',
}

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('[stripe/sync] STRIPE_SECRET_KEY not set')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (Stripe as any)(key)
}

/**
 * Find the most recent active Stripe subscription for this email and upsert
 * the subscriptions row. Best-effort — never throws; logs errors only.
 */
export async function syncMemberSubscription(memberId: string, email: string): Promise<void> {
  if (!process.env.STRIPE_SECRET_KEY) return

  try {
    const stripe = getStripeClient()

    // Look up Stripe customers by email (there may be multiple from test runs)
    const customers = await stripe.customers.list({ email, limit: 5 })
    if (!customers.data.length) return

    for (const customer of customers.data) {
      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 1,
      })

      const sub = subs.data[0]
      if (!sub) continue

      const item = sub.items.data[0]
      const amount = item?.price?.unit_amount ?? 0
      const planTier: PlanTier = AMOUNT_TO_TIER[amount] ?? 'basics'

      const periodStart = item?.current_period_start
        ? new Date(item.current_period_start * 1000).toISOString()
        : new Date().toISOString()
      const periodEnd = item?.current_period_end
        ? new Date(item.current_period_end * 1000).toISOString()
        : new Date().toISOString()

      const { error } = await upsertSubscription({
        memberId,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: sub.id,
        planTier,
        status: sub.status,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        monthlyAmountCents: amount,
      })

      if (error) {
        console.error('[stripe/sync] upsertSubscription failed:', error)
      } else {
        console.log(`[stripe/sync] Synced subscription for member ${memberId}: ${planTier}`)
      }
      return
    }
  } catch (e) {
    console.error('[stripe/sync] syncMemberSubscription failed (non-fatal):', e)
  }
}
