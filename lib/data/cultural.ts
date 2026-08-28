// M25 — Cultural Programming Depth — server-side data access (admin client).
// Covers: festival calendar (102), potlucks (103), story circle (104),
// heritage projects (105), cultural classes (106), oral history archive (107).
import { createAdminClient } from '../supabase/admin'
import type {
  CulturalFestivalRow,
  CulturalPotluckRow,
  PotluckSignupRow,
  CulturalStorySessionRow,
  CulturalStoryContributionRow,
  HeritageProjectRow,
  CulturalClassRow,
  ClassRegistrationRow,
  OralHistoryRecordingRow,
} from '../../types/database'

const today = () => new Date().toISOString().slice(0, 10)

// ─── Phase 102 — Festival calendar ──────────────────────────────────────────

export async function getUpcomingFestivals(limit = 40): Promise<CulturalFestivalRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('cultural_festivals')
    .select('*')
    .eq('is_active', true)
    .gte('festival_date', today())
    .order('festival_date', { ascending: true })
    .limit(limit)
  if (error) {
    console.error('[data/cultural/getUpcomingFestivals]', error.message)
    return []
  }
  return data ?? []
}

/** Festivals whose start date is within `days` from today — used by the Aria cron + dashboard. */
export async function getFestivalsWithinDays(days: number): Promise<CulturalFestivalRow[]> {
  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() + days)
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('cultural_festivals')
    .select('*')
    .eq('is_active', true)
    .gte('festival_date', today())
    .lte('festival_date', cutoff.toISOString().slice(0, 10))
    .order('festival_date', { ascending: true })
  if (error) {
    console.error('[data/cultural/getFestivalsWithinDays]', error.message)
    return []
  }
  return data ?? []
}

// ─── Phase 103 — Potlucks ───────────────────────────────────────────────────

export interface PotluckWithSignups extends CulturalPotluckRow {
  host_name: string
  signups: Array<Pick<PotluckSignupRow, 'id' | 'member_id' | 'dish_name' | 'dish_category' | 'attendee_count'> & { member_name: string }>
  attendee_total: number
  user_signed_up: boolean
}

export async function getUpcomingPotlucks(memberId?: string): Promise<PotluckWithSignups[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('cultural_potlucks')
    .select('*, host:members!cultural_potlucks_host_member_id_fkey(preferred_name, full_name), potluck_signups(id, member_id, dish_name, dish_category, attendee_count, members(preferred_name, full_name))')
    .neq('status', 'cancelled')
    .gte('potluck_date', today())
    .order('potluck_date', { ascending: true })
  if (error) {
    console.error('[data/cultural/getUpcomingPotlucks]', error.message)
    return []
  }
  return (data ?? []).map((row: Record<string, unknown>) => {
    const host = row.host as { preferred_name?: string; full_name?: string } | null
    const rawSignups = (row.potluck_signups as Array<Record<string, unknown>>) ?? []
    const signups = rawSignups.map((s) => {
      const m = s.members as { preferred_name?: string; full_name?: string } | null
      return {
        id: s.id as string,
        member_id: s.member_id as string,
        dish_name: (s.dish_name as string | null) ?? null,
        dish_category: (s.dish_category as string) ?? 'main',
        attendee_count: (s.attendee_count as number) ?? 1,
        member_name: m?.preferred_name ?? m?.full_name?.split(' ')[0] ?? 'Community member',
      }
    })
    const { host: _h, potluck_signups: _p, ...potluck } = row
    void _h; void _p
    return {
      ...(potluck as unknown as CulturalPotluckRow),
      host_name: host?.preferred_name ?? host?.full_name?.split(' ')[0] ?? 'A member',
      signups,
      attendee_total: signups.reduce((n, s) => n + s.attendee_count, 0),
      user_signed_up: memberId ? signups.some((s) => s.member_id === memberId) : false,
    }
  })
}

