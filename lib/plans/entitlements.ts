// Single source of truth for plan entitlements.
// Consumed by UI, APIs, and navigator console.

export type PlanTier = 'basic' | 'complete' | 'premier'

export interface PlanEntitlements {
  tier: PlanTier
  monthlyAiCallMinutes: number
  monthlyNavigatorSessions: number
  navigatorHoursPerMonth: number
  buddyMatching: boolean
  culturalCircles: boolean
  familyAppSeats: number
  trackedItemsLimit: number       // -1 = unlimited
  crisisLineAccess: boolean
  volunteerMatching: boolean
  conciergeAccess: boolean
  fhirExport: boolean
  campaigns: boolean
  serviceMarketplace: boolean
}

export const ENTITLEMENTS: Record<PlanTier, PlanEntitlements> = {
  basic: {
    tier: 'basic',
    monthlyAiCallMinutes: 60,
    monthlyNavigatorSessions: 0,
    navigatorHoursPerMonth: 0,
    buddyMatching: false,
    culturalCircles: true,
    familyAppSeats: 1,
    trackedItemsLimit: 5,
    crisisLineAccess: true,
    volunteerMatching: false,
    conciergeAccess: false,
    fhirExport: false,
    campaigns: false,
    serviceMarketplace: false,
  },
  complete: {
    tier: 'complete',
    monthlyAiCallMinutes: 300,
    monthlyNavigatorSessions: 2,
    navigatorHoursPerMonth: 2,
    buddyMatching: true,
    culturalCircles: true,
    familyAppSeats: 5,
    trackedItemsLimit: 50,
    crisisLineAccess: true,
    volunteerMatching: true,
    conciergeAccess: false,
    fhirExport: true,
    campaigns: true,
    serviceMarketplace: true,
  },
  premier: {
    tier: 'premier',
    monthlyAiCallMinutes: 0,       // unlimited human-led
    monthlyNavigatorSessions: 4,
    navigatorHoursPerMonth: 4,
    buddyMatching: true,
    culturalCircles: true,
    familyAppSeats: 10,
    trackedItemsLimit: -1,
    crisisLineAccess: true,
    volunteerMatching: true,
    conciergeAccess: true,
    fhirExport: true,
    campaigns: true,
    serviceMarketplace: true,
  },
}

export function getEntitlements(tier: string | null | undefined): PlanEntitlements {
  return ENTITLEMENTS[(tier as PlanTier) ?? 'basic'] ?? ENTITLEMENTS.basic
}

/** Returns true if the member is at or over their family seat limit. */
export function isFamilySeatLimitReached(tier: string | null | undefined, currentSeats: number): boolean {
  return currentSeats >= getEntitlements(tier).familyAppSeats
}

/** Returns the navigator hour usage percentage (0–100+). */
export function navigatorUsagePct(tier: string | null | undefined, minutesUsed: number): number {
  const ent = getEntitlements(tier)
  if (ent.navigatorHoursPerMonth === 0) return 0
  return Math.round((minutesUsed / (ent.navigatorHoursPerMonth * 60)) * 100)
}
