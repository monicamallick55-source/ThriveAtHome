// Trusted Advisor Directory — client-safe shared types, labels, and tier config.
// Phase 98 (M24). Imported by both server data layer and client components.

export type AdvisorType =
  | 'elder_law_attorney'
  | 'estate_planning_attorney'
  | 'financial_advisor'
  | 'benefits_counselor'
  | 'tax_professional'
  | 'insurance_specialist'
  | 'geriatric_care_manager'

export interface AdvisorTypeInfo {
  value: AdvisorType
  label: string
  emoji: string
  blurb: string
}

export const ADVISOR_TYPES: AdvisorTypeInfo[] = [
  {
    value: 'elder_law_attorney',
    label: 'Elder Law Attorney',
    emoji: '⚖️',
    blurb: 'Medicaid planning, guardianship, long-term care, and protecting assets.',
  },
  {
    value: 'estate_planning_attorney',
    label: 'Estate Planning Attorney',
    emoji: '📜',
    blurb: 'Wills, living trusts, powers of attorney, and advance directives.',
  },
  {
    value: 'financial_advisor',
    label: 'Financial Advisor',
    emoji: '📈',
    blurb: 'Retirement income, Social Security timing, and simplifying finances.',
  },
  {
    value: 'benefits_counselor',
    label: 'Benefits Counselor',
    emoji: '🗂️',
    blurb: 'Medicare, Medicaid, Medicare Savings Programs, SNAP, and property-tax relief.',
  },
  {
    value: 'tax_professional',
    label: 'Tax Professional',
    emoji: '🧾',
    blurb: 'Retiree tax returns, required minimum distributions, and IRS notices.',
  },
  {
    value: 'insurance_specialist',
    label: 'Insurance Specialist',
    emoji: '🛡️',
    blurb: 'Medigap, long-term care insurance, and life insurance review.',
  },
  {
    value: 'geriatric_care_manager',
    label: 'Geriatric Care Manager',
    emoji: '🧭',
    blurb: 'In-home assessments, care planning, and coordination for distant families.',
  },
]

export type AdvisorListingTier = 'standard' | 'featured' | 'premier'

export interface ListingTierInfo {
  value: AdvisorListingTier
  label: string
  annualFee: number
  perks: string[]
}

/** Annual listing fees — the M24 professional-services revenue line ($2,400–$6,000/advisor). */
export const LISTING_TIERS: ListingTierInfo[] = [
  {
    value: 'standard',
    label: 'Standard',
    annualFee: 2400,
    perks: [
      'Directory listing with profile, credentials, and contact details',
      'Warm navigator introductions to matched families',
      'Verified badge after vetting',
    ],
  },
  {
    value: 'featured',
    label: 'Featured',
    annualFee: 4000,
    perks: [
      'Everything in Standard',
      'Higher placement in search results',
      'Highlighted profile card',
    ],
  },
  {
    value: 'premier',
    label: 'Premier',
    annualFee: 6000,
    perks: [
      'Everything in Featured',
      'Top placement in your service area',
      'Featured in the monthly family newsletter',
      'Quarterly educational webinar slot',
    ],
  },
]

export function advisorTypeLabel(value: string): string {
  return ADVISOR_TYPES.find((t: any) => t.value === value)?.label ?? value
}

export function advisorTypeEmoji(value: string): string {
  return ADVISOR_TYPES.find((t: any) => t.value === value)?.emoji ?? '👤'
}

export function listingTierInfo(value: string): ListingTierInfo | undefined {
  return LISTING_TIERS.find((t: any) => t.value === value)
}

/** Connection status → warm, plain-English label for families. */
export const ADVISOR_CONNECTION_STATUS: Record<string, { label: string; color: string; description: string }> = {
  requested: {
    label: 'Introduction requested',
    color: '#f8961e',
    description: 'Your navigator is preparing a personal introduction and will be in touch.',
  },
  introduced: {
    label: 'Introduction made',
    color: '#4361ee',
    description: 'Your navigator has connected you. The advisor will reach out to arrange a first conversation.',
  },
  met: {
    label: 'First meeting complete',
    color: '#2b9348',
    description: 'You have met with this advisor. You can leave a private review to help other families.',
  },
  declined: {
    label: 'Not a fit',
    color: '#adb5bd',
    description: 'This introduction did not move forward.',
  },
  closed: {
    label: 'Closed',
    color: '#adb5bd',
    description: 'This introduction has been closed.',
  },
}