export async function createPotluck(input: {
  hostMemberId: string
  title: string
  circleId?: string | null
  festivalTag?: string | null
  potluckDate: string
  potluckTime?: string | null
  locationName?: string | null
  locationAddress: string
  city?: string | null
  state?: string | null
  capacity?: number
  description?: string | null
}): Promise<{ data: CulturalPotluckRow | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('cultural_potlucks')
    .insert({
      host_member_id: input.hostMemberId,
      title: input.title,
      circle_id: input.circleId ?? null,
      festival_tag: input.festivalTag ?? null,
      potluck_date: input.potluckDate,
      potluck_time: input.potluckTime ?? null,
      location_name: input.locationName ?? null,
      location_address: input.locationAddress,
      city: input.city ?? null,
      state: input.state ?? null,
      capacity: input.capacity ?? 20,
      description: input.description ?? null,
      status: 'open',
    })
    .select('*')
    .maybeSingle()
  if (error) {
    console.error('[data/cultural/createPotluck]', error.message)
    return { data: null, error: error.message }
  }
  console.log(`[STUB][EMAIL] Would notify the care team of a new community potluck: "${input.title}" on ${input.potluckDate}`)
  return { data, error: null }
}

export async function signUpForPotluck(input: {
  potluckId: string
  memberId: string
  dishName?: string | null
  dishCategory?: string
  attendeeCount?: number
  notes?: string | null
}): Promise<{ error: string | null }> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('potluck_signups')
    .upsert(
      {
        potluck_id: input.potluckId,
        member_id: input.memberId,
        dish_name: input.dishName ?? null,
        dish_category: input.dishCategory ?? 'main',
        attendee_count: input.attendeeCount ?? 1,
        notes: input.notes ?? null,
      },
      { onConflict: 'potluck_id,member_id' }
    )
  if (error) {
    console.error('[data/cultural/signUpForPotluck]', error.message)
    return { error: error.message }
  }
  return { error: null }
}

export async function cancelPotluckSignup(potluckId: string, memberId: string): Promise<{ error: string | null }> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('potluck_signups')
    .delete()
    .eq('potluck_id', potluckId)
    .eq('member_id', memberId)
  if (error) {
    console.error('[data/cultural/cancelPotluckSignup]', error.message)
    return { error: error.message }
  }
  return { error: null }
}

// ─── Phase 104 — Cultural story circle ──────────────────────────────────────

export async function getUpcomingStorySessions(): Promise<CulturalStorySessionRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('cultural_story_sessions')
    .select('*')
    .gte('session_date', today())
    .order('session_date', { ascending: true })
  if (error) {
    console.error('[data/cultural/getUpcomingStorySessions]', error.message)
    return []
  }
  return data ?? []
}

export async function getStoryContributionsForMember(memberId: string): Promise<CulturalStoryContributionRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('cultural_story_contributions')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[data/cultural/getStoryContributionsForMember]', error.message)
    return []
  }
  return data ?? []
}

export async function addStoryContribution(input: {
  memberId: string
  sessionId?: string | null
  festivalName?: string | null
  homeland?: string | null
  storyText: string
  saveToLifeStory: boolean
  createdByFamilyId?: string | null
}): Promise<{ data: CulturalStoryContributionRow | null; error: string | null }> {
  const admin = createAdminClient()

  let lifeStoryEntryId: string | null = null
  if (input.saveToLifeStory) {
    const { data: entry, error: entryError } = await admin
      .from('life_story_entries')
      .insert({
        member_id: input.memberId,
        title: input.festivalName
          ? `${input.festivalName} — a memory from ${input.homeland ?? 'home'}`
          : 'A festival memory from the Story Circle',
        content: input.storyText,
        era: null,
        entry_type: 'cultural_memory',
        created_by: input.createdByFamilyId ?? null,
      })
      .select('id')
      .maybeSingle()
    if (entryError) {
      console.error('[data/cultural/addStoryContribution] life story write failed:', entryError.message)
    } else {
      lifeStoryEntryId = entry?.id ?? null
    }
  }

  const { data, error } = await admin
    .from('cultural_story_contributions')
    .insert({
      member_id: input.memberId,
      session_id: input.sessionId ?? null,
      festival_name: input.festivalName ?? null,
      homeland: input.homeland ?? null,
      story_text: input.storyText,
      saved_to_life_story: lifeStoryEntryId !== null,
      life_story_entry_id: lifeStoryEntryId,
    })
    .select('*')
    .maybeSingle()
  if (error) {
    console.error('[data/cultural/addStoryContribution]', error.message)
    return { data: null, error: error.message }
  }
  return { data, error: null }
}

// ─── Phase 105 — Intergenerational heritage projects ────────────────────────

