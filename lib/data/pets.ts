// M27 — Pet & Companion Life Tracking: pet profile data layer (server-side, admin client).
// Pets belong to a member. Proactive birthday / adoption-anniversary acknowledgment is driven
// by /api/cron/pet-milestones, which writes rows into the shared celebration_events table.
import { createAdminClient } from '../supabase/admin'
import { pushRealtimeNotification } from '../realtime/notifications'
import { emailProvider } from '../providers'
import type { Tables } from '@/types/database'
type MemberPetRow = Tables<'member_pets'>
type MemberPetInsert = any

const SPECIES = ['dog', 'cat', 'bird', 'rabbit', 'fish', 'horse', 'other'] as const
export type PetSpecies = (typeof SPECIES)[number]

/** Normalises free-text species input to one of the known values. */
export function normalisePetSpecies(input: unknown): PetSpecies {
  const s = String(input ?? '').trim().toLowerCase()
  return (SPECIES as readonly string[]).includes(s) ? (s as PetSpecies) : 'other'
}

export interface PetInput {
  name: string
  species?: string
  breed?: string | null
  birthDate?: string | null
  adoptionDate?: string | null
  colorMarkings?: string | null
  notes?: string | null
}

/** Every pet for a member, active first, newest first. */
export async function getPetsForMember(
  memberId: string
): Promise<{ data: MemberPetRow[]; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('member_pets')
      .select('*')
      .eq('member_id', memberId)
      .order('is_active', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[data/pets/getPetsForMember]', error)
      return { data: [], error: error.message }
    }
    return { data: data ?? [], error: null }
  } catch (e) {
    console.error('[data/pets/getPetsForMember] Unexpected error:', e)
    return { data: [], error: e instanceof Error ? e.message : String(e) }
  }
}

/** Only living companions — used by the milestone cron. */
export async function getActivePetsForMember(
  memberId: string
): Promise<{ data: MemberPetRow[]; error: string | null }> {
  const { data, error } = await getPetsForMember(memberId)
  return { data: data.filter((p: any) => p.is_active && !p.passed_away_on), error }
}

