/**
 * lib/entitlements/planLimits.ts — G5.7
 * Plan tier limits for navigator hours, features, and seat enforcement.
 */

export type PlanTier = 'basics' | 'connect' | 'complete' | 'premier'

export interface PlanLimits {
  navigatorHoursPerMonth: number   // 0 = none included
  buddyCallsPerMonth: number
  familyContacts: number
  canAccessLifeTransitions: boolean
  canAccessMedicareHelp: boolean
  canAccessCulturalCircles: boolean
  canAccessVolunteerMatching: boolean
  canRequestCompanion: boolean
  canBookRides: boolean
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  basics: {
    navigatorHoursPerMonth: 0,
    buddyCallsPerMonth: 2,
    familyContacts: 1,
    canAccessLifeTransitions: false,
    canAccessMedicareHelp: true,
    canAccessCulturalCircles: false,
    canAccessVolunteerMatching: false,
    canRequestCompanion: false,
    canBookRides: false,
  },
  connect: {
    navigatorHoursPerMonth: 1,
    buddyCallsPerMonth: 4,
    familyContacts: 2,
    canAccessLifeTransitions: true,
    canAccessMedicareHelp: true,
    canAccessCulturalCircles: true,
    canAccessVolunteerMatching: true,
    canRequestCompanion: false,
    canBookRides: false,
  },
  complete: {
    navigatorHoursPerMonth: 3,
    buddyCallsPerMonth: 8,
    familyContacts: 4,
    canAccessLifeTransitions: true,
    canAccessMedicareHelp: true,
    canAccessCulturalCircles: true,
    canAccessVolunteerMatching: true,
    canRequestCompanion: true,
    canBookRides: true,
  },
  premier: {
    navigatorHoursPerMonth: 999,  // unlimited
    buddyCallsPerMonth: 999,
    familyContacts: 999,
    canAccessLifeTransitions: true,
    canAccessMedicareHelp: true,
    canAccessCulturalCircles: true,
    canAccessVolunteerMatching: true,
    canRequestCompanion: true,
    canBookRides: true,
  },
}

export function getPlanLimits(tier: string | null): PlanLimits {
  return PLAN_LIMITS[(tier as PlanTier) ?? 'basics'] ?? PLAN_LIMITS.basics
}

export function canAccess(tier: string | null, feature: keyof PlanLimits): boolean {
  const limits = getPlanLimits(tier)
  const val = limits[feature]
  if (typeof val === 'boolean') return val
  if (typeof val === 'number') return val > 0
  return false
}
