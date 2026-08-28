// Trusted Advisor Directory — server-side data access (admin client).
// Phase 98 (M24). Directory browsing, warm introductions, listing applications,
// admin review, and directory-revenue reporting.

import { createAdminClient } from '../supabase/admin'
import type {
  TrustedAdvisorRow,
  AdvisorListingApplicationRow,
  AdvisorConnectionRow,
  TrustedAdvisorInsert,
} from '../../types/database'
import type { AdvisorType, AdvisorListingTier } from '../advisors/types'
import { LISTING_TIERS } from '../advisors/types'

export interface AdvisorFilters {
  advisorType?: string
  state?: string
  acceptingOnly?: boolean
}

/** Featured/premier listings first, then rating, then newest. */
function tierRank(tier: string): number {
  if (tier === 'premier') return 0
  if (tier === 'featured') return 1
  return 2
}

/** Public directory — only active listings. */
export async function getActiveAdvisors(
  filters: AdvisorFilters = {}
): Promise<{ data: TrustedAdvisorRow[] | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    let q = admin.from('trusted_advisors').select('*').eq('listing_status', 'active')
    if (filters.advisorType) q = q.eq('advisor_type', filters.advisorType)
    if (filters.state) q = q.contains('service_states', [filters.state])
    if (filters.acceptingOnly) q = q.eq('accepts_new_clients', true)
    const { data, error } = await q
    if (error) {
      console.error('[data/advisors/getActiveAdvisors]', error)
      return { data: null, error: error.message }
    }
    const sorted = (data ?? []).slice().sort((a, b) => {
      const t = tierRank(a.listing_tier) - tierRank(b.listing_tier)
      if (t !== 0) return t
      const r = (b.avg_rating ?? 0) - (a.avg_rating ?? 0)
      if (r !== 0) return r
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return { data: sorted, error: null }
  } catch (e) {
    console.error('[data/advisors/getActiveAdvisors] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function getAdvisorById(
  id: string
): Promise<{ data: TrustedAdvisorRow | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.from('trusted_advisors').select('*').eq('id', id).maybeSingle()
    if (error) {
      console.error('[data/advisors/getAdvisorById]', error)
      return { data: null, error: error.message }
    }
    if (!data) return { data: null, error: 'Not found' }
    return { data, error: null }
  } catch (e) {
    console.error('[data/advisors/getAdvisorById] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

export interface AdvisorConnectionWithAdvisor extends AdvisorConnectionRow {
  advisor: Pick<
    TrustedAdvisorRow,
    'id' | 'full_name' | 'firm_name' | 'advisor_type' | 'phone' | 'email' | 'city' | 'state'
  > | null
}

export async function getAdvisorConnectionsForMember(
  memberId: string
): Promise<{ data: AdvisorConnectionWithAdvisor[] | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('advisor_connections')
      .select(
        '*, advisor:trusted_advisors(id, full_name, firm_name, advisor_type, phone, email, city, state)'
      )
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[data/advisors/getAdvisorConnectionsForMember]', error)
      return { data: null, error: error.message }
    }
    return { data: (data ?? []) as unknown as AdvisorConnectionWithAdvisor[], error: null }
  } catch (e) {
    console.error('[data/advisors/getAdvisorConnectionsForMember] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

interface RequestIntroInput {
  memberId: string
  advisorId: string
  requestedBy: string | null
  topic: string | null
  memberNote: string | null
  memberPreferredName: string
  advisorName: string
}

/**
 * Creates a warm-introduction request: an advisor_connections row plus a
 * navigator task. We never hand the family a raw phone number — a navigator
 * makes the personal introduction (M17 warm-handoff rule).
 */
export async function requestAdvisorIntroduction(
  input: RequestIntroInput
): Promise<{ data: AdvisorConnectionRow | null; error: string | null }> {
  try {
    const admin = createAdminClient()

    // Guard against duplicate open requests for the same advisor.
    const { data: existing } = await admin
      .from('advisor_connections')
      .select('id, status')
      .eq('member_id', input.memberId)
      .eq('advisor_id', input.advisorId)
      .in('status', ['requested', 'introduced'])
      .maybeSingle()
    if (existing) {
      return { data: null, error: 'You already have an open introduction with this advisor.' }
    }

    const { data: task } = await admin
      .from('navigator_tasks')
      .insert({
        member_id: input.memberId,
        task_type: 'advisor_introduction',
        description: `${input.memberPreferredName} requested a warm introduction to ${input.advisorName}${
          input.topic ? ` about: ${input.topic}` : ''
        }. Review the advisor profile, confirm they are accepting clients, and make a personal introduction.`,
        priority: 'medium',
      })
      .select('id')
      .maybeSingle()

    const { data, error } = await admin
      .from('advisor_connections')
      .insert({
        member_id: input.memberId,
        advisor_id: input.advisorId,
        requested_by: input.requestedBy,
        status: 'requested',
        topic: input.topic,
        member_note: input.memberNote,
        navigator_task_id: task?.id ?? null,
      })
      .select('*')
      .maybeSingle()

    if (error) {
      console.error('[data/advisors/requestAdvisorIntroduction]', error)
      return { data: null, error: error.message }
    }
    return { data, error: null }
  } catch (e) {
    console.error('[data/advisors/requestAdvisorIntroduction] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

interface ListingApplicationInput {
  fullName: string
  firmName: string | null
  advisorType: AdvisorType
  email: string
  phone: string | null
  credentials: string | null
  serviceAreas: string | null
  yearsExperience: string | null
  requestedTier: AdvisorListingTier
  message: string | null
}

export async function submitAdvisorListingApplication(
  input: ListingApplicationInput
): Promise<{ data: AdvisorListingApplicationRow | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('advisor_listing_applications')
      .insert({
        full_name: input.fullName,
        firm_name: input.firmName,
        advisor_type: input.advisorType,
        email: input.email,
        phone: input.phone,
        credentials: input.credentials,
        service_areas: input.serviceAreas,
        years_experience: input.yearsExperience,
        requested_tier: input.requestedTier,
        message: input.message,
        status: 'new',
      })
      .select('*')
      .maybeSingle()
    if (error) {
      console.error('[data/advisors/submitAdvisorListingApplication]', error)
      return { data: null, error: error.message }
    }
    console.log(
      `[STUB][EMAIL] Would notify partnerships team of a new advisor listing application from ${input.fullName} (${input.advisorType}, ${input.requestedTier})`
    )
    return { data, error: null }
  } catch (e) {
    console.error('[data/advisors/submitAdvisorListingApplication] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

// ── Admin ──────────────────────────────────────────────────────────────

export async function getAllAdvisors(): Promise<{
  data: TrustedAdvisorRow[] | null
  error: string | null
}> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('trusted_advisors')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return { data: null, error: error.message }
    return { data: data ?? [], error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function getAdvisorApplications(
  status?: string
): Promise<{ data: AdvisorListingApplicationRow[] | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    let q = admin.from('advisor_listing_applications').select('*').order('created_at', { ascending: false })
    if (status) q = q.eq('status', status)
    const { data, error } = await q
    if (error) return { data: null, error: error.message }
    return { data: data ?? [], error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Approve an application → create an active trusted_advisors listing. */
export async function approveAdvisorApplication(
  applicationId: string,
  reviewedBy: string | null,
  overrides: Partial<TrustedAdvisorInsert> = {}
): Promise<{ data: TrustedAdvisorRow | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data: app, error: appErr } = await admin
      .from('advisor_listing_applications')
      .select('*')
      .eq('id', applicationId)
      .maybeSingle()
    if (appErr) return { data: null, error: appErr.message }
    if (!app) return { data: null, error: 'Application not found' }
    if (app.status === 'approved') return { data: null, error: 'Already approved' }

    const tier = (overrides.listing_tier as string) ?? app.requested_tier
    const fee = LISTING_TIERS.find((t) => t.value === tier)?.annualFee ?? 2400
    const now = new Date()
    const expires = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)

    const { data: advisor, error: advErr } = await admin
      .from('trusted_advisors')
      .insert({
        full_name: app.full_name,
        firm_name: app.firm_name,
        advisor_type: app.advisor_type,
        credentials: app.credentials ? [app.credentials] : [],
        listing_tier: tier,
        listing_fee_annual: fee,
        listing_status: 'active',
        listing_started_at: now.toISOString(),
        listing_expires_at: expires.toISOString(),
        vetted_at: now.toISOString(),
        vetted_by: reviewedBy,
        thrive_verified: true,
        email: app.email,
        phone: app.phone,
        ...overrides,
      })
      .select('*')
      .maybeSingle()
    if (advErr) {
      console.error('[data/advisors/approveAdvisorApplication] advisor insert', advErr)
      return { data: null, error: advErr.message }
    }

    await admin
      .from('advisor_listing_applications')
      .update({ status: 'approved', reviewed_at: now.toISOString(), reviewed_by: reviewedBy })
      .eq('id', applicationId)

    return { data: advisor, error: null }
  } catch (e) {
    console.error('[data/advisors/approveAdvisorApplication] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function setAdvisorApplicationStatus(
  applicationId: string,
  status: 'reviewing' | 'rejected',
  reviewedBy: string | null,
  reviewNotes: string | null
): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('advisor_listing_applications')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewedBy,
        review_notes: reviewNotes,
      })
      .eq('id', applicationId)
    if (error) return { error: error.message }
    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

export interface DirectoryRevenueSummary {
  activeListings: number
  annualisedRevenue: number
  byTier: { tier: string; count: number; revenue: number }[]
  expiringSoon: number
}

/** Sum of annual listing fees across active listings — the M24 revenue line. */
export async function getDirectoryRevenueSummary(): Promise<{
  data: DirectoryRevenueSummary | null
  error: string | null
}> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('trusted_advisors')
      .select('listing_tier, listing_fee_annual, listing_expires_at')
      .eq('listing_status', 'active')
    if (error) return { data: null, error: error.message }
    const rows = data ?? []
    const tiers = new Map<string, { count: number; revenue: number }>()
    let total = 0
    let expiringSoon = 0
    const cutoff = Date.now() + 45 * 24 * 60 * 60 * 1000
    for (const r of rows) {
      total += Number(r.listing_fee_annual) || 0
      const t = tiers.get(r.listing_tier) ?? { count: 0, revenue: 0 }
      t.count += 1
      t.revenue += Number(r.listing_fee_annual) || 0
      tiers.set(r.listing_tier, t)
      if (r.listing_expires_at && new Date(r.listing_expires_at).getTime() < cutoff) expiringSoon += 1
    }
    return {
      data: {
        activeListings: rows.length,
        annualisedRevenue: total,
        byTier: [...tiers.entries()].map(([tier, v]) => ({ tier, ...v })),
        expiringSoon,
      },
      error: null,
    }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

interface ReviewInput {
  advisorId: string
  memberId: string
  connectionId: string | null
  rating: number
  reviewText: string | null
}

export async function submitAdvisorReview(
  input: ReviewInput
): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('advisor_reviews').upsert(
      {
        advisor_id: input.advisorId,
        member_id: input.memberId,
        connection_id: input.connectionId,
        rating: input.rating,
        review_text: input.reviewText,
        is_published: true,
      },
      { onConflict: 'advisor_id,member_id' }
    )
    if (error) {
      console.error('[data/advisors/submitAdvisorReview]', error)
      return { error: error.message }
    }

    // Recompute the advisor's rating aggregate.
    const { data: reviews } = await admin
      .from('advisor_reviews')
      .select('rating')
      .eq('advisor_id', input.advisorId)
      .eq('is_published', true)
    const list = reviews ?? []
    const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : null
    await admin
      .from('trusted_advisors')
      .update({ avg_rating: avg, total_reviews: list.length })
      .eq('id', input.advisorId)

    return { error: null }
  } catch (e) {
    console.error('[data/advisors/submitAdvisorReview] Unexpected error:', e)
    return { error: e instanceof Error ? e.message : String(e) }
  }
}