export interface HeritageProjectWithNames extends HeritageProjectRow {
  member_name: string
  student_name: string | null
}

export async function getOpenHeritageProjects(): Promise<HeritageProjectWithNames[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('heritage_projects')
    .select('*, members(preferred_name, full_name), student_volunteers(full_name)')
    .in('status', ['open', 'matched', 'scheduled'])
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[data/cultural/getOpenHeritageProjects]', error.message)
    return []
  }
  return (data ?? []).map((row: Record<string, unknown>) => {
    const m = row.members as { preferred_name?: string; full_name?: string } | null
    const s = row.student_volunteers as { full_name?: string } | null
    const { members: _m, student_volunteers: _s, ...project } = row
    void _m; void _s
    return {
      ...(project as unknown as HeritageProjectRow),
      member_name: m?.preferred_name ?? m?.full_name?.split(' ')[0] ?? 'An elder',
      student_name: s?.full_name ?? null,
    }
  })
}

export async function getHeritageProjectsForMember(memberId: string): Promise<HeritageProjectRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('heritage_projects')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[data/cultural/getHeritageProjectsForMember]', error.message)
    return []
  }
  return data ?? []
}

export async function createHeritageProject(input: {
  memberId: string
  traditionTopic: string
  schoolName?: string | null
  projectDescription?: string | null
}): Promise<{ data: HeritageProjectRow | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('heritage_projects')
    .insert({
      member_id: input.memberId,
      tradition_topic: input.traditionTopic,
      school_name: input.schoolName ?? null,
      project_description: input.projectDescription ?? null,
      status: 'open',
    })
    .select('*')
    .maybeSingle()
  if (error) {
    console.error('[data/cultural/createHeritageProject]', error.message)
    return { data: null, error: error.message }
  }
  await admin.from('navigator_tasks').insert({
    member_id: input.memberId,
    task_type: 'heritage_project_match',
    description: `A member offered to share a tradition ("${input.traditionTopic}") with a student for a school heritage project. Match with a participating student volunteer and schedule the interview.`,
    priority: 'low',
  })
  return { data, error: null }
}

// ─── Phase 106 — Cultural craft & cooking classes ───────────────────────────

export interface CulturalClassWithReg extends CulturalClassRow {
  user_registered: boolean
  seats_left: number
}

export async function getUpcomingClasses(memberId?: string): Promise<CulturalClassWithReg[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('cultural_classes')
    .select('*, class_registrations(member_id)')
    .neq('status', 'cancelled')
    .gte('class_date', today())
    .order('class_date', { ascending: true })
  if (error) {
    console.error('[data/cultural/getUpcomingClasses]', error.message)
    return []
  }
  return (data ?? []).map((row: Record<string, unknown>) => {
    const regs = (row.class_registrations as Array<{ member_id: string }>) ?? []
    const { class_registrations: _r, ...cls } = row
    void _r
    const typed = cls as unknown as CulturalClassRow
    return {
      ...typed,
      user_registered: memberId ? regs.some((r) => r.member_id === memberId) : false,
      seats_left: Math.max(typed.max_participants - regs.length, 0),
    }
  })
}

export async function registerForClass(input: {
  classId: string
  memberId: string
  needsMaterialsKit?: boolean
  notes?: string | null
}): Promise<{ error: string | null }> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('class_registrations')
    .upsert(
      {
        class_id: input.classId,
        member_id: input.memberId,
        needs_materials_kit: input.needsMaterialsKit ?? false,
        notes: input.notes ?? null,
      },
      { onConflict: 'class_id,member_id' }
    )
  if (error) {
    console.error('[data/cultural/registerForClass]', error.message)
    return { error: error.message }
  }
  await refreshClassRegistrationCount(input.classId)
  if (input.needsMaterialsKit) {
    console.log(`[STUB][GOODS] Would mail a materials kit for class ${input.classId} to member ${input.memberId}`)
  }
  return { error: null }
}

export async function cancelClassRegistration(classId: string, memberId: string): Promise<{ error: string | null }> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('class_registrations')
    .delete()
    .eq('class_id', classId)
    .eq('member_id', memberId)
  if (error) {
    console.error('[data/cultural/cancelClassRegistration]', error.message)
    return { error: error.message }
  }
  await refreshClassRegistrationCount(classId)
  return { error: null }
}

