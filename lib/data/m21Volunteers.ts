// M21 — Expanded Volunteer Ecosystem data layer
import { createAdminClient } from '../supabase/admin'
import type { Tables } from '@/types/database'
type MemberAmbassadorRow = Tables<'member_ambassadors'>
type K12SchoolRow = Tables<'k12_schools'>
type K12SchoolInsert = any

// ─── Phase 81: Retired Professionals ─────────────────────────────────────────

export async function getRetiredProfessionalVolunteers(specialty?: string) {
  const admin = createAdminClient()
  let q = admin
    .from('volunteers')
    .select('id,full_name,city,state,volunteer_specialty,professional_background,interests,languages,service_types,rating_average,total_hours_logged')
    .eq('status', 'active')
    .not('volunteer_specialty', 'is', null)
  if (specialty && specialty !== 'all') q = q.eq('volunteer_specialty', specialty)
  const { data, error } = await q.order('total_hours_logged', { ascending: false })
  return { data: data ?? [], error: error?.message ?? null }
}

// ─── Phase 82: Faith Chaplaincy ───────────────────────────────────────────────

export async function getChaplainVolunteers(faithAffiliation?: string) {
  const admin = createAdminClient()
  let q = admin
    .from('volunteers')
    .select('id,full_name,city,state,faith_affiliation,is_chaplain,languages,service_types,rating_average,total_hours_logged')
    .eq('status', 'active')
    .eq('is_chaplain', true)
  if (faithAffiliation && faithAffiliation !== 'all') q = q.eq('faith_affiliation', faithAffiliation)
  const { data, error } = await q.order('total_hours_logged', { ascending: false })
  return { data: data ?? [], error: error?.message ?? null }
}

// ─── Phase 83: Neighbor Volunteers ────────────────────────────────────────────

export async function getNeighborVolunteers(zipCode?: string, city?: string) {
  const admin = createAdminClient()
  let q = admin
    .from('volunteers')
    .select('id,full_name,city,state,zip_code,interests,service_types,rating_average,total_hours_logged,hours_per_week')
    .eq('status', 'active')
    .eq('is_neighbor_volunteer', true)
  if (zipCode) q = q.eq('zip_code', zipCode)
  else if (city) q = q.ilike('city', `%${city}%`)
  const { data, error } = await q.order('total_hours_logged', { ascending: false })
  return { data: data ?? [], error: error?.message ?? null }
}

// ─── Phase 85: Member Ambassadors ─────────────────────────────────────────────

export async function getActiveAmbassadors(): Promise<{ data: MemberAmbassadorRow[]; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('member_ambassadors')
    .select('*, member:members(preferred_name, full_name)')
    .eq('status', 'active')
    .order('ambassador_since', { ascending: false })
  return { data: (data ?? []) as MemberAmbassadorRow[], error: error?.message ?? null }
}

export async function nominateMemberAsAmbassador(
  memberId: string,
  navigatorId: string,
  specialties: string[],
  notes?: string
): Promise<{ data: MemberAmbassadorRow | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('member_ambassadors')
    .upsert({
      member_id: memberId,
      nominated_by: navigatorId,
      specialties,
      notes: notes ?? null,
      status: 'active',
    }, { onConflict: 'member_id' })
    .select()
    .maybeSingle()
  return { data: data as MemberAmbassadorRow | null, error: error?.message ?? null }
}

export async function getMemberAmbassador(memberId: string): Promise<{ data: MemberAmbassadorRow | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('member_ambassadors')
    .select('*')
    .eq('member_id', memberId)
    .maybeSingle()
  return { data: data as MemberAmbassadorRow | null, error: error?.message ?? null }
}

// ─── Phase 86: K-12 Schools ───────────────────────────────────────────────────

export async function registerK12School(
  schoolData: K12SchoolInsert
): Promise<{ data: K12SchoolRow | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('k12_schools')
    .insert(schoolData)
    .select()
    .maybeSingle()
  return { data: data as K12SchoolRow | null, error: error?.message ?? null }
}

export async function getK12Schools(): Promise<{ data: K12SchoolRow[]; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('k12_schools')
    .select('*')
    .order('created_at', { ascending: false })
  return { data: (data ?? []) as K12SchoolRow[], error: error?.message ?? null }
}

export async function getK12StudentsForSchool(schoolId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('k12_student_volunteers')
    .select('*, member:members(preferred_name, full_name)')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
  return { data: data ?? [], error: error?.message ?? null }
}
