// Placeholder — real implementation added in M11 (Phase 24)
import type { BillingProvider, PlanTier } from '../interfaces/BillingProvider'

export class StripeBillingProvider implements BillingProvider {
  async createCheckoutSession(_planTier: PlanTier, _memberId: string, _familyMemberId: string): Promise<string> {
    throw new Error('[StripeBillingProvider] Not yet implemented — add in M11')
  }
  async getCustomerPortalUrl(_stripeCustomerId: string): Promise<string> {
    throw new Error('[StripeBillingProvider] Not yet implemented — add in M11')
  }
  async handleWebhookEvent(_rawBody: string, _signature: string): Promise<void> {
    throw new Error('[StripeBillingProvider] Not yet implemented — add in M11')
  }
}
