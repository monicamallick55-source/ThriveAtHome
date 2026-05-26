// Volunteer data access functions — server-side only, uses admin client.
import { createAdminClient } from '../supabase/admin'
import type { Database, VolunteerStatus, VisitType } from '../../types/database'
import { getTopVolunteerMatchesFromList, type MatchResult } from '../volunteers/match'

export type Volunteer = Database['public']['Tables']['volunteers']['Row']
export type VolunteerInsert = Database['public']['Tables']['volunteers']['Insert']
export type VolunteerMatch = Database['public']['Tables']['volunteer_matches']['Row']

export { type MatchResult }

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
  notes?: string
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
        notes: data.notes ?? null,
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

export async function getActiveVolunteers(): Promise<{ data: Volunteer[] | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('volunteers')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[data/volunteers/getActiveVolunteers]', error)
      return { data: null, error: error.message }
    }
    return { data: data as Volunteer[], error: null }
  } catch (e) {
    console.error('[data/volunteers/getActiveVolunteers] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function getTopVolunteerMatches(
  memberId: string,
  topN = 3
): Promise<{ data: MatchResult[] | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const [volResult, memberResult] = await Promise.all([
      admin.from('volunteers').select('*').eq('status', 'active'),
      admin.from('members').select('*').eq('id', memberId).maybeSingle(),
    ])
    if (volResult.error) return { data: null, error: volResult.error.message }
    if (memberResult.error) return { data: null, error: memberResult.error.message }
    if (!memberResult.data) return { data: null, error: 'Member not found' }

    const results = getTopVolunteerMatchesFromList(
      volResult.data as Volunteer[],
      memberResult.data,
      topN
    )
    return { data: results, error: null }
  } catch (e) {
    console.error('[data/volunteers/getTopVolunteerMatches] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function confirmVolunteerMatch(
  memberId: string,
  volunteerId: string,
  score: number,
  reasons: string[]
): Promise<{ data: VolunteerMatch | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('volunteer_matches')
      .insert({
        member_id: memberId,
        volunteer_id: volunteerId,
        match_score: score,
        match_reasons: reasons,
        status: 'matched',
        matched_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle()
    if (error) {
      console.error('[data/volunteers/confirmVolunteerMatch]', error)
      return { data: null, error: error.message }
    }
    return { data: data as VolunteerMatch, error: null }
  } catch (e) {
    console.error('[data/volunteers/confirmVolunteerMatch] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function getPendingMatchRequests(): Promise<{ data: Array<{ member: { id: string; full_name: string; preferred_language: string; address: string | null; topics_enjoy: string[] } }> | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    // Members who have no confirmed match yet
    const { data: matched, error: matchError } = await admin
      .from('volunteer_matches')
      .select('member_id')
      .eq('status', 'matched')
    if (matchError) return { data: null, error: matchError.message }

    const matchedIds = (matched ?? []).map(m => m.member_id)

    let query = admin
      .from('members')
      .select('id, full_name, preferred_language, address, topics_enjoy')
      .eq('status', 'active')
    if (matchedIds.length > 0) {
      query = query.not('id', 'in', `(${matchedIds.join(',')})`)
    }
    const { data, error } = await query
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []).map(m => ({ member: m })), error: null }
  } catch (e) {
    console.error('[data/volunteers/getPendingMatchRequests] Unexpected error:', e)
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
