// VITA / TCE free tax-prep — server-side data access (admin client).
// Phase 99 (M24).
import { createAdminClient } from '../supabase/admin'
import type { Tables } from '@/types/database'
type VitaSiteRow = Tables<'vita_sites'>
type VitaAppointmentRow = Tables<'vita_appointments'>

export async function getVitaSites(
  state?: string
): Promise<{ data: VitaSiteRow[] | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    let q = admin.from('vita_sites').select('*').eq('is_active', true)
    if (state) q = q.or(`state.eq.${state},state.is.null`)
    const { data, error } = await q.order('virtual_available', { ascending: false })
    if (error) {
      console.error('[data/vita/getVitaSites]', error)
      return { data: null, error: error.message }
    }
    return { data: data ?? [], error: null }
  } catch (e) {
    console.error('[data/vita/getVitaSites] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function getVitaAppointmentsForMember(
  memberId: string
): Promise<{ data: VitaAppointmentRow[] | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('vita_appointments')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
    if (error) return { data: null, error: error.message }
    return { data: data ?? [], error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

interface CreateVitaAppointmentInput {
  memberId: string
  requestedBy: string | null
  vitaSiteId: string | null
  taxYear: number
  filingSituation: string | null
  estimatedIncomeBand: string | null
  needsTransport: boolean
  needsLanguageSupport: string | null
  preferredDates: string | null
  memberPreferredName: string
}

export async function createVitaAppointmentRequest(
  input: CreateVitaAppointmentInput
): Promise<{ data: VitaAppointmentRow | null; error: string | null }> {
  try {
    const admin = createAdminClient()

    const { data: task } = await admin
      .from('navigator_tasks')
      .insert({
        member_id: input.memberId,
        task_type: 'vita_tax_help',
        description:
          `${input.memberPreferredName} requested help arranging free tax preparation ` +
          `(tax year ${input.taxYear}). ` +
          (input.needsTransport ? 'Needs transport to the site. ' : '') +
          (input.needsLanguageSupport ? `Language support: ${input.needsLanguageSupport}. ` : '') +
          `Confirm eligibility, book a VITA/TCE appointment or virtual filing, and share the "what to bring" checklist.`,
        priority: 'medium',
      })
      .select('id')
      .maybeSingle()

    const { data, error } = await admin
      .from('vita_appointments')
      .insert({
        member_id: input.memberId,
        requested_by: input.requestedBy,
        vita_site_id: input.vitaSiteId,
        tax_year: input.taxYear,
        filing_situation: input.filingSituation,
        estimated_income_band: input.estimatedIncomeBand,
        needs_transport: input.needsTransport,
        needs_language_support: input.needsLanguageSupport,
        preferred_dates: input.preferredDates,
        status: 'requested',
        navigator_task_id: task?.id ?? null,
      })
      .select('*')
      .maybeSingle()

    if (error) {
      console.error('[data/vita/createVitaAppointmentRequest]', error)
      return { data: null, error: error.message }
    }
    console.log(
      `[STUB][EMAIL] Would notify the care team of a new VITA tax-help request for member ${input.memberId}`
    )
    return { data, error: null }
  } catch (e) {
    console.error('[data/vita/createVitaAppointmentRequest] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}
