// Interface for subscription billing — checkout, portal, and webhook handling.

export type PlanTier = 'basics' | 'connect' | 'complete' | 'premier'

export interface BillingProvider {
  createCheckoutSession(planTier: PlanTier, memberId: string, familyMemberId: string): Promise<string>
  getCustomerPortalUrl(stripeCustomerId: string): Promise<string>
  handleWebhookEvent(rawBody: string, signature: string): Promise<void>
}
