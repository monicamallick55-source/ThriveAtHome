// Volunteer data access functions — server-side only, uses admin client.
import { createAdminClient } from '../supabase/admin'
import type { Database, VolunteerStatus, VisitType } from '../../types/database'

export type Volunteer = Database['public']['Tables']['volunteers']['Row']
export type VolunteerInsert = Database['public']['Tables']['volunteers']['Insert']

export interface VolunteerApplicationData {
  full_name: string
  email: string
  phone?: string
  city?: string
  state?: string
  languages?: string[]
  availability_days?: string[]
  hours_per_week?: string
  service_types?: VisitType[]
  interests?: string[]
  why_volunteer: string
  prior_experience?: string
}

export async function submitVolunteerApplication(
  data: VolunteerApplicationData
): Promise<{ data: Volunteer | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data: row, error } = await admin
      .from('volunteers')
      .insert({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        languages: data.languages ?? [],
        availability_days: data.availability_days ?? [],
        hours_per_week: data.hours_per_week ?? null,
        service_types: (data.service_types ?? []) as VisitType[],
        interests: data.interests ?? [],
        why_volunteer: data.why_volunteer,
        prior_experience: data.prior_experience ?? null,
        status: 'pending',
      })
      .select()
      .maybeSingle()
    if (error) {
      console.error('[data/volunteers/submitVolunteerApplication]', error)
      return { data: null, error: error.message }
    }
    return { data: row as Volunteer, error: null }
  } catch (e) {
    console.error('[data/volunteers/submitVolunteerApplication] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function getVolunteerApplications(
  status?: VolunteerStatus
): Promise<{ data: Volunteer[] | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    let query = admin.from('volunteers').select('*').order('created_at', { ascending: false })
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (error) {
      console.error('[data/volunteers/getVolunteerApplications]', error)
      return { data: null, error: error.message }
    }
    return { data: data as Volunteer[], error: null }
  } catch (e) {
    console.error('[data/volunteers/getVolunteerApplications] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function updateVolunteerStatus(
  volunteerId: string,
  status: VolunteerStatus
): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('volunteers')
      .update({ status })
      .eq('id', volunteerId)
    if (error) {
      console.error('[data/volunteers/updateVolunteerStatus]', error)
      return { error: error.message }
    }
    return { error: null }
  } catch (e) {
    console.error('[data/volunteers/updateVolunteerStatus] Unexpected error:', e)
    return { error: e instanceof Error ? e.message : String(e) }
  }
}
