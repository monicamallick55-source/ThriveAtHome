// Data layer for Area Agency on Aging portal (M20, Phase 64).
// All functions return { data, error } — never throw.
import { createAdminClient } from '@/lib/supabase/admin'

export interface AAARow {
  id: string
  created_at: string
  updated_at: string
  agency_name: string
  psa_number: string | null
  state: string
  contact_name: string
  contact_email: string
  contact_phone: string | null
  address: string | null
  city: string | null
  zip_code: string | null
  counties_served: string[]
  fiscal_year_start: number
  annual_title3_budget_cents: number | null
  is_active: boolean
}

export interface AAAServiceUnitRow {
  id: string
  created_at: string
  aaa_id: string
  member_id: string | null
  service_date: string
  title3_category: string
  service_type: string
  units_provided: number
  unit_type: string
  county: string | null
  client_age_group: string | null
  client_gender: string | null
  poverty_status: boolean | null
  minority_status: boolean | null
  rural_status: boolean | null
  disability_status: boolean | null
  at_risk_status: boolean | null
  nutritional_risk: boolean | null
  lives_alone: boolean | null
  worker_name: string | null
  notes: string | null
  fiscal_year: number
  member?: { full_name: string; preferred_name: string; date_of_birth: string | null } | null
}

export interface OAAClientAssessmentRow {
  id: string
  created_at: string
  updated_at: string
  member_id: string
  aaa_id: string
  age_group: string | null
  gender: string | null
  race_ethnicity: string | null
  poverty_status: boolean
  minority_status: boolean
  rural_status: boolean
  disability_status: boolean
  at_risk_institutional: boolean
  nutritional_risk: boolean
  lives_alone: boolean | null
  primary_language: string | null
  county: string | null
  last_assessed_at: string | null
  member?: { full_name: string; preferred_name: string; date_of_birth: string | null } | null
}

export interface AAAStats {
  total_clients_this_year: number
  total_service_units_this_quarter: number
  units_by_category: Record<string, number>
  clients_by_county: Record<string, number>
  fiscal_year: number
  quarter: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminFrom(table: string): any {
  return (createAdminClient() as any).from(table)
}

function currentFiscalYear(fiscalYearStart: number): number {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-based
  if (month >= fiscalYearStart) return now.getFullYear()
  return now.getFullYear() - 1
}

function currentFiscalQuarter(fiscalYearStart: number): number {
  const now = new Date()
  const month = now.getMonth() + 1
  const monthsIntoFY = ((month - fiscalYearStart + 12) % 12)
  return Math.floor(monthsIntoFY / 3) + 1
}

/** Returns the AAA linked to the given auth user's family_members.aaa_id. */
export async function getAAAForAdmin(authUserId: string): Promise<{ data: AAARow | null; error: string | null }> {
  const admin = createAdminClient()
  const { data: fm, error: fmError } = await admin
    .from('family_members')
    .select('aaa_id')
    .eq('supabase_auth_id', authUserId)
    .maybeSingle()
  if (fmError) return { data: null, error: fmError.message }
  if (!fm?.aaa_id) return { data: null, error: 'No AAA linked' }

  const { data, error } = await adminFrom('area_agencies_on_aging')
    .select('*')
    .eq('id', fm.aaa_id)
    .maybeSingle()
  if (error) return { data: null, error: error.message }
  return { data: data as AAARow | null, error: null }
}

/** Returns all service units for an AAA within a fiscal year, newest first. */
export async function getServiceUnitsForAAA(
  aaaId: string,
  fiscalYear: number,
  limit = 100
): Promise<{ data: AAAServiceUnitRow[]; error: string | null }> {
  const { data, error } = await adminFrom('aaa_service_units')
    .select('*, member:members(full_name, preferred_name, date_of_birth)')
    .eq('aaa_id', aaaId)
    .eq('fiscal_year', fiscalYear)
    .order('service_date', { ascending: false })
    .limit(limit)
  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as AAAServiceUnitRow[], error: null }
}

/** Logs a new service unit. */
export async function logServiceUnit(
  aaaId: string,
  input: Omit<AAAServiceUnitRow, 'id' | 'created_at' | 'aaa_id' | 'member'>
): Promise<{ data: AAAServiceUnitRow | null; error: string | null }> {
  const { data, error } = await adminFrom('aaa_service_units')
    .insert({ aaa_id: aaaId, ...input })
    .select()
    .maybeSingle()
  if (error) { console.error('[aaa/logServiceUnit]', error); return { data: null, error: error.message } }
  return { data: data as AAAServiceUnitRow, error: null }
}

