import type { PlanTier } from '../interfaces/BillingProvider'

export type BillingInterval = 'monthly' | 'annual'

export type StripePlanConfig = {
  tier: PlanTier
  name: string
  monthlyPrice: number
  annualPrice: number
  annualTotal: number
  features: string[]
  highlighted?: boolean
}

export const STRIPE_PLANS: Record<PlanTier, StripePlanConfig> = {
  basic: {
    tier: 'basic',
    name: 'Thrive Basic',
    monthlyPrice: 39,
    annualPrice: 33,
    annualTotal: 421,
    features: [
      'Daily Aria AI check-in calls',
      'Family wellness dashboard',
      'Mood, energy & sleep tracking',
      'Fraud monitoring (7 categories)',
      'Missed call escalation',
      'Document vault',
      'Crisis phrase detection',
      'Family SMS alerts',
    ],
  },
  complete: {
    tier: 'complete',
    name: 'Thrive Complete',
    monthlyPrice: 79,
    annualPrice: 63,
    annualTotal: 853,
    highlighted: true,
    features: [
      'Everything in Basic',
      'Matched Human Buddy (weekly calls)',
      '25+ communities access',
      'Community events & RSVP',
      'Dedicated navigator (2 hr/mo)',
      'Grief & transition support (9 pathways)',
      'Services marketplace access',
      'Celebrations & gift sending',
      'Family Events Calendar',
      'Paid companion booking',
      'Priority fraud escalation',
    ],
  },
  premier: {
    tier: 'premier',
    name: 'Thrive Premier',
    monthlyPrice: 199,
    annualPrice: 166,
    annualTotal: 2149,
    features: [
      'Everything in Complete',
      'Dedicated navigator (8 hr/mo)',
      'Milestone celebrations',
      'White-glove onboarding',
    ],
  },
}

// Monthly price IDs
const MONTHLY_PRICE_ID_KEYS: Record<PlanTier, string> = {
  basic:    'STRIPE_PRICE_ID_BASIC_MONTHLY',
  complete: 'STRIPE_PRICE_ID_COMPLETE_MONTHLY',
  premier:  'STRIPE_PRICE_ID_PREMIER_MONTHLY',
}

// Annual price IDs
const ANNUAL_PRICE_ID_KEYS: Record<PlanTier, string> = {
  basic:    'STRIPE_PRICE_ID_BASIC_ANNUAL',
  complete: 'STRIPE_PRICE_ID_COMPLETE_ANNUAL',
  premier:  'STRIPE_PRICE_ID_PREMIER_ANNUAL',
}

/** Returns the Stripe Price ID for a plan tier + billing interval. Server-side only. */
export function getStripePriceId(tier: PlanTier, interval: BillingInterval = 'monthly'): string {
  const keys = interval === 'annual' ? ANNUAL_PRICE_ID_KEYS : MONTHLY_PRICE_ID_KEYS
  const key = keys[tier]
  if (!key) throw new Error(`Unknown plan tier: ${tier}`)
  const val = process.env[key]
  if (!val || val.trim() === '') {
    throw new Error(`Missing env var: ${key} — add it to .env.local and Vercel`)
  }
  return val
}
