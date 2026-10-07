// Clinical documentation data functions — SOAP notes and care plan versions for home care agencies.
// All functions return { data, error } — never throw.
// Tables are new and not in Supabase generated types; cast through any at query boundary.

import { createAdminClient } from '@/lib/supabase/admin'
import type { Tables } from '@/types/database'
type SoapNoteRow = any
type SoapNoteInsert = any
type SoapNoteUpdate = any
type CarePlanVersionRow = any
type CarePlanVersionInsert = any

type Result<T> = { data: T | null; error: string | null }

type QueryResult<T> = { data: T | null; error: { message: string } | null }

// Helper that executes a query built on an untyped table and returns a typed result
async function runQuery<T>(q: unknown): Promise<QueryResult<T>> {
  return q as Promise<QueryResult<T>>
}

async function runListQuery<T>(q: unknown): Promise<QueryResult<T[]>> {
  return q as Promise<QueryResult<T[]>>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminFrom(table: string): any {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (admin as any).from(table)
}

// ─── SOAP Notes ────────────────────────────────────────────────────────

export async function getSoapNotesForMember(
  memberId: string,
  agencyId: string
): Promise<Result<SoapNoteRow[]>> {
  try {
    const { data, error } = await runListQuery<SoapNoteRow>(
      adminFrom('soap_notes')
        .select('*')
        .eq('member_id', memberId)
        .eq('agency_id', agencyId)
        .order('note_date', { ascending: false })
    )
    if (error) { console.error('[clinicalDocs/getSoapNotesForMember]', error); return { data: null, error: error.message } }
    return { data: data ?? [], error: null }
  } catch (e) {
    console.error('[clinicalDocs/getSoapNotesForMember] Unexpected:', e)
    return { data: null, error: 'Failed to load clinical notes' }
  }
}

export async function getSoapNoteById(id: string): Promise<Result<SoapNoteRow>> {
  try {
    const { data, error } = await runQuery<SoapNoteRow>(
      adminFrom('soap_notes').select('*').eq('id', id).maybeSingle()
    )
    if (error) { console.error('[clinicalDocs/getSoapNoteById]', error); return { data: null, error: error.message } }
    if (!data) return { data: null, error: 'Note not found' }
    return { data, error: null }
  } catch (e) {
    console.error('[clinicalDocs/getSoapNoteById] Unexpected:', e)
    return { data: null, error: 'Failed to load note' }
  }
}

export async function createSoapNote(insert: SoapNoteInsert): Promise<Result<SoapNoteRow>> {
  try {
    const { data, error } = await runQuery<SoapNoteRow>(
      adminFrom('soap_notes').insert(insert).select().maybeSingle()
    )
    if (error) { console.error('[clinicalDocs/createSoapNote]', error); return { data: null, error: error.message } }
    if (!data) return { data: null, error: 'Insert returned no row' }
    return { data, error: null }
  } catch (e) {
    console.error('[clinicalDocs/createSoapNote] Unexpected:', e)
    return { data: null, error: 'Failed to create note' }
  }
}

export async function updateSoapNote(id: string, update: SoapNoteUpdate): Promise<Result<SoapNoteRow>> {
  try {
    const { data, error } = await runQuery<SoapNoteRow>(
      adminFrom('soap_notes').update(update).eq('id', id).select().maybeSingle()
    )
    if (error) { console.error('[clinicalDocs/updateSoapNote]', error); return { data: null, error: error.message } }
    if (!data) return { data: null, error: 'Note not found or already locked' }
    return { data, error: null }
  } catch (e) {
    console.error('[clinicalDocs/updateSoapNote] Unexpected:', e)
    return { data: null, error: 'Failed to update note' }
  }
}

export async function signSoapNote(id: string, signerName: string): Promise<Result<SoapNoteRow>> {
  return updateSoapNote(id, {
    status: 'signed',
    signed_by_name: signerName,
    signed_at: new Date().toISOString(),
  })
}

export async function lockSoapNote(id: string): Promise<Result<SoapNoteRow>> {
  return updateSoapNote(id, {
    status: 'locked',
    locked_at: new Date().toISOString(),
  })
}

export async function deleteSoapNote(id: string): Promise<Result<void>> {
  try {
    const { error } = await runQuery<null>(
      adminFrom('soap_notes').delete().eq('id', id).eq('status', 'draft')
    )
    if (error) { console.error('[clinicalDocs/deleteSoapNote]', error); return { data: null, error: error.message } }
    return { data: null, error: null }
  } catch (e) {
    console.error('[clinicalDocs/deleteSoapNote] Unexpected:', e)
    return { data: null, error: 'Failed to delete note' }
  }
}

// ─── Care Plan Versions ────────────────────────────────────────────────

export async function getCarePlansForMember(
  memberId: string,
  agencyId: string
): Promise<Result<CarePlanVersionRow[]>> {
  try {
    const { data, error } = await runListQuery<CarePlanVersionRow>(
      adminFrom('care_plan_versions')
        .select('*')
        .eq('member_id', memberId)
        .eq('agency_id', agencyId)
        .order('version_number', { ascending: false })
    )
    if (error) { console.error('[clinicalDocs/getCarePlansForMember]', error); return { data: null, error: error.message } }
    return { data: data ?? [], error: null }
  } catch (e) {
    console.error('[clinicalDocs/getCarePlansForMember] Unexpected:', e)
    return { data: null, error: 'Failed to load care plans' }
  }
}

export async function createCarePlanVersion(insert: CarePlanVersionInsert): Promise<Result<CarePlanVersionRow>> {
  try {
    // Get current max version number
    const { data: existing } = await runListQuery<{ version_number: number }>(
      adminFrom('care_plan_versions')
        .select('version_number')
        .eq('member_id', insert.member_id)
        .eq('agency_id', insert.agency_id)
        .order('version_number', { ascending: false })
        .limit(1)
    )
    const nextVersion = (existing?.[0]?.version_number ?? 0) + 1

    // Supersede any currently active plan
    await runQuery<null>(
      adminFrom('care_plan_versions')
        .update({ status: 'superseded' })
        .eq('member_id', insert.member_id)
        .eq('agency_id', insert.agency_id)
        .eq('status', 'active')
    )

    const { data, error } = await runQuery<CarePlanVersionRow>(
      adminFrom('care_plan_versions')
        .insert({ ...insert, version_number: nextVersion, status: 'draft' })
        .select()
        .maybeSingle()
    )
    if (error) { console.error('[clinicalDocs/createCarePlanVersion]', error); return { data: null, error: error.message } }
    if (!data) return { data: null, error: 'Insert returned no row' }
    return { data, error: null }
  } catch (e) {
    console.error('[clinicalDocs/createCarePlanVersion] Unexpected:', e)
    return { data: null, error: 'Failed to create care plan' }
  }
}

export async function approveCarePlanVersion(
  id: string,
  approverName: string
): Promise<Result<CarePlanVersionRow>> {
  try {
    const { data, error } = await runQuery<CarePlanVersionRow>(
      adminFrom('care_plan_versions')
        .update({
          status: 'active',
          approved_by_name: approverName,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .maybeSingle()
    )
    if (error) { console.error('[clinicalDocs/approveCarePlanVersion]', error); return { data: null, error: error.message } }
    if (!data) return { data: null, error: 'Care plan not found' }
    return { data, error: null }
  } catch (e) {
    console.error('[clinicalDocs/approveCarePlanVersion] Unexpected:', e)
    return { data: null, error: 'Failed to approve care plan' }
  }
}

// ─── Billing Code Reference ────────────────────────────────────────────

export interface BillingCodeRef {
  code: string
  description: string
  type: 'CPT' | 'HCPCS' | 'ICD10'
  category: string
}

export const HOME_HEALTH_BILLING_CODES: BillingCodeRef[] = [
  // Home health CPT / HCPCS
  { code: 'G0151', description: 'Physical therapy services (HH)', type: 'HCPCS', category: 'Therapy' },
  { code: 'G0152', description: 'Occupational therapy services (HH)', type: 'HCPCS', category: 'Therapy' },
  { code: 'G0153', description: 'Speech-language pathology services (HH)', type: 'HCPCS', category: 'Therapy' },
  { code: 'G0154', description: 'Skilled nursing services (HH)', type: 'HCPCS', category: 'Skilled Nursing' },
  { code: 'G0155', description: 'Clinical social services (HH)', type: 'HCPCS', category: 'Social Services' },
  { code: 'G0156', description: 'Home health aide services', type: 'HCPCS', category: 'Aide Services' },
  { code: 'G0299', description: 'Direct skilled nursing services — RN', type: 'HCPCS', category: 'Skilled Nursing' },
  { code: 'G0300', description: 'Direct skilled nursing services — LPN/LVN', type: 'HCPCS', category: 'Skilled Nursing' },
  { code: '97110', description: 'Therapeutic exercises', type: 'CPT', category: 'Therapy' },
  { code: '97530', description: 'Therapeutic activities', type: 'CPT', category: 'Therapy' },
  { code: '97535', description: 'Self-care/home management training', type: 'CPT', category: 'Therapy' },
  { code: '97542', description: 'Wheelchair management training', type: 'CPT', category: 'Therapy' },
  // Common ICD-10 diagnoses for home health
  { code: 'Z74.01', description: 'Bed confinement status', type: 'ICD10', category: 'Mobility' },
  { code: 'Z74.09', description: 'Other problems related to reduced mobility', type: 'ICD10', category: 'Mobility' },
  { code: 'R41.3', description: 'Other amnesia / memory loss', type: 'ICD10', category: 'Cognitive' },
  { code: 'G30.9', description: "Alzheimer's disease, unspecified", type: 'ICD10', category: 'Cognitive' },
  { code: 'F03.90', description: 'Unspecified dementia without behavioral disturbance', type: 'ICD10', category: 'Cognitive' },
  { code: 'I10', description: 'Essential (primary) hypertension', type: 'ICD10', category: 'Cardiovascular' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', type: 'ICD10', category: 'Metabolic' },
  { code: 'M79.3', description: 'Panniculitis, unspecified', type: 'ICD10', category: 'Musculoskeletal' },
  { code: 'Z87.39', description: 'Personal history of other musculoskeletal disorders', type: 'ICD10', category: 'Musculoskeletal' },
  { code: 'W19.XXXA', description: 'Unspecified fall — initial encounter', type: 'ICD10', category: 'Fall/Injury' },
]
