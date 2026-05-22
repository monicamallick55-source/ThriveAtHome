import type { PlanTier } from '../interfaces/BillingProvider'

export type StripePlanConfig = {
  tier: PlanTier
  name: string
  price: number
  features: string[]
  highlighted?: boolean
}

export const STRIPE_PLANS: Record<PlanTier, StripePlanConfig> = {
  basics: {
    tier: 'basics',
    name: 'Thrive Basics',
    price: 19,
    features: [
      'Daily AI check-ins',
      'Medication reminders',
      'Family dashboard',
      'SOS alerts',
    ],
  },
  connect: {
    tier: 'connect',
    name: 'Thrive Connect',
    price: 39,
    features: [
      'Everything in Basics',
      'Volunteer connections',
      'Virtual events',
      'Grief circle access',
    ],
    highlighted: true,
  },
  complete: {
    tier: 'complete',
    name: 'Thrive Complete',
    price: 69,
    features: [
      'Everything in Connect',
      'Care navigator (2 hrs/month)',
      'Skill exchange',
      'Health monitoring',
    ],
  },
  premier: {
    tier: 'premier',
    name: 'Thrive Premier',
    price: 129,
    features: [
      'Everything in Complete',
      'Dedicated navigator (8 hrs/month)',
      'Companion credits ($50/mo)',
      'Milestone celebrations',
    ],
  },
}

const PRICE_ID_KEYS: Record<PlanTier, string> = {
  basics: 'STRIPE_PRICE_ID_BASICS',
  connect: 'STRIPE_PRICE_ID_CONNECT',
  complete: 'STRIPE_PRICE_ID_COMPLETE',
  premier: 'STRIPE_PRICE_ID_PREMIER',
}

/** Returns the Stripe Price ID for a plan tier. Server-side only — throws if env var missing. */
export function getStripePriceId(tier: PlanTier): string {
  const key = PRICE_ID_KEYS[tier]
  const val = process.env[key]
  if (!val || val.trim() === '') {
    throw new Error(`Missing env var: ${key} — add it to .env.local and Vercel`)
  }
  return val
}
