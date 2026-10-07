// Data access layer for agency brand configuration (Phase 60 — M19 White Label).
// Enables agencies to customize their display name, colors, and logo while ThriveAtHome
// branding is always visible ("Powered by ThriveAtHome" cannot be removed).
import { createAdminClient } from '../supabase/admin'
import type { Tables } from '@/types/database'
type BrandConfigRow = Tables<'brand_configs'>
type BrandConfigInsert = any
type BrandConfigUpdate = any

type Result<T> = Promise<{ data: T | null; error: string | null }>

/** Get brand config for a specific agency. Returns null if none configured. */
export async function getBrandConfigForAgency(agencyId: string): Result<BrandConfigRow> {
  const admin = createAdminClient()
  const { data, error } = await (admin
    .from('brand_configs')
    .select('*')
    .eq('agency_id', agencyId)
    .eq('is_active', true)
    .maybeSingle() as unknown as Promise<{ data: BrandConfigRow | null; error: { message: string } | null }>)
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Get brand config for the agency linked to an agency_admin auth user. */
export async function getBrandConfigForAdmin(authUserId: string): Result<BrandConfigRow> {
  const admin = createAdminClient()
  const { data: fm, error: fmErr } = await (admin
    .from('family_members')
    .select('agency_id')
    .eq('supabase_auth_id', authUserId)
    .maybeSingle() as unknown as Promise<{ data: { agency_id: string | null } | null; error: { message: string } | null }>)
  if (fmErr) return { data: null, error: fmErr.message }
  if (!fm?.agency_id) return { data: null, error: 'No agency linked' }

  return getBrandConfigForAgency(fm.agency_id)
}

/** Get brand config by member_id — checks if member has an agency referral with a brand config. */
export async function getBrandConfigForMember(memberId: string): Result<BrandConfigRow> {
  const admin = createAdminClient()
  // Find the most recent accepted agency referral for this member
  const { data: referral, error: refErr } = await (admin
    .from('agency_referrals')
    .select('agency_id')
    .eq('member_id', memberId)
    .eq('status', 'accepted')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle() as unknown as Promise<{ data: { agency_id: string | null } | null; error: { message: string } | null }>)
  if (refErr) return { data: null, error: refErr.message }
  if (!referral?.agency_id) return { data: null, error: 'No agency referral' }

  return getBrandConfigForAgency(referral.agency_id)
}

/** Create or update (upsert) brand config for an agency. Enforces powered_by_label is never empty. */
export async function upsertBrandConfig(
  agencyId: string,
  updates: BrandConfigInsert | BrandConfigUpdate
): Result<BrandConfigRow> {
  const admin = createAdminClient()

  // Brand integrity: powered_by_label is always "Powered by ThriveAtHome"
  const safeUpdates = {
    ...updates,
    agency_id: agencyId,
    powered_by_label: 'Powered by ThriveAtHome',
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await ((admin as unknown as { from: (t: string) => { upsert: (v: unknown, o: unknown) => { select: () => { maybeSingle: () => Promise<{ data: BrandConfigRow | null; error: { message: string } | null }> } } } })
    .from('brand_configs')
    .upsert(safeUpdates, { onConflict: 'agency_id' })
    .select()
    .maybeSingle())
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Get all brand configs (admin only). */
export async function getAllBrandConfigs(): Promise<{ data: BrandConfigRow[]; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin
    .from('brand_configs')
    .select('*')
    .order('created_at', { ascending: false }) as unknown as Promise<{ data: BrandConfigRow[] | null; error: { message: string } | null }>)
  if (error) return { data: [], error: error.message }
  return { data: data ?? [], error: null }
}
