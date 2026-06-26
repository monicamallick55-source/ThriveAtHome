// Data layer for community organization portal (M20, Phase 63).
import { createAdminClient } from '@/lib/supabase/admin'

export interface CommunityOrgRow {
  id: string
  created_at: string
  updated_at: string
  org_name: string
  org_type: string
  slug: string | null
  contact_name: string
  contact_email: string
  contact_phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  website_url: string | null
  description: string | null
  service_area_description: string | null
  member_count: number
  is_active: boolean
  annual_dues_standard_cents: number
  annual_dues_sliding_low_cents: number
  annual_dues_sliding_mid_cents: number
  dues_description: string | null
}

export interface OrgProgramRow {
  id: string
  created_at: string
  org_id: string
  program_name: string
  description: string | null
  program_type: string
  is_active: boolean
  participants_count: number
  volunteers_needed: number
  volunteers_enrolled: number
  schedule_description: string | null
  contact_name: string | null
  contact_phone: string | null
}

export interface MemberNeedRow {
  id: string
  created_at: string
  member_id: string
  org_id: string
  need_type: string
  title: string
  description: string
  urgency: string
  preferred_date: string | null
  preferred_time: string | null
  status: string
  claimed_by_volunteer_id: string | null
  claimed_at: string | null
  fulfilled_at: string | null
  fulfillment_notes: string | null
  member?: { full_name: string; preferred_name: string; phone_number: string }
}

export interface OrgMembershipRow {
  id: string
  created_at: string
  member_id: string
  org_id: string
  membership_tier: string
  annual_dues_paid_cents: number
  dues_paid_date: string | null
  membership_year: number
  is_active: boolean
  notes: string | null
  member?: { full_name: string; preferred_name: string; phone_number: string }
}

export interface OrgStats {
  member_count: number
  program_count: number
  open_needs_count: number
  active_memberships_count: number
  dues_collected_cents: number
}

/** Returns the community org linked to the given auth user's family_members.org_id. */
export async function getOrgForAdmin(authUserId: string): Promise<{ data: CommunityOrgRow | null; error: string | null }> {
  const admin = createAdminClient()
  const { data: fm, error: fmError } = await admin
    .from('family_members')
    .select('org_id')
    .eq('supabase_auth_id', authUserId)
    .maybeSingle()
  if (fmError) return { data: null, error: fmError.message }
  if (!fm?.org_id) return { data: null, error: 'No org linked' }

  const { data, error } = await (admin.from as any)('community_orgs')
    .select('*')
    .eq('id', fm.org_id)
    .maybeSingle()
  if (error) return { data: null, error: error.message }
  return { data: data as unknown as CommunityOrgRow | null, error: null }
}

/** Returns all orgs (admin use). */
export async function getAllOrgs(): Promise<{ data: CommunityOrgRow[]; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('community_orgs')
    .select('*')
    .order('org_name')
  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as unknown as CommunityOrgRow[], error: null }
}

/** Returns programs for the given org. */
export async function getOrgPrograms(orgId: string): Promise<{ data: OrgProgramRow[]; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('org_programs')
    .select('*')
    .eq('org_id', orgId)
    .order('program_name')
  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as unknown as OrgProgramRow[], error: null }
}

/** Creates a new org program. */
export async function createOrgProgram(
  orgId: string,
  input: {
    program_name: string
    description?: string
    program_type: string
    volunteers_needed?: number
    schedule_description?: string
    contact_name?: string
    contact_phone?: string
  }
): Promise<{ data: OrgProgramRow | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('org_programs')
    .insert({ org_id: orgId, ...input })
    .select()
    .single()
  if (error) return { data: null, error: error.message }
  return { data: data as unknown as OrgProgramRow, error: null }
}

/** Creates a member need on behalf of a member. */
export async function createMemberNeed(
  memberId: string,
  orgId: string,
  input: {
    need_type: string
    title: string
    description: string
    urgency: string
    preferred_date?: string
    preferred_time?: string
  }
): Promise<{ data: MemberNeedRow | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('member_needs')
    .insert({ member_id: memberId, org_id: orgId, ...input })
    .select('*, member:members(full_name, preferred_name, phone_number)')
    .single()
  if (error) return { data: null, error: error.message }
  return { data: data as unknown as MemberNeedRow, error: null }
}