async function refreshClassRegistrationCount(classId: string): Promise<void> {
  const admin = createAdminClient()
  const { count } = await admin
    .from('class_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('class_id', classId)
  await admin.from('cultural_classes').update({ registration_count: count ?? 0 }).eq('id', classId)
}

// ─── Phase 107 — Oral history archive ───────────────────────────────────────

export async function getOralHistoryForMember(memberId: string): Promise<OralHistoryRecordingRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('oral_history_recordings')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[data/cultural/getOralHistoryForMember]', error.message)
    return []
  }
  return data ?? []
}

export async function createOralHistoryRecording(input: {
  memberId: string
  recordedByFamilyId?: string | null
  title: string
  language: string
  topic?: string | null
  era?: string | null
  description?: string | null
  transcript?: string | null
  audioPath?: string | null
  consentGiven: boolean
  visibility: string
  saveToLifeStory: boolean
}): Promise<{ data: OralHistoryRecordingRow | null; error: string | null }> {
  const admin = createAdminClient()

  let lifeStoryEntryId: string | null = null
  if (input.saveToLifeStory) {
    const { data: entry } = await admin
      .from('life_story_entries')
      .insert({
        member_id: input.memberId,
        title: input.title,
        content:
          (input.description ? input.description + '\n\n' : '') +
          (input.transcript ?? `An oral history recording in ${input.language}.`),
        era: input.era ?? null,
        entry_type: 'oral_history',
        created_by: input.recordedByFamilyId ?? null,
      })
      .select('id')
      .maybeSingle()
    lifeStoryEntryId = entry?.id ?? null
  }

  const { data, error } = await admin
    .from('oral_history_recordings')
    .insert({
      member_id: input.memberId,
      recorded_by: input.recordedByFamilyId ?? null,
      title: input.title,
      language: input.language,
      topic: input.topic ?? null,
      era: input.era ?? null,
      description: input.description ?? null,
      transcript: input.transcript ?? null,
      audio_path: input.audioPath ?? null,
      consent_given: input.consentGiven,
      visibility: input.visibility,
      saved_to_life_story: lifeStoryEntryId !== null,
      life_story_entry_id: lifeStoryEntryId,
    })
    .select('*')
    .maybeSingle()
  if (error) {
    console.error('[data/cultural/createOralHistoryRecording]', error.message)
    return { data: null, error: error.message }
  }
  return { data, error: null }
}

export async function attachOralHistoryAudio(recordingId: string, memberId: string, audioPath: string): Promise<{ error: string | null }> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('oral_history_recordings')
    .update({ audio_path: audioPath })
    .eq('id', recordingId)
    .eq('member_id', memberId)
  if (error) {
    console.error('[data/cultural/attachOralHistoryAudio]', error.message)
    return { error: error.message }
  }
  return { error: null }
}

// ─── Navigator rollup ──────────────────────────────────────────────────────

export interface MemberCulturalEngagement {
  potluck_signups: number
  upcoming_potlucks_hosting: number
  story_contributions: number
  heritage_projects: number
  class_registrations: number
  oral_history_recordings: number
}

export async function getMemberCulturalEngagement(memberId: string): Promise<MemberCulturalEngagement> {
  const admin = createAdminClient()
  const countOf = async (table: 'potluck_signups' | 'cultural_story_contributions' | 'heritage_projects' | 'class_registrations' | 'oral_history_recordings'): Promise<number> => {
    const { count } = await admin.from(table).select('id', { count: 'exact', head: true }).eq('member_id', memberId)
    return count ?? 0
  }
  const [signups, hosting, stories, heritage, classes, oral] = await Promise.all([
    countOf('potluck_signups'),
    (async () => {
      const { count } = await admin
        .from('cultural_potlucks')
        .select('id', { count: 'exact', head: true })
        .eq('host_member_id', memberId)
        .gte('potluck_date', today())
      return count ?? 0
    })(),
    countOf('cultural_story_contributions'),
    countOf('heritage_projects'),
    countOf('class_registrations'),
    countOf('oral_history_recordings'),
  ])
  return {
    potluck_signups: signups,
    upcoming_potlucks_hosting: hosting,
    story_contributions: stories,
    heritage_projects: heritage,
    class_registrations: classes,
    oral_history_recordings: oral,
  }
}
