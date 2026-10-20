// lib/nonprofit/db.ts
// Database helpers for nonprofit orgs, referrals, and sponsored memberships

import { createAdminClient } from '@/lib/supabase/admin'
import type {
  NonprofitOrg,
  NonprofitReferral,
  SponsoredMembership,
  NonprofitImpactReport,
  CommunityAccessTier,
} from './types'

// ─── NONPROFIT ORG CRUD ───────────────────────────────────────────────────────

export async function getNonprofitOrg(orgId: string): Promise<NonprofitOrg | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('nonprofit_orgs')
    .select('*')
    .eq('id', orgId)
    .maybeSingle()
  return data as NonprofitOrg | null
}

export async function getNonprofitOrgByEmail(email: string): Promise<NonprofitOrg | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('nonprofit_orgs')
    .select('*')
    .eq('contact_email', email.toLowerCase())
    .maybeSingle()
  return data as NonprofitOrg | null
}

export async function createNonprofitOrg(params: {
  name: string
  org_type: string
  ein?: string
  contact_name: string
  contact_email: string
  contact_phone?: string
  address_city?: string
  address_state?: string
  website?: string
}): Promise<{ data: NonprofitOrg | null; error: string | null }> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('nonprofit_orgs')
    .insert({
      ...params,
      contact_email: params.contact_email.toLowerCase(),
      is_verified: false,
      total_referrals: 0,
      active_sponsored_count: 0,
    })
    .select()
    .maybeSingle()
  if (error) return { data: null, error: error.message }
  return { data: data as NonprofitOrg, error: null }
}

export async function getAllNonprofitOrgs(): Promise<NonprofitOrg[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('nonprofit_orgs')
    .select('*')
    .order('created_at', { ascending: false })
  return (data ?? []) as NonprofitOrg[]
}

// ─── REFERRALS ────────────────────────────────────────────────────────────────

export async function createReferral(params: {
  nonprofit_org_id: string
  senior_full_name: string
  senior_phone: string
  senior_email?: string
  senior_address_city?: string
  senior_address_state?: string
  senior_dob_year?: number
  tier_requested: CommunityAccessTier
  reason_for_referral: string
  financial_need_confirmed: boolean
}): Promise<{ data: NonprofitReferral | null; error: string | null }> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('nonprofit_referrals')
    .insert({ ...params, status: 'submitted' })
    .select()
    .maybeSingle()
  if (error) return { data: null, error: error.message }

  // Increment org's referral count
  await supabase.rpc('increment_nonprofit_referrals', { org_id: params.nonprofit_org_id })

  return { data: data as NonprofitReferral, error: null }
}

export async function getReferralsForOrg(orgId: string): Promise<NonprofitReferral[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('nonprofit_referrals')
    .select('*')
    .eq('nonprofit_org_id', orgId)
    .order('created_at', { ascending: false })
  return (data ?? []) as NonprofitReferral[]
}

export async function getPendingReferrals(): Promise<NonprofitReferral[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('nonprofit_referrals')
    .select('*, nonprofit_orgs(name, org_type)')
    .in('status', ['submitted', 'under_review'])
    .order('created_at', { ascending: true }) // oldest first
  return (data ?? []) as NonprofitReferral[]
}

export async function updateReferralStatus(
  referralId: string,
  status: NonprofitReferral['status'],
  extra?: {
    member_id?: string
    sponsored_membership_id?: string
    decline_reason?: string
  }
): Promise<{ error: string | null }> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('nonprofit_referrals')
    .update({ status, ...extra, updated_at: new Date().toISOString() })
    .eq('id', referralId)
  return { error: error?.message ?? null }
}

// ─── SPONSORED MEMBERSHIPS ────────────────────────────────────────────────────

/**
 * Enrol a referred senior into a Community Access membership.
 * Call this after the referral is approved and the senior has a member_id.
 */