/** Returns member needs for the given org, sorted by urgency then date. */
export async function getMemberNeedsForOrg(orgId: string): Promise<{ data: MemberNeedRow[]; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('member_needs')
    .select('*, member:members(full_name, preferred_name, phone_number)')
    .eq('org_id', orgId)
    .order('urgency', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as unknown as MemberNeedRow[], error: null }
}

/** Updates a member need's status (claim / fulfill / cancel). */
export async function updateMemberNeedStatus(
  needId: string,
  status: string,
  opts?: { claimed_by_volunteer_id?: string; fulfillment_notes?: string }
): Promise<{ data: MemberNeedRow | null; error: string | null }> {
  const admin = createAdminClient()
  const update: Record<string, unknown> = { status }
  if (status === 'claimed') {
    update.claimed_at = new Date().toISOString()
    if (opts?.claimed_by_volunteer_id) update.claimed_by_volunteer_id = opts.claimed_by_volunteer_id
  }
  if (status === 'fulfilled') {
    update.fulfilled_at = new Date().toISOString()
    if (opts?.fulfillment_notes) update.fulfillment_notes = opts.fulfillment_notes
  }
  const { data, error } = await (admin.from as any)('member_needs')
    .update(update)
    .eq('id', needId)
    .select()
    .single()
  if (error) return { data: null, error: error.message }
  return { data: data as unknown as MemberNeedRow, error: null }
}

/** Returns org memberships for the current year, with member details. */
export async function getOrgMemberships(orgId: string, year?: number): Promise<{ data: OrgMembershipRow[]; error: string | null }> {
  const admin = createAdminClient()
  const membershipYear = year ?? new Date().getFullYear()
  const { data, error } = await (admin.from as any)('org_memberships')
    .select('*, member:members(full_name, preferred_name, phone_number)')
    .eq('org_id', orgId)
    .eq('membership_year', membershipYear)
    .order('created_at', { ascending: false })
  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as unknown as OrgMembershipRow[], error: null }
}

/** Creates or updates an org membership (dues payment, tier change). */
export async function upsertOrgMembership(
  memberId: string,
  orgId: string,
  input: {
    membership_tier: string
    annual_dues_paid_cents: number
    dues_paid_date?: string
    notes?: string
    membership_year?: number
  }
): Promise<{ data: OrgMembershipRow | null; error: string | null }> {
  const admin = createAdminClient()
  const year = input.membership_year ?? new Date().getFullYear()
  const { data, error } = await (admin.from as any)('org_memberships')
    .upsert({
      member_id: memberId,
      org_id: orgId,
      membership_tier: input.membership_tier,
      annual_dues_paid_cents: input.annual_dues_paid_cents,
      dues_paid_date: input.dues_paid_date ?? null,
      notes: input.notes ?? null,
      membership_year: year,
      is_active: true,
    }, { onConflict: 'member_id,org_id,membership_year' })
    .select()
    .single()
  if (error) return { data: null, error: error.message }
  return { data: data as unknown as OrgMembershipRow, error: null }
}

export interface OrgMembershipTierRow {
  id: string
  created_at: string
  org_id: string
  tier_name: string
  amount_cents: number
  description: string | null
  is_active: boolean
  sort_order: number
}

/** Updates the preset fee amounts and dues description on a community org. */
export async function updateOrgFeeSettings(
  orgId: string,
  input: {
    annual_dues_standard_cents: number
    annual_dues_sliding_low_cents: number
    annual_dues_sliding_mid_cents: number
    dues_description: string | null
  }
): Promise<{ data: CommunityOrgRow | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('community_orgs')
    .update(input)
    .eq('id', orgId)
    .select()
    .single()
  if (error) return { data: null, error: error.message }
  return { data: data as unknown as CommunityOrgRow, error: null }
}

/** Returns custom membership tiers for an org. */
export async function getOrgMembershipTiers(orgId: string): Promise<{ data: OrgMembershipTierRow[]; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('org_membership_tiers')
    .select('*')
    .eq('org_id', orgId)
    .order('sort_order')
    .order('created_at')
  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as unknown as OrgMembershipTierRow[], error: null }
}

