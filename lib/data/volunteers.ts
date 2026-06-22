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
  has_drivers_license?: boolean
  license_state?: string
  insurance_provider?: string
  insurance_expiry?: string
  corporate_program_id?: string
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
        has_drivers_license: data.has_drivers_license ?? false,
        license_state: data.license_state ?? null,
        insurance_provider: data.insurance_provider ?? null,
        insurance_expiry: data.insurance_expiry ?? null,
        corporate_program_id: data.corporate_program_id ?? null,
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

export interface VolunteerVisitInsert {
  volunteer_id: string
  member_id: string
  visit_date: string
  duration_minutes: number
  visit_type: VisitType
  volunteer_notes?: string
  volunteer_rating?: number
}

export async function getVolunteerByAuthId(
  authId: string
): Promise<{ data: Volunteer | null; error: string | null }> {
  try {
    const admin = createAdminClient()

    // Fast path: match by supabase_auth_id
    const { data: byId, error: idErr } = await admin
      .from('volunteers')
      .select('*')
      .eq('supabase_auth_id', authId)
      .maybeSingle()
    if (idErr) {
      console.error('[data/volunteers/getVolunteerByAuthId]', idErr)
      return { data: null, error: idErr.message }
    }
    if (byId) return { data: byId as Volunteer, error: null }

    // Fallback: find volunteer by email (for volunteers who applied before creating an account)
    const { data: authUser } = await admin.auth.admin.getUserById(authId)
    const email = authUser?.user?.email
    if (!email) return { data: null, error: null }

    // Search by email regardless of status (background_check, pending, active are all valid)
    const { data: byEmail, error: emailErr } = await admin
      .from('volunteers')
      .select('*')
      .ilike('email', email)
      .maybeSingle()
    if (emailErr || !byEmail) return { data: null, error: emailErr?.message ?? null }

    // Only link if row is unclaimed (supabase_auth_id is null) to avoid hijacking another user's row
    if (!byEmail.supabase_auth_id) {
      const { error: linkErr } = await admin
        .from('volunteers')
        .update({ supabase_auth_id: authId })
        .eq('id', byEmail.id)
      if (linkErr) {
        console.error('[data/volunteers/getVolunteerByAuthId] Failed to link supabase_auth_id:', linkErr)
      }

      // Also ensure a family_members row with role='volunteer' exists for middleware routing.
      // Best-effort: failure here is non-fatal (user can still be looked up via email next time).
      const { data: existingFm } = await admin
        .from('family_members')
        .select('id, role')
        .eq('supabase_auth_id', authId)
        .maybeSingle()
      if (!existingFm) {
        await admin.from('family_members').insert({
          supabase_auth_id: authId,
          full_name: byEmail.full_name,
          email: byEmail.email,
          relationship: 'volunteer',
          role: 'volunteer',
        }).select()
      } else if (existingFm.role !== 'volunteer') {
        await admin
          .from('family_members')
          .update({ role: 'volunteer' })
          .eq('supabase_auth_id', authId)
      }
    }
    return { data: { ...(byEmail as Volunteer), supabase_auth_id: authId }, error: null }
  } catch (e) {
    console.error('[data/volunteers/getVolunteerByAuthId] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

export interface PrivateMemberView {
  id: string
  displayName: string // "First L." format
  preferred_language: string
  topics_enjoy: string[]
  matchedAt: string | null
  matchId: string
}

export async function getVolunteerMatchedMembers(
  volunteerId: string
): Promise<{ data: PrivateMemberView[] | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data: matches, error: matchErr } = await admin
      .from('volunteer_matches')
      .select('id, matched_at, member_id')
      .eq('volunteer_id', volunteerId)
      .eq('status', 'matched')
    if (matchErr) return { data: null, error: matchErr.message }
    if (!matches || matches.length === 0) return { data: [], error: null }

    const memberIds = matches.map(m => m.member_id)
    const { data: members, error: memErr } = await admin
      .from('members')
      .select('id, full_name, preferred_language, topics_enjoy')
      .in('id', memberIds)
    if (memErr) return { data: null, error: memErr.message }

    const result: PrivateMemberView[] = (members ?? []).map(m => {
      const match = matches.find(mx => mx.member_id === m.id)!
      const nameParts = m.full_name.trim().split(/\s+/)
      const firstName = nameParts[0] ?? ''
      const lastInitial = nameParts.length > 1 ? `${nameParts[nameParts.length - 1][0]}.` : ''
      return {
        id: m.id,
        displayName: lastInitial ? `${firstName} ${lastInitial}` : firstName,
        preferred_language: m.preferred_language,
        topics_enjoy: m.topics_enjoy ?? [],
        matchedAt: match.matched_at,
        matchId: match.id,
      }
    })
    return { data: result, error: null }
  } catch (e) {
    console.error('[data/volunteers/getVolunteerMatchedMembers] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function logVolunteerVisit(
  visitData: VolunteerVisitInsert
): Promise<{ data: { id: string } | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data: insertedVisit, error: insertErr } = await admin
      .from('volunteer_visits')
      .insert({
        volunteer_id: visitData.volunteer_id,
        member_id: visitData.member_id,
        visit_date: visitData.visit_date,
        duration_minutes: visitData.duration_minutes,
        visit_type: visitData.visit_type,
        volunteer_notes: visitData.volunteer_notes ?? null,
        volunteer_rating: visitData.volunteer_rating ?? null,
        verified: false,
      })
      .select('id')
      .maybeSingle()
    if (insertErr) return { data: null, error: insertErr.message }

    // Update cumulative hours and distinct members helped
    const durationHours = visitData.duration_minutes / 60
    const { data: vol } = await admin
      .from('volunteers')
      .select('total_hours_logged')
      .eq('id', visitData.volunteer_id)
      .maybeSingle()

    const { data: allVisits } = await admin
      .from('volunteer_visits')
      .select('member_id')
      .eq('volunteer_id', visitData.volunteer_id)
    const distinctMembersCount = new Set((allVisits ?? []).map(v => v.member_id)).size

    await admin
      .from('volunteers')
      .update({
        total_hours_logged: Number(vol?.total_hours_logged ?? 0) + durationHours,
        total_seniors_helped: distinctMembersCount,
      })
      .eq('id', visitData.volunteer_id)
    return { data: insertedVisit, error: null }
  } catch (e) {
    console.error('[data/volunteers/logVolunteerVisit] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

export type VolunteerVisit = Database['public']['Tables']['volunteer_visits']['Row']

export async function getVolunteerMembersHelpedCount(
  volunteerId: string
): Promise<number> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('volunteer_visits')
      .select('member_id')
      .eq('volunteer_id', volunteerId)
    if (!data) return 0
    return new Set(data.map(v => v.member_id)).size
  } catch {
    return 0
  }
}

export async function getVolunteerVisits(
  volunteerId: string,
  limit = 10
): Promise<{ data: VolunteerVisit[] | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('volunteer_visits')
      .select('*')
      .eq('volunteer_id', volunteerId)
      .order('visit_date', { ascending: false })
      .limit(limit)
    if (error) {
      console.error('[data/volunteers/getVolunteerVisits]', error)
      return { data: null, error: error.message }
    }
    return { data: data as VolunteerVisit[], error: null }
  } catch (e) {
    console.error('[data/volunteers/getVolunteerVisits] Unexpected error:', e)
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
