/**
 * Plan-based feature entitlements for ThriveAtHome.
 * Four tiers: free | standard | premier | enterprise
 * 15 feature flags used throughout the app.
 */

export type PlanTier = 'free' | 'standard' | 'premier' | 'enterprise'

export interface Entitlements {
  // Call features
  ariaCalls: boolean
  joyCelebrationCalls: boolean
  gracReminderCalls: boolean
  crisisLine: boolean          // Hope agent
  // Navigator
  navigatorHoursPerMonth: number   // 0 = no access
  navigatorVideoCall: boolean
  // Family
  familySeats: number
  familyDailySummary: boolean
  // Community
  circleAccess: boolean
  privateCircles: boolean
  // Companion
  companionBooking: boolean
  companionCreditsPerMonth: number  // cents
  // Platform
  fhirExport: boolean
  maReporting: boolean
  buddyMatching: boolean
}

const FREE: Entitlements = {
  ariaCalls: false,
  joyCelebrationCalls: false,
  gracReminderCalls: false,
  crisisLine: true,
  navigatorHoursPerMonth: 0,
  navigatorVideoCall: false,
  familySeats: 1,
  familyDailySummary: false,
  circleAccess: true,
  privateCircles: false,
  companionBooking: false,
  companionCreditsPerMonth: 0,
  fhirExport: false,
  maReporting: false,
  buddyMatching: false,
}

const STANDARD: Entitlements = {
  ...FREE,
  ariaCalls: true,
  joyCelebrationCalls: true,
  gracReminderCalls: true,
  navigatorHoursPerMonth: 1,
  familySeats: 3,
  familyDailySummary: true,
  privateCircles: true,
  buddyMatching: true,
}

const PREMIER: Entitlements = {
  ...STANDARD,
  navigatorHoursPerMonth: 4,
  navigatorVideoCall: true,
  familySeats: 6,
  companionBooking: true,
  companionCreditsPerMonth: 5000,  // $50
}

const ENTERPRISE: Entitlements = {
  ...PREMIER,
  navigatorHoursPerMonth: 999,
  familySeats: 999,
  fhirExport: true,
  maReporting: true,
}

const PLAN_MAP: Record<PlanTier, Entitlements> = {
  free: FREE,
  standard: STANDARD,
  premier: PREMIER,
  enterprise: ENTERPRISE,
}

export function getEntitlements(plan: string | null | undefined): Entitlements {
  const tier = (plan ?? 'free') as PlanTier
  return PLAN_MAP[tier] ?? FREE
}

export function can(plan: string | null | undefined, feature: keyof Entitlements): boolean {
  const e = getEntitlements(plan)
  const val = e[feature]
  if (typeof val === 'boolean') return val
  if (typeof val === 'number') return val > 0
  return false
}