/** Creates a custom membership tier for an org. */
export async function createOrgMembershipTier(
  orgId: string,
  input: { tier_name: string; amount_cents: number; description?: string }
): Promise<{ data: OrgMembershipTierRow | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('org_membership_tiers')
    .insert({ org_id: orgId, ...input })
    .select()
    .single()
  if (error) return { data: null, error: error.message }
  return { data: data as unknown as OrgMembershipTierRow, error: null }
}

export interface OrgDonationRow {
  id: string
  created_at: string
  org_id: string
  donor_name: string
  donor_email: string | null
  amount_cents: number
  donation_date: string
  payment_method: string
  notes: string | null
  is_anonymous: boolean
}

/** Returns recent donations for an org. */
export async function getOrgDonations(orgId: string, limit = 100): Promise<{ data: OrgDonationRow[]; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('org_donations')
    .select('*')
    .eq('org_id', orgId)
    .order('donation_date', { ascending: false })
    .limit(limit)
  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as unknown as OrgDonationRow[], error: null }
}

/** Records a new donation for an org. */
export async function createOrgDonation(
  orgId: string,
  input: {
    donor_name: string
    donor_email?: string | null
    amount_cents: number
    donation_date: string
    payment_method: string
    notes?: string | null
    is_anonymous?: boolean
  }
): Promise<{ data: OrgDonationRow | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('org_donations')
    .insert({ org_id: orgId, ...input })
    .select()
    .single()
  if (error) return { data: null, error: error.message }
  return { data: data as unknown as OrgDonationRow, error: null }
}

/** Returns member email addresses for an org (for bulk email). */
export async function getOrgMemberEmails(orgId: string): Promise<{ data: { full_name: string; email: string }[]; error: string | null }> {
  const admin = createAdminClient()
  // Join org_memberships → members → auth emails via supabase_auth_id
  const { data: memberships, error } = await (admin.from as any)('org_memberships')
    .select('member_id')
    .eq('org_id', orgId)
    .eq('is_active', true)
  if (error) return { data: [], error: error.message }
  if (!memberships?.length) return { data: [], error: null }

  const memberIds = (memberships as { member_id: string }[]).map(m => m.member_id)
  const { data: members, error: mErr } = await admin
    .from('members')
    .select('full_name')
    .in('id', memberIds)
  if (mErr) return { data: [], error: mErr.message }

  // For now return members' names; real emails would come from family_members → supabase_auth_id
  return { data: (members ?? []).map((m: { full_name: string }) => ({ full_name: m.full_name, email: '' })), error: null }
}

/** Returns a public-facing org by slug (no auth required). */
export async function getPublicOrgBySlug(slug: string): Promise<{ data: CommunityOrgRow | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('community_orgs')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  if (error) return { data: null, error: error.message }
  return { data: data as unknown as CommunityOrgRow | null, error: null }
}

/** Returns public programs for an org (no auth). */
export async function getPublicOrgPrograms(orgId: string): Promise<{ data: OrgProgramRow[]; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('org_programs')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as unknown as OrgProgramRow[], error: null }
}

/** Returns aggregate stats for an org. */
export async function getOrgStats(orgId: string): Promise<{ data: OrgStats; error: string | null }> {
  const admin = createAdminClient()
  const currentYear = new Date().getFullYear()

  const [orgRes, programsRes, needsRes, membershipsRes] = await Promise.all([
    (admin.from as any)('community_orgs').select('member_count').eq('id', orgId).maybeSingle(),
    (admin.from as any)('org_programs').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('is_active', true),
    (admin.from as any)('member_needs').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'open'),
    (admin.from as any)('org_memberships').select('annual_dues_paid_cents').eq('org_id', orgId).eq('membership_year', currentYear).eq('is_active', true),
  ])

  const duesCollected = ((membershipsRes.data ?? []) as OrgMembershipRow[])
    .reduce((sum, m) => sum + (m.annual_dues_paid_cents ?? 0), 0)

  return {
    data: {
      member_count: (orgRes.data as any)?.member_count ?? 0,
      program_count: programsRes.count ?? 0,
      open_needs_count: needsRes.count ?? 0,
      active_memberships_count: (membershipsRes.data ?? []).length,
      dues_collected_cents: duesCollected,
    },
    error: null,
  }
}
