import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface CorporateVolunteerProgram {
  id: string
  created_at: string
  employer_account_id: string
  program_name: string
  matching_rate_per_hour: number
  annual_hour_cap_per_employee: number | null
  total_hours_logged: number
  total_matched_value: number
  integration_type: string
  package_type: string
  tier: string
  status: string
}

export interface CorporateVolunteerHour {
  id: string
  created_at: string
  corporate_program_id: string
  volunteer_id: string
  visit_id: string | null
  hours_logged: number
  logged_date: string
  verified: boolean
  verified_by: string | null
  export_status: string
}

export interface CorporateVolunteerHourWithDetails extends CorporateVolunteerHour {
  volunteer_name: string
  volunteer_email: string
  visit_type: string | null
}

export async function getActiveCorporatePrograms(): Promise<{ data: CorporateVolunteerProgram[] | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('corporate_volunteer_programs')
      .select('*')
      .eq('status', 'active')
      .order('program_name')
    if (error) return { data: null, error: error.message }
    return { data: data as CorporateVolunteerProgram[], error: null }
  } catch (e) {
    return { data: null, error: String(e) }
  }
}

export async function getCorporateProgramByEmployer(employerAccountId: string): Promise<{ data: CorporateVolunteerProgram | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('corporate_volunteer_programs')
      .select('*')
      .eq('employer_account_id', employerAccountId)
      .eq('status', 'active')
      .maybeSingle()
    if (error) return { data: null, error: error.message }
    return { data: data as CorporateVolunteerProgram | null, error: null }
  } catch (e) {
    return { data: null, error: String(e) }
  }
}

export async function getCorporateProgramById(programId: string): Promise<{ data: CorporateVolunteerProgram | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('corporate_volunteer_programs')
      .select('*')
      .eq('id', programId)
      .maybeSingle()
    if (error) return { data: null, error: error.message }
    return { data: data as CorporateVolunteerProgram | null, error: null }
  } catch (e) {
    return { data: null, error: String(e) }
  }
}

export interface ProgramVolunteerSummary {
  volunteer_id: string
  volunteer_name: string
  volunteer_email: string
  total_hours: number
  verified_hours: number
  last_logged_date: string | null
  export_status_counts: Record<string, number>
}

export async function getProgramVolunteerSummaries(programId: string): Promise<{ data: ProgramVolunteerSummary[] | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data: hours, error } = await admin
      .from('corporate_volunteer_hours')
      .select('volunteer_id, hours_logged, verified, logged_date, export_status')
      .eq('corporate_program_id', programId)
      .order('logged_date', { ascending: false })
    if (error) return { data: null, error: error.message }
    if (!hours || hours.length === 0) return { data: [], error: null }

    const volunteerIds = [...new Set(hours.map((h: any) => h.volunteer_id))]
    const { data: volunteers } = await admin
      .from('volunteers')
      .select('id, full_name, email')
      .in('id', volunteerIds)
    const volMap: Record<string, { full_name: string; email: string }> = {}
    for (const v of volunteers ?? []) {
      volMap[v.id] = { full_name: v.full_name, email: v.email }
    }

    const summaryMap: Record<string, ProgramVolunteerSummary> = {}
    for (const h of hours) {
      if (!summaryMap[h.volunteer_id]) {
        summaryMap[h.volunteer_id] = {
          volunteer_id: h.volunteer_id,
          volunteer_name: volMap[h.volunteer_id]?.full_name ?? 'Unknown',
          volunteer_email: volMap[h.volunteer_id]?.email ?? '',
          total_hours: 0,
          verified_hours: 0,
          last_logged_date: null,
          export_status_counts: {},
        }
      }
      const s = summaryMap[h.volunteer_id]
      s.total_hours += Number(h.hours_logged)
      if (h.verified) s.verified_hours += Number(h.hours_logged)
      if (!s.last_logged_date || h.logged_date > s.last_logged_date) s.last_logged_date = h.logged_date
      s.export_status_counts[h.export_status] = (s.export_status_counts[h.export_status] ?? 0) + 1
    }

    return { data: Object.values(summaryMap), error: null }
  } catch (e) {
    return { data: null, error: String(e) }
  }
}

export async function getAllHoursForExport(programId: string): Promise<{ data: CorporateVolunteerHourWithDetails[] | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data: hours, error } = await admin
      .from('corporate_volunteer_hours')
      .select('id, created_at, corporate_program_id, volunteer_id, visit_id, hours_logged, logged_date, verified, verified_by, export_status')
      .eq('corporate_program_id', programId)
      .order('logged_date', { ascending: false })
    if (error) return { data: null, error: error.message }
    if (!hours || hours.length === 0) return { data: [], error: null }

    const volunteerIds = [...new Set(hours.map((h: any) => h.volunteer_id))]
    const { data: volunteers } = await admin
      .from('volunteers')
      .select('id, full_name, email')
      .in('id', volunteerIds)
    const volMap: Record<string, { full_name: string; email: string }> = {}
    for (const v of volunteers ?? []) {
      volMap[v.id] = { full_name: v.full_name, email: v.email }
    }

    const result: CorporateVolunteerHourWithDetails[] = hours.map((h: any) => ({
      id: h.id,
      created_at: h.created_at,
      corporate_program_id: h.corporate_program_id,
      volunteer_id: h.volunteer_id,
      visit_id: h.visit_id,
      hours_logged: h.hours_logged,
      logged_date: h.logged_date,
      verified: h.verified,
      verified_by: h.verified_by,
      export_status: h.export_status,
      volunteer_name: volMap[h.volunteer_id]?.full_name ?? 'Unknown',
      volunteer_email: volMap[h.volunteer_id]?.email ?? '',
      visit_type: null,
    }))

    return { data: result, error: null }
  } catch (e) {
    return { data: null, error: String(e) }
  }
}

export async function getCorporateProgramTotals(programId: string): Promise<{ totalHours: number; totalMatchedValue: number; volunteerCount: number }> {
  try {
    const admin = createAdminClient()
    const [programRes, hoursRes] = await Promise.all([
      admin.from('corporate_volunteer_programs').select('matching_rate_per_hour').eq('id', programId).maybeSingle(),
      admin.from('corporate_volunteer_hours').select('volunteer_id, hours_logged').eq('corporate_program_id', programId),
    ])
    const rate = programRes.data?.matching_rate_per_hour ?? 15
    const hours = hoursRes.data ?? []
    const totalHours = hours.reduce((sum, h) => sum + Number(h.hours_logged), 0)
    const totalMatchedValue = totalHours * rate
    const volunteerCount = new Set(hours.map((h: any) => h.volunteer_id)).size
    return { totalHours, totalMatchedValue, volunteerCount }
  } catch {
    return { totalHours: 0, totalMatchedValue: 0, volunteerCount: 0 }
  }
}

export async function linkVolunteerToProgram(
  volunteerId: string,
  programId: string
): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('volunteers')
      .update({ corporate_program_id: programId })
      .eq('id', volunteerId)
    if (error) return { error: error.message }
    return { error: null }
  } catch (e) {
    return { error: String(e) }
  }
}

export async function createCorporateHourFromVisit(
  programId: string,
  volunteerId: string,
  visitId: string,
  hoursLogged: number,
  loggedDate: string
): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('corporate_volunteer_hours')
      .insert({
        corporate_program_id: programId,
        volunteer_id: volunteerId,
        visit_id: visitId,
        hours_logged: hoursLogged,
        logged_date: loggedDate,
        export_status: 'pending',
      })
    if (error) return { error: error.message }
    return { error: null }
  } catch (e) {
    return { error: String(e) }
  }
}
