// Stub implementation — logs billing actions, no real charges. Replaced in M11 with StripeBillingProvider.
import type { BillingProvider, PlanTier } from '../interfaces/BillingProvider'

export class StubBillingProvider implements BillingProvider {
  async createCheckoutSession(planTier: PlanTier, memberId: string, _familyMemberId: string): Promise<string> {
    console.log(`[STUB][Billing] Would create checkout session for plan: ${planTier}, member: ${memberId}`)
    return 'https://stub-checkout.example.com/session'
  }
  async getCustomerPortalUrl(_stripeCustomerId: string): Promise<string> {
    console.log('[STUB][Billing] Would return customer portal URL')
    return 'https://stub-portal.example.com'
  }
  async handleWebhookEvent(_rawBody: string, _signature: string): Promise<void> {
    console.log('[STUB][Billing] Would process webhook event')
  }
}