/** Returns all OAA client assessments for an AAA. */
export async function getClientAssessmentsForAAA(
  aaaId: string
): Promise<{ data: OAAClientAssessmentRow[]; error: string | null }> {
  const { data, error } = await adminFrom('oaa_client_assessments')
    .select('*, member:members(full_name, preferred_name, date_of_birth)')
    .eq('aaa_id', aaaId)
    .order('created_at', { ascending: false })
  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as OAAClientAssessmentRow[], error: null }
}

/** Creates or updates an OAA client assessment. */
export async function upsertClientAssessment(
  memberId: string,
  aaaId: string,
  input: Partial<Omit<OAAClientAssessmentRow, 'id' | 'created_at' | 'updated_at' | 'member_id' | 'aaa_id' | 'member'>>
): Promise<{ data: OAAClientAssessmentRow | null; error: string | null }> {
  const { data, error } = await adminFrom('oaa_client_assessments')
    .upsert({ member_id: memberId, aaa_id: aaaId, ...input, last_assessed_at: new Date().toISOString().split('T')[0] }, { onConflict: 'member_id' })
    .select()
    .maybeSingle()
  if (error) { console.error('[aaa/upsertClientAssessment]', error); return { data: null, error: error.message } }
  return { data: data as OAAClientAssessmentRow, error: null }
}

/** Calculates aggregate stats for dashboard. */
export async function getAAAStats(aaa: AAARow): Promise<{ data: AAAStats; error: string | null }> {
  try {
    const fiscalYear = currentFiscalYear(aaa.fiscal_year_start)
    const quarter = currentFiscalQuarter(aaa.fiscal_year_start)

    // Quarter date range
    const fyStart = new Date(fiscalYear, aaa.fiscal_year_start - 1, 1)
    const qStart = new Date(fyStart)
    qStart.setMonth(qStart.getMonth() + (quarter - 1) * 3)
    const qEnd = new Date(qStart)
    qEnd.setMonth(qEnd.getMonth() + 3)
    const qStartStr = qStart.toISOString().split('T')[0]
    const qEndStr = qEnd.toISOString().split('T')[0]

    // Units this quarter by category
    const { data: qUnits, error: qErr } = await adminFrom('aaa_service_units')
      .select('title3_category, units_provided')
      .eq('aaa_id', aaa.id)
      .eq('fiscal_year', fiscalYear)
      .gte('service_date', qStartStr)
      .lt('service_date', qEndStr)
    if (qErr) throw new Error(qErr.message)

    const units_by_category: Record<string, number> = {}
    let total_service_units_this_quarter = 0
    for (const u of (qUnits ?? []) as { title3_category: string; units_provided: number }[]) {
      units_by_category[u.title3_category] = (units_by_category[u.title3_category] ?? 0) + u.units_provided
      total_service_units_this_quarter += u.units_provided
    }

    // Distinct clients this year
    const { data: clientRows } = await adminFrom('aaa_service_units')
      .select('member_id')
      .eq('aaa_id', aaa.id)
      .eq('fiscal_year', fiscalYear)
      .not('member_id', 'is', null)
    const uniqueClients = new Set((clientRows ?? []).map((r: { member_id: string }) => r.member_id))

    // Clients by county (from assessments)
    const { data: assessments } = await adminFrom('oaa_client_assessments')
      .select('county')
      .eq('aaa_id', aaa.id)
    const clients_by_county: Record<string, number> = {}
    for (const a of (assessments ?? []) as { county: string | null }[]) {
      if (a.county) {
        clients_by_county[a.county] = (clients_by_county[a.county] ?? 0) + 1
      }
    }

    return {
      data: {
        total_clients_this_year: uniqueClients.size,
        total_service_units_this_quarter,
        units_by_category,
        clients_by_county,
        fiscal_year: fiscalYear,
        quarter,
      },
      error: null,
    }
  } catch (e) {
    console.error('[aaa/getAAAStats]', e)
    return {
      data: { total_clients_this_year: 0, total_service_units_this_quarter: 0, units_by_category: {}, clients_by_county: {}, fiscal_year: new Date().getFullYear(), quarter: 1 },
      error: null,
    }
  }
}

/** Exports service units as NAPIS-compatible CSV rows. */
export async function getNAPISExportData(
  aaaId: string,
  fiscalYear: number
): Promise<{ data: AAAServiceUnitRow[]; error: string | null }> {
  const { data, error } = await adminFrom('aaa_service_units')
    .select('*, member:members(full_name, preferred_name, date_of_birth)')
    .eq('aaa_id', aaaId)
    .eq('fiscal_year', fiscalYear)
    .order('service_date', { ascending: true })
  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as AAAServiceUnitRow[], error: null }
}
