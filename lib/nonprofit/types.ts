// lib/nonprofit/types.ts
// Types for the nonprofit/Community Access subsystem

export type NonprofitOrgType =
  | 'area_agency_on_aging'
  | 'village_network'
  | 'senior_center'
  | 'faith_organization'
  | 'community_foundation'
  | 'housing_authority'
  | 'healthcare_system'
  | 'other_nonprofit'

export type SponsoredMembershipStatus =
  | 'pending_review'   // referral submitted, navigator hasn't approved yet
  | 'active'           // senior enrolled, membership live
  | 'paused'           // sponsor paused (e.g. funding gap)
  | 'expired'          // end date passed, not renewed
  | 'revoked'          // navigator/admin ended early

export type CommunityAccessTier = 'community_free' | 'community_subsidised'
// community_free     = $0/mo (fully funded by donations/foundation)
// community_subsidised = $5/mo (senior pays $5, org/donations cover remainder)

export interface NonprofitOrg {
  id: string
  name: string
  org_type: NonprofitOrgType
  ein?: string                   // federal EIN for tax receipts
  contact_name: string
  contact_email: string
  contact_phone?: string
  address_city?: string
  address_state?: string
  website?: string
  is_verified: boolean           // admin-verified before referrals go live
  total_referrals: number
  active_sponsored_count: number
  created_at: string
  updated_at: string
}

export interface SponsoredMembership {
  id: string
  member_id: string
  nonprofit_org_id: string
  tier: CommunityAccessTier
  status: SponsoredMembershipStatus
  monthly_subsidy_cents: number  // amount org/foundation covers (e.g. 2900 for $29)
  member_monthly_cost_cents: number  // what senior pays (0 or 500)
  referral_notes?: string        // org's note about why this senior was referred
  navigator_notes?: string       // navigator's intake notes
  navigator_id?: string          // navigator who reviewed/approved
  approved_at?: string
  start_date?: string
  end_date?: string              // null = open-ended
  renewal_date?: string
  created_at: string
  updated_at: string
}

export interface NonprofitReferral {
  id: string
  nonprofit_org_id: string
  // Senior info (before they have a member_id)
  senior_full_name: string
  senior_phone: string
  senior_email?: string
  senior_address_city?: string
  senior_address_state?: string
  senior_dob_year?: number       // approx age, not full DOB
  // Referral context
  tier_requested: CommunityAccessTier
  reason_for_referral: string    // why this person needs subsidised access
  financial_need_confirmed: boolean
  // Status
  status: 'submitted' | 'under_review' | 'approved' | 'enrolled' | 'declined'
  member_id?: string             // set once enrolled
  sponsored_membership_id?: string
  decline_reason?: string
  created_at: string
  updated_at: string
}

export interface NonprofitImpactReport {
  org_id: string
  org_name: string
  period_start: string
  period_end: string
  total_seniors_referred: number
  seniors_enrolled: number
  seniors_active: number
  avg_call_completion_rate: number   // % of scheduled calls completed
  avg_mood_score: number             // 1–10 avg from check-in calls
  community_events_attended: number  // across all sponsored members
  total_subsidy_provided_cents: number
  total_donations_matched_cents: number
}
