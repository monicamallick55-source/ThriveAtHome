import Stripe from 'stripe'
import { requireServerEnv } from '../env'
import { getStripePriceId } from '../stripe/config'
import type { BillingProvider, PlanTier } from '../interfaces/BillingProvider'

function getStripeClient(): Stripe {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (Stripe as any)(requireServerEnv('STRIPE_SECRET_KEY'))
}

export class StripeBillingProvider implements BillingProvider {
  async createCheckoutSession(
    planTier: PlanTier,
    memberId: string,
    familyMemberId: string,
    existingStripeCustomerId?: string | null
  ): Promise<string> {
    const stripe = getStripeClient()
    const priceId = getStripePriceId(planTier)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?subscribed=true`,
      cancel_url: `${appUrl}/pricing`,
      // Reuse existing customer so Stripe doesn't create a duplicate on upgrade
      ...(existingStripeCustomerId ? { customer: existingStripeCustomerId } : {}),
      metadata: { member_id: memberId, family_member_id: familyMemberId },
      subscription_data: {
        metadata: { member_id: memberId, family_member_id: familyMemberId },
      },
    })

    if (!session.url) throw new Error('[StripeBillingProvider] No checkout URL returned from Stripe')
    return session.url
  }

  async getCustomerPortalUrl(stripeCustomerId: string): Promise<string> {
    const stripe = getStripeClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${appUrl}/dashboard/billing`,
    })
    return session.url
  }

  async handleWebhookEvent(rawBody: string, signature: string): Promise<void> {
    const stripe = getStripeClient()
    const webhookSecret = requireServerEnv('STRIPE_WEBHOOK_SECRET')
    // Validate signature — full event handling added in Phase 26
    stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  }
}
