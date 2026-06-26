// Data access layer for home care agency portal (Phase 59 — M19).
// These tables are not yet in Supabase generated types, so all queries cast through unknown.
import { createAdminClient } from '../supabase/admin'
import type { CareAgencyRow, CareWorkerRow, CareVisitRow, AgencyReferralRow, AgencyLocationRow, AgencyLocationInsert, AgencyLocationUpdate } from '@/types/database'

export type { CareAgencyRow, CareWorkerRow, CareVisitRow, AgencyReferralRow, AgencyLocationRow }

export interface CareVisitWithDetails extends CareVisitRow {
  care_worker?: { full_name: string; worker_role: string } | null
  member?: { preferred_name: string; full_name: string; address: string | null; phone_number?: string | null } | null
}

type SupabaseResult<T> = Promise<{ data: T | null; error: { message: string } | null }>
type SupabaseListResult<T> = Promise<{ data: T[] | null; error: { message: string } | null }>

/** Get the agency linked to an agency_admin auth user. */
export async function getAgencyForAdmin(authUserId: string): Promise<{ data: CareAgencyRow | null; error: string | null }> {
  const admin = createAdminClient()
  const { data: fm, error: fmErr } = await (admin
    .from('family_members')
    .select('agency_id')
    .eq('supabase_auth_id', authUserId)
    .maybeSingle() as unknown as SupabaseResult<{ agency_id: string | null }>)
  if (fmErr) return { data: null, error: fmErr.message }
  if (!fm?.agency_id) return { data: null, error: 'No agency linked' }

  const { data, error } = await (admin
    .from('care_agencies')
    .select('*')
    .eq('id', fm.agency_id)
    .maybeSingle() as unknown as SupabaseResult<CareAgencyRow>)
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Get all care workers for an agency. */
export async function getCareWorkersForAgency(agencyId: string): Promise<{ data: CareWorkerRow[] | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin
    .from('care_workers')
    .select('*')
    .eq('agency_id', agencyId)
    .order('full_name') as unknown as SupabaseListResult<CareWorkerRow>)
  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

/** Get upcoming visits for an agency (next 7 days). */
export async function getUpcomingVisitsForAgency(agencyId: string): Promise<{ data: CareVisitWithDetails[] | null; error: string | null }> {
  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data, error } = await (admin
    .from('care_visits')
    .select('*, care_worker:care_workers(full_name, worker_role), member:members(preferred_name, full_name, address)')
    .eq('agency_id', agencyId)
    .gte('scheduled_date', today)
    .lte('scheduled_date', nextWeek)
    .in('status', ['scheduled', 'in_progress'])
    .order('scheduled_date')
    .order('scheduled_start_time') as unknown as SupabaseListResult<CareVisitWithDetails>)
  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

/** Get recent visits for an agency (last 30 days). */
export async function getRecentVisitsForAgency(agencyId: string): Promise<{ data: CareVisitWithDetails[] | null; error: string | null }> {
  const admin = createAdminClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data, error } = await (admin
    .from('care_visits')
    .select('*, care_worker:care_workers(full_name, worker_role), member:members(preferred_name, full_name, address)')
    .eq('agency_id', agencyId)
    .gte('scheduled_date', thirtyDaysAgo)
    .order('scheduled_date', { ascending: false })
    .limit(50) as unknown as SupabaseListResult<CareVisitWithDetails>)
  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

/** Get today's visits for a care worker. */
export async function getTodaysVisitsForWorker(careWorkerId: string): Promise<{ data: CareVisitWithDetails[] | null; error: string | null }> {
  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await (admin
    .from('care_visits')
    .select('*, member:members(preferred_name, full_name, address, phone_number)')
    .eq('care_worker_id', careWorkerId)
    .eq('scheduled_date', today)
    .order('scheduled_start_time') as unknown as SupabaseListResult<CareVisitWithDetails>)
  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

/** Get a care worker row by their Supabase auth ID. */
export async function getCareWorkerByAuthId(authUserId: string): Promise<{ data: CareWorkerRow | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin
    .from('care_workers')
    .select('*')
    .eq('supabase_auth_id', authUserId)
    .maybeSingle() as unknown as SupabaseResult<CareWorkerRow>)
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Check a care worker into a visit. */
export async function checkInVisit(visitId: string, careWorkerId: string): Promise<{ data: CareVisitRow | null; error: string | null }> {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tbl = (admin as any).from('care_visits')
  const { data, error } = await tbl
    .update({ status: 'in_progress', actual_check_in_at: new Date().toISOString() })
    .eq('id', visitId)
    .eq('care_worker_id', careWorkerId)
    .select()
    .maybeSingle() as { data: CareVisitRow | null; error: { message: string } | null }
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Check a care worker out of a visit and compute duration. */
export async function checkOutVisit(visitId: string, careWorkerId: string, notes?: string): Promise<{ data: CareVisitRow | null; error: string | null }> {
  const admin = createAdminClient()
  const { data: existing } = await (admin
    .from('care_visits')
    .select('actual_check_in_at')
    .eq('id', visitId)
    .maybeSingle() as unknown as SupabaseResult<{ actual_check_in_at: string | null }>)

  const checkOutAt = new Date().toISOString()
  let durationMinutes: number | null = null
  let billableHours: number | null = null
  if (existing?.actual_check_in_at) {
    const mins = Math.round((new Date(checkOutAt).getTime() - new Date(existing.actual_check_in_at).getTime()) / 60000)
    durationMinutes = mins
    billableHours = Math.round((mins / 60) * 4) / 4 // Round to nearest 0.25h
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tbl = (admin as any).from('care_visits')
  const { data, error } = await tbl
    .update({
      status: 'completed',
      actual_check_out_at: checkOutAt,
      duration_minutes: durationMinutes,
      billable_hours: billableHours,
      care_worker_notes: notes ?? null,
    })
    .eq('id', visitId)
    .eq('care_worker_id', careWorkerId)
    .select()
    .maybeSingle() as { data: CareVisitRow | null; error: { message: string } | null }
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Create a new care visit. */
export async function createCareVisit(input: {
  agency_id: string
  care_worker_id: string
  member_id: string
  scheduled_date: string
  scheduled_start_time: string
  scheduled_end_time: string
  visit_type: string
  billing_code?: string
}): Promise<{ data: CareVisitRow | null; error: string | null }> {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tbl = (admin as any).from('care_visits')
  const { data, error } = await tbl
    .insert({
      agency_id: input.agency_id,
      care_worker_id: input.care_worker_id,
      member_id: input.member_id,
      scheduled_date: input.scheduled_date,
      scheduled_start_time: input.scheduled_start_time,
      scheduled_end_time: input.scheduled_end_time,
      visit_type: input.visit_type,
      billing_code: input.billing_code ?? null,
      status: 'scheduled',
    })
    .select()
    .maybeSingle() as { data: CareVisitRow | null; error: { message: string } | null }
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Get billable hours report for an agency (grouped by worker). */
export async function getBillableHoursReport(agencyId: string, startDate: string, endDate: string): Promise<{
  data: Array<{ worker_id: string; worker_name: string; total_hours: number; visit_count: number; uninvoiced_hours: number }> | null
  error: string | null
}> {
  const admin = createAdminClient()
  const { data, error } = await (admin
    .from('care_visits')
    .select('care_worker_id, billable_hours, invoiced, care_workers!inner(full_name)')
    .eq('agency_id', agencyId)
    .eq('status', 'completed')
    .gte('scheduled_date', startDate)
    .lte('scheduled_date', endDate) as unknown as SupabaseListResult<{
      care_worker_id: string
      billable_hours: number | null
      invoiced: boolean
      care_workers: { full_name: string }
    }>)
  if (error) return { data: null, error: error.message }

  const map = new Map<string, { worker_id: string; worker_name: string; total_hours: number; visit_count: number; uninvoiced_hours: number }>()
  for (const row of data ?? []) {
    const wName = row.care_workers?.full_name ?? 'Unknown'
    const existing = map.get(row.care_worker_id) ?? { worker_id: row.care_worker_id, worker_name: wName, total_hours: 0, visit_count: 0, uninvoiced_hours: 0 }
    existing.total_hours += row.billable_hours ?? 0
    existing.visit_count += 1
    if (!row.invoiced) existing.uninvoiced_hours += row.billable_hours ?? 0
    map.set(row.care_worker_id, existing)
  }
  return { data: Array.from(map.values()).sort((a, b) => b.total_hours - a.total_hours), error: null }
}

/** Get all active care agencies (admin + navigator use). */
export async function getCareAgencies(): Promise<{ data: CareAgencyRow[] | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin
    .from('care_agencies')
    .select('*')
    .eq('status', 'active')
    .order('name') as unknown as SupabaseListResult<CareAgencyRow>)
  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

/** Get members served by an agency — includes accepted referrals AND any member with a care visit. */
export async function getMembersForAgency(agencyId: string): Promise<{
  data: Array<{ id: string; preferred_name: string; full_name: string; last_visit_date: string | null; assigned_worker: string | null }> | null
  error: string | null
}> {
  const admin = createAdminClient()

  // Source 1: members with care visits
  const { data: visitData, error: visitError } = await (admin
    .from('care_visits')
    .select('member_id, scheduled_date, care_workers!inner(full_name), members!inner(preferred_name, full_name)')
    .eq('agency_id', agencyId)
    .order('scheduled_date', { ascending: false }) as unknown as SupabaseListResult<{
      member_id: string
      scheduled_date: string
      care_workers: { full_name: string }
      members: { preferred_name: string; full_name: string }
    }>)
  if (visitError) return { data: null, error: visitError.message }

  // Source 2: members with accepted referrals (no visits yet — e.g. newly onboarded)
  const { data: referralData, error: referralError } = await (admin
    .from('agency_referrals')
    .select('member_id, members!inner(preferred_name, full_name)')
    .eq('agency_id', agencyId)
    .eq('status', 'accepted') as unknown as SupabaseListResult<{
      member_id: string
      members: { preferred_name: string; full_name: string }
    }>)
  if (referralError) return { data: null, error: referralError.message }

  const memberMap = new Map<string, { id: string; preferred_name: string; full_name: string; last_visit_date: string | null; assigned_worker: string | null }>()

  // Add referral-only members first (no visit date or worker yet)
  for (const row of referralData ?? []) {
    if (!memberMap.has(row.member_id)) {
      memberMap.set(row.member_id, {
        id: row.member_id,
        preferred_name: row.members?.preferred_name,
        full_name: row.members?.full_name,
        last_visit_date: null,
        assigned_worker: null,
      })
    }
  }

  // Add/update with visit data (more recent last_visit_date and assigned_worker)
  for (const row of visitData ?? []) {
    if (!memberMap.has(row.member_id)) {
      memberMap.set(row.member_id, {
        id: row.member_id,
        preferred_name: row.members?.preferred_name,
        full_name: row.members?.full_name,
        last_visit_date: row.scheduled_date,
        assigned_worker: row.care_workers?.full_name ?? null,
      })
    }
  }

  return { data: Array.from(memberMap.values()).sort((a, b) => a.full_name.localeCompare(b.full_name)), error: null }
}

/** Create an agency referral from navigator. */
export async function createAgencyReferral(input: {
  member_id: string
  navigator_id: string
  agency_id: string
  referral_reason: string
  services_requested: string[]
  notes?: string
}): Promise<{ data: AgencyReferralRow | null; error: string | null }> {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tbl = (admin as any).from('agency_referrals')
  const { data, error } = await tbl
    .insert({
      member_id: input.member_id,
      referring_navigator_id: input.navigator_id,
      agency_id: input.agency_id,
      referral_reason: input.referral_reason,
      services_requested: input.services_requested,
      notes: input.notes ?? null,
      status: 'pending',
    })
    .select()
    .maybeSingle() as { data: AgencyReferralRow | null; error: { message: string } | null }
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Get pending referrals for an agency. */
export async function getPendingReferralsForAgency(agencyId: string): Promise<{ data: AgencyReferralRow[] | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin
    .from('agency_referrals')
    .select('*')
    .eq('agency_id', agencyId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false }) as unknown as SupabaseListResult<AgencyReferralRow>)
  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

// ── Phase 62: Multi-location Management ──────────────────────────────────────

/** Get all locations for an agency, headquarters first. */
export async function getLocationsForAgency(agencyId: string): Promise<{ data: AgencyLocationRow[] | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin
    .from('agency_locations')
    .select('*')
    .eq('agency_id', agencyId)
    .order('is_headquarters', { ascending: false })
    .order('location_name') as unknown as SupabaseListResult<AgencyLocationRow>)
  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

/** Create a new location for an agency. */
export async function createAgencyLocation(input: AgencyLocationInsert): Promise<{ data: AgencyLocationRow | null; error: string | null }> {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await ((admin.from('agency_locations') as any)
    .insert(input)
    .select()
    .maybeSingle() as unknown as SupabaseResult<AgencyLocationRow>)
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Update an existing location. */
export async function updateAgencyLocation(locationId: string, agencyId: string, updates: AgencyLocationUpdate): Promise<{ data: AgencyLocationRow | null; error: string | null }> {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await ((admin.from('agency_locations') as any)
    .update(updates)
    .eq('id', locationId)
    .eq('agency_id', agencyId)
    .select()
    .maybeSingle() as unknown as SupabaseResult<AgencyLocationRow>)
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export interface LocationMetrics {
  location_id: string
  location_name: string
  active_workers: number
  total_visits_this_month: number
  completed_visits_this_month: number
  billable_hours_this_month: number
  clients_served: number
}

/** Per-location metrics: workers, visits this month, billable hours, clients. */
export async function getLocationMetrics(agencyId: string, locationId: string | null): Promise<{ data: LocationMetrics | null; error: string | null }> {
  const admin = createAdminClient()
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let workerQuery: any = admin.from('care_workers').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId).eq('is_active', true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let visitQuery: any = admin.from('care_visits').select('billable_hours, status, member_id', { count: 'exact' }).eq('agency_id', agencyId).gte('scheduled_date', monthStart)

  // NOTE: Supabase query builder is immutable — must reassign to apply additional filters.
  if (locationId) {
    workerQuery = workerQuery.eq('location_id', locationId)
    visitQuery = visitQuery.eq('location_id', locationId)
  }

  const [wResult, vResult] = await Promise.all([
    workerQuery as unknown as Promise<{ count: number | null; error: { message: string } | null }>,
    visitQuery as unknown as Promise<{ data: Array<{ billable_hours: number | null; status: string; member_id: string }> | null; count: number | null; error: { message: string } | null }>,
  ])

  if (wResult.error) return { data: null, error: wResult.error.message }
  if (vResult.error) return { data: null, error: vResult.error.message }

  const visits = vResult.data ?? []
  const completed = visits.filter(v => v.status === 'completed')
  const billableHours = completed.reduce((sum, v) => sum + (v.billable_hours ?? 0), 0)
  const clientsServed = new Set(visits.map(v => v.member_id)).size

  return {
    data: {
      location_id: locationId ?? 'all',
      location_name: locationId ? 'Selected location' : 'All Locations',
      active_workers: wResult.count ?? 0,
      total_visits_this_month: vResult.count ?? 0,
      completed_visits_this_month: completed.length,
      billable_hours_this_month: Math.round(billableHours * 100) / 100,
      clients_served: clientsServed,
    },
    error: null,
  }
}

/** Assign a care worker to a location. */
export async function assignWorkerToLocation(workerId: string, agencyId: string, locationId: string | null): Promise<{ error: string | null }> {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await ((admin.from('care_workers') as any)
    .update({ location_id: locationId })
    .eq('id', workerId)
    .eq('agency_id', agencyId) as unknown as Promise<{ error: { message: string } | null }>)
  return { error: error?.message ?? null }
}