export async function getPetById(
  petId: string
): Promise<{ data: MemberPetRow | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.from('member_pets').select('*').eq('id', petId).maybeSingle()
    if (error) return { data: null, error: error.message }
    if (!data) return { data: null, error: 'Not found' }
    return { data, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function createPet(
  memberId: string,
  addedBy: string | null,
  input: PetInput
): Promise<{ data: MemberPetRow | null; error: string | null }> {
  try {
    const name = input.name?.trim()
    if (!name) return { data: null, error: 'Please give your companion a name.' }
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('member_pets')
      .insert({
        member_id: memberId,
        added_by: addedBy,
        name: name.slice(0, 80),
        species: normalisePetSpecies(input.species),
        breed: input.breed?.trim().slice(0, 80) || null,
        birth_date: input.birthDate || null,
        adoption_date: input.adoptionDate || null,
        color_markings: input.colorMarkings?.trim().slice(0, 200) || null,
        notes: input.notes?.trim().slice(0, 2000) || null,
      })
      .select('*')
      .maybeSingle()
    if (error || !data) {
      console.error('[data/pets/createPet]', error)
      return { data: null, error: error?.message ?? 'Could not save the pet profile.' }
    }
    return { data, error: null }
  } catch (e) {
    console.error('[data/pets/createPet] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function updatePet(
  petId: string,
  memberId: string,
  input: Partial<PetInput>
): Promise<{ data: MemberPetRow | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('member_pets')
      .select('member_id')
      .eq('id', petId)
      .maybeSingle()
    if (!existing || existing.member_id !== memberId) {
      return { data: null, error: 'Pet not found for this member.' }
    }
    const patch: Partial<MemberPetInsert> = {}
    if (input.name !== undefined) {
      const n = input.name.trim()
      if (!n) return { data: null, error: 'A name is required.' }
      patch.name = n.slice(0, 80)
    }
    if (input.species !== undefined) patch.species = normalisePetSpecies(input.species)
    if (input.breed !== undefined) patch.breed = input.breed?.trim().slice(0, 80) || null
    if (input.birthDate !== undefined) patch.birth_date = input.birthDate || null
    if (input.adoptionDate !== undefined) patch.adoption_date = input.adoptionDate || null
    if (input.colorMarkings !== undefined) patch.color_markings = input.colorMarkings?.trim().slice(0, 200) || null
    if (input.notes !== undefined) patch.notes = input.notes?.trim().slice(0, 2000) || null

    const { data, error } = await admin
      .from('member_pets')
      .update(patch as any)
      .eq('id', petId)
      .select('*')
      .maybeSingle()
    if (error || !data) return { data: null, error: error?.message ?? 'Could not update the pet profile.' }
    return { data, error: null }
  } catch (e) {
    console.error('[data/pets/updatePet] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function deletePet(
  petId: string,
  memberId: string
): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('member_pets')
      .select('member_id')
      .eq('id', petId)
      .maybeSingle()
    if (!existing || existing.member_id !== memberId) return { error: 'Pet not found for this member.' }
    const { error } = await admin.from('member_pets').delete().eq('id', petId)
    return { error: error?.message ?? null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Mark a companion as having passed away. Records the date + an optional memorial note,
 * deactivates the profile, notifies the family gently (with a link to the Companion Circle),
 * and logs a [STUB][EMAIL] care-team notice. Never throws on notification failure.
 */
export async function markPetPassedAway(
  petId: string,
  memberId: string,
  passedAwayOn: string,
  memorialNote: string | null,
  memberPreferredName: string
): Promise<{ data: MemberPetRow | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('member_pets')
      .select('member_id, name')
      .eq('id', petId)
      .maybeSingle()
    if (!existing || existing.member_id !== memberId) {
      return { data: null, error: 'Pet not found for this member.' }
    }
    const { data, error } = await admin
      .from('member_pets')
      .update({
        passed_away_on: passedAwayOn || new Date().toISOString().slice(0, 10),
        memorial_note: memorialNote?.trim().slice(0, 2000) || null,
        is_active: false,
      })
      .eq('id', petId)
      .select('*')
      .maybeSingle()
    if (error || !data) return { data: null, error: error?.message ?? 'Could not update the pet profile.' }

    const petName = (existing.name as string) ?? 'their companion'

    // Cancel any still-upcoming pet celebration rows for this pet.
    await admin
      .from('celebration_events')
      .update({ status: 'cancelled' })
      .eq('pet_id', petId)
      .gte('event_date', new Date().toISOString().slice(0, 10))

    await pushRealtimeNotification({
      type: 'system_message',
      memberId,
      title: `In memory of ${petName}`,
      body:
        `We're so sorry for the loss of ${petName}. When ${memberPreferredName} is ready, ` +
        `The Companion Circle is a gentle space for pet loss — open it from Pets & companions.`,
      severity: 'info',
    })

    try {
      await emailProvider.sendGriefSupportNotification(
        process.env.CARE_TEAM_EMAIL ?? 'care-team@thriveathome.dev',
        memberPreferredName,
        `Pet loss recorded: ${petName} (${(data.species as string) ?? 'pet'}) passed away on ${passedAwayOn}. ` +
          `Consider a warm check-in and offer The Companion Circle / 1:1 pet-loss support.`
      )
    } catch (e) {
      console.warn('[data/pets/markPetPassedAway] care-team email stub failed:', e)
    }

    return { data, error: null }
  } catch (e) {
    console.error('[data/pets/markPetPassedAway] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function attachPetPhoto(
  petId: string,
  memberId: string,
  path: string
): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('member_pets')
      .select('member_id')
      .eq('id', petId)
      .maybeSingle()
    if (!existing || existing.member_id !== memberId) return { error: 'Pet not found for this member.' }
    const { error } = await admin.from('member_pets').update({ photo_path: path }).eq('id', petId)
    return { error: error?.message ?? null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

// ─── Milestone helpers (used by /api/cron/pet-milestones and navigator surface) ───

/** Number of whole days from today (UTC) until the next occurrence of a MM-DD anniversary. */
export function daysUntilAnniversary(dateStr: string, from: Date = new Date()): number {
  const today = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()))
  const src = new Date(dateStr + 'T00:00:00Z')
  let next = new Date(Date.UTC(today.getUTCFullYear(), src.getUTCMonth(), src.getUTCDate()))
  if (next.getTime() < today.getTime()) {
    next = new Date(Date.UTC(today.getUTCFullYear() + 1, src.getUTCMonth(), src.getUTCDate()))
  }
  return Math.round((next.getTime() - today.getTime()) / 86_400_000)
}

/** Whole years between an anchor date and its next anniversary occurrence. */
export function yearsAtNextAnniversary(dateStr: string, from: Date = new Date()): number {
  const src = new Date(dateStr + 'T00:00:00Z')
  const today = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()))
  let anniversaryYear = today.getUTCFullYear()
  const thisYear = new Date(Date.UTC(anniversaryYear, src.getUTCMonth(), src.getUTCDate()))
  if (thisYear.getTime() < today.getTime()) anniversaryYear += 1
  return anniversaryYear - src.getUTCFullYear()
}

/** True when a celebration_events row already exists for this pet + type within the given year. */
export async function petCelebrationExists(
  petId: string,
  celebrationType: string,
  year: number
): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('celebration_events')
    .select('id')
    .eq('pet_id', petId)
    .eq('celebration_type', celebrationType)
    .gte('event_date', `${year}-01-01`)
    .lte('event_date', `${year}-12-31`)
    .limit(1)
  return (data?.length ?? 0) > 0
}

/** True when a one-time pet celebration (e.g. senior milestone) already exists for this pet. */
export async function petOneTimeCelebrationExists(
  petId: string,
  celebrationType: string
): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('celebration_events')
    .select('id')
    .eq('pet_id', petId)
    .eq('celebration_type', celebrationType)
    .limit(1)
  return (data?.length ?? 0) > 0
}

export interface MemberPetSummary {
  activePets: { name: string; species: string }[]
  memorializedPets: { name: string; passed_away_on: string | null }[]
  upcomingPetCelebrations: number
  openPetLossRequests: number
}

/** Compact summary for the navigator member-detail panel. */
export async function getMemberPetSummary(memberId: string): Promise<MemberPetSummary> {
  const empty: MemberPetSummary = {
    activePets: [],
    memorializedPets: [],
    upcomingPetCelebrations: 0,
    openPetLossRequests: 0,
  }
  try {
    const admin = createAdminClient()
    const today = new Date().toISOString().slice(0, 10)
    const [{ data: pets }, { data: celebs }, { data: reqs }] = await Promise.all([
      admin.from('member_pets').select('name, species, is_active, passed_away_on').eq('member_id', memberId),
      admin
        .from('celebration_events')
        .select('id')
        .eq('member_id', memberId)
        .not('pet_id', 'is', null)
        .gte('event_date', today)
        .neq('status', 'cancelled'),
      admin
        .from('pet_loss_support_requests')
        .select('id')
        .eq('member_id', memberId)
        .in('status', ['pending', 'acknowledged']),
    ])
    return {
      activePets: (pets ?? [])
        .filter((p: any) => p.is_active && !p.passed_away_on)
        .map((p: any) => ({ name: p.name as string, species: p.species as string })),
      memorializedPets: (pets ?? [])
        .filter((p: any) => p.passed_away_on)
        .map((p: any) => ({ name: p.name as string, passed_away_on: p.passed_away_on as string | null })),
      upcomingPetCelebrations: celebs?.length ?? 0,
      openPetLossRequests: reqs?.length ?? 0,
    }
  } catch (e) {
    console.error('[data/pets/getMemberPetSummary] Unexpected error:', e)
    return empty
  }
}