export async function enrollSponsoredMembership(params: {
  member_id: string
  nonprofit_org_id: string
  tier: CommunityAccessTier
  referral_notes?: string
  navigator_notes?: string
  navigator_id?: string
  end_date?: string
}): Promise<{ data: SponsoredMembership | null; error: string | null }> {
  const supabase = createAdminClient()

  // Subsidised tier amounts
  const monthlyCost = params.tier === 'community_free' ? 0 : 500       // $0 or $5
  const subsidy = params.tier === 'community_free' ? 2900 : 2400        // $29 or $24

  const today = new Date().toISOString().split('T')[0]
  const renewalDate = new Date()
  renewalDate.setMonth(renewalDate.getMonth() + 1)

  const { data, error } = await supabase
    .from('sponsored_memberships')
    .insert({
      member_id: params.member_id,
      nonprofit_org_id: params.nonprofit_org_id,
      tier: params.tier,
      status: 'active',
      monthly_subsidy_cents: subsidy,
      member_monthly_cost_cents: monthlyCost,
      referral_notes: params.referral_notes ?? null,
      navigator_notes: params.navigator_notes ?? null,
      navigator_id: params.navigator_id ?? null,
      approved_at: new Date().toISOString(),
      start_date: today,
      end_date: params.end_date ?? null,
      renewal_date: renewalDate.toISOString().split('T')[0],
    })
    .select()
    .maybeSingle()

  if (error) return { data: null, error: error.message }

  // Update member's plan to community tier
  await supabase
    .from('members')
    .update({ plan: params.tier })
    .eq('id', params.member_id)

  // Increment org's active count
  await supabase.rpc('increment_nonprofit_active', { org_id: params.nonprofit_org_id })

  return { data: data as SponsoredMembership, error: null }
}

export async function getSponsoredMembershipsForOrg(orgId: string): Promise<SponsoredMembership[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('sponsored_memberships')
    .select('*, members(preferred_name, full_name, phone_number, created_at)')
    .eq('nonprofit_org_id', orgId)
    .order('created_at', { ascending: false })
  return (data ?? []) as SponsoredMembership[]
}

export async function getMemberSponsoredMembership(memberId: string): Promise<SponsoredMembership | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('sponsored_memberships')
    .select('*')
    .eq('member_id', memberId)
    .eq('status', 'active')
    .maybeSingle()
  return data as SponsoredMembership | null
}

// ─── IMPACT REPORTING ─────────────────────────────────────────────────────────

export async function getNonprofitImpactReport(
  orgId: string,
  periodStart: string,
  periodEnd: string
): Promise<NonprofitImpactReport | null> {
  const supabase = createAdminClient()

  const org = await getNonprofitOrg(orgId)
  if (!org) return null

  // Get sponsored memberships for this org
  const { data: memberships } = await supabase
    .from('sponsored_memberships')
    .select('member_id, monthly_subsidy_cents, status')
    .eq('nonprofit_org_id', orgId)

  const memberIds = (memberships ?? []).map((m: any) => m.member_id)
  const activeMemberships = (memberships ?? []).filter((m: any) => m.status === 'active')

  if (memberIds.length === 0) {
    return {
      org_id: orgId,
      org_name: org.name,
      period_start: periodStart,
      period_end: periodEnd,
      total_seniors_referred: org.total_referrals,
      seniors_enrolled: memberships?.length ?? 0,
      seniors_active: activeMemberships.length,
      avg_call_completion_rate: 0,
      avg_mood_score: 0,
      community_events_attended: 0,
      total_subsidy_provided_cents: 0,
      total_donations_matched_cents: 0,
    }
  }

  // Call completion rate
  const { data: calls } = await supabase
    .from('check_in_calls')
    .select('status, mood_score, member_id')
    .in('member_id', memberIds)
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd)

  const completedCalls = (calls ?? []).filter((c: any) => c.status === 'completed')
  const callCompletionRate = calls && calls.length > 0
    ? Math.round((completedCalls.length / calls.length) * 100)
    : 0

  const moodScores = completedCalls
    .map((c: any) => c.mood_score)
    .filter((s: any) => s !== null && s !== undefined)
  const avgMood = moodScores.length > 0
    ? Math.round((moodScores.reduce((a: number, b: number) => a + b, 0) / moodScores.length) * 10) / 10
    : 0

  // Community event attendance
  const { count: eventsAttended } = await supabase
    .from('event_rsvps')
    .select('*', { count: 'exact', head: true })
    .in('member_id', memberIds)
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd)

  // Total subsidy
  const totalSubsidy = activeMemberships.reduce(
    (sum: number, m: any) => sum + (m.monthly_subsidy_cents ?? 0),
    0
  )

  return {
    org_id: orgId,
    org_name: org.name,
    period_start: periodStart,
    period_end: periodEnd,
    total_seniors_referred: org.total_referrals,
    seniors_enrolled: memberships?.length ?? 0,
    seniors_active: activeMemberships.length,
    avg_call_completion_rate: callCompletionRate,
    avg_mood_score: avgMood,
    community_events_attended: eventsAttended ?? 0,
    total_subsidy_provided_cents: totalSubsidy,
    total_donations_matched_cents: 0, // populated when donation matching is wired
  }
}
