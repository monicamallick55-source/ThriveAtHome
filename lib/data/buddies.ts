// Human Buddy Programme — Phase 33a data layer. Server-side only.
import { createAdminClient } from '../supabase/admin'
import type { BuddyAssignmentRow, BuddyCallRow, BuddyCallInsert } from '../../types/database'

export type { BuddyAssignmentRow, BuddyCallRow }

export interface CreateBuddyAssignmentParams {
  member_id: string
  volunteer_id: string
  call_frequency?: 'weekly' | 'biweekly'
  preferred_call_day?: string
  preferred_call_time?: string
  match_score: number
  match_reasons: string[]
  navigator_notes?: string
}

// Returns the active buddy assignment for a member (status = 'active').
export async function getActiveBuddyAssignment(memberId: string): Promise<{ data: BuddyAssignmentRow | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('buddy_assignments')
    .select('*')
    .eq('member_id', memberId)
    .eq('status', 'active')
    .maybeSingle()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Returns all buddy assignments for a member (all statuses).
export async function getBuddyAssignments(memberId: string): Promise<{ data: BuddyAssignmentRow[] | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('buddy_assignments')
    .select('*')
    .eq('member_id', memberId)
    .order('assigned_at', { ascending: false })
  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

// Returns all active assignments for a volunteer.
export async function getVolunteerBuddyAssignments(volunteerId: string): Promise<{ data: BuddyAssignmentRow[] | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('buddy_assignments')
    .select('*, members(id, preferred_name, full_name, has_active_buddy, topics_enjoy, buddy_match_era, buddy_call_length_preference, buddy_intro_note, address)')
    .eq('volunteer_id', volunteerId)
    .in('status', ['active', 'paused', 'ending'])
    .order('assigned_at', { ascending: true })
  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

// Creates a new buddy assignment and increments volunteer's active count.
export async function createBuddyAssignment(params: CreateBuddyAssignmentParams): Promise<{ data: BuddyAssignmentRow | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('buddy_assignments').insert({
    member_id: params.member_id,
    volunteer_id: params.volunteer_id,
    call_frequency: params.call_frequency ?? 'weekly',
    preferred_call_day: params.preferred_call_day ?? null,
    preferred_call_time: params.preferred_call_time ?? null,
    match_score: params.match_score,
    match_reasons: params.match_reasons,
    navigator_notes: params.navigator_notes ?? null,
    status: 'active',
  }).select().single()
  if (error) return { data: null, error: error.message }

  // Increment volunteer buddy_active_count + set member has_active_buddy
  await (admin.from as any)('volunteers').select('buddy_active_count').eq('id', params.volunteer_id).single().then(({ data: vol }: { data: { buddy_active_count: number } | null }) => {
    if (vol) {
      return (admin.from as any)('volunteers').update({ buddy_active_count: (vol.buddy_active_count ?? 0) + 1 }).eq('id', params.volunteer_id)
    }
  })
  await (admin.from as any)('members').update({ has_active_buddy: true }).eq('id', params.member_id)

  return { data, error: null }
}

// Ends a buddy assignment (sets status = 'ended', decrements volunteer count, clears member flag).
export async function endBuddyAssignment(assignmentId: string, endReason: string, transitionBuddyId?: string): Promise<{ error: string | null }> {
  const admin = createAdminClient()

  const { data: assignment, error: fetchErr } = await (admin.from as any)('buddy_assignments')
    .select('volunteer_id, member_id')
    .eq('id', assignmentId)
    .single()
  if (fetchErr || !assignment) return { error: fetchErr?.message ?? 'Assignment not found' }

  const { error } = await (admin.from as any)('buddy_assignments').update({
    status: 'ended',
    ended_at: new Date().toISOString(),
    end_reason: endReason,
    transition_buddy_id: transitionBuddyId ?? null,
  }).eq('id', assignmentId)
  if (error) return { error: error.message }

  const { data: vol } = await (admin.from as any)('volunteers').select('buddy_active_count').eq('id', assignment.volunteer_id).single()
  if (vol) {
    await (admin.from as any)('volunteers').update({ buddy_active_count: Math.max(0, (vol.buddy_active_count ?? 1) - 1) }).eq('id', assignment.volunteer_id)
  }
  await (admin.from as any)('members').update({ has_active_buddy: false }).eq('id', assignment.member_id)

  return { error: null }
}

// Returns buddy calls for an assignment, without concern_description (for family use).
export async function getBuddyCallsForFamily(assignmentId: string): Promise<{ data: Omit<BuddyCallRow, 'concern_description'>[] | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('buddy_calls')
    .select('id, created_at, assignment_id, member_id, volunteer_id, scheduled_at, started_at, duration_minutes, call_quality, buddy_notes, family_note, concern_flag, milestone_flag, milestone_description, aria_brief_shown, aria_context_snapshot')
    .eq('assignment_id', assignmentId)
    .order('created_at', { ascending: false })
  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

// Returns buddy calls for an assignment, WITH concern_description (navigator use only).
export async function getBuddyCalls(assignmentId: string): Promise<{ data: BuddyCallRow[] | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('buddy_calls')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('created_at', { ascending: false })
  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

// Creates a buddy call record.
export async function createBuddyCall(call: BuddyCallInsert): Promise<{ data: BuddyCallRow | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('buddy_calls').insert(call).select().single()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Returns all unacknowledged concern flags for a navigator's caseload.
export async function getUnacknowledgedConcernFlags(navigatorId: string): Promise<{ data: Array<BuddyCallRow & { assignment: BuddyAssignmentRow }> | null; error: string | null }> {
  const admin = createAdminClient()
  // Get member IDs for this navigator
  const { data: assignments } = await (admin.from as any)('navigator_assignments')
    .select('member_id')
    .eq('navigator_id', navigatorId)
  const memberIds: string[] = (assignments ?? []).map((a: { member_id: string }) => a.member_id)
  if (!memberIds.length) return { data: [], error: null }

  const { data, error } = await (admin.from as any)('buddy_calls')
    .select('*, buddy_assignments(*)')
    .eq('concern_flag', true)
    .in('member_id', memberIds)
    .order('created_at', { ascending: false })
  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

// Returns unmatched Connect+ members (no active buddy assignment).
export async function getUnmatchedBuddyMembers(): Promise<{ data: Array<{ id: string; preferred_name: string; full_name: string; plan_tier: string; topics_enjoy: string[]; address: string | null; preferred_language: string; buddy_match_era: string | null; buddy_intro_note: string | null }> | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('members')
    .select('id, preferred_name, full_name, plan_tier, topics_enjoy, address, preferred_language, buddy_match_era, buddy_intro_note')
    .in('plan_tier', ['connect', 'complete', 'premier'])
    .eq('has_active_buddy', false)
    .eq('status', 'active')
    .order('full_name')
  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

// Scores an active volunteer for buddy matching.
export function scoreBuddyVolunteer(
  volunteer: { city: string | null; interests: string[]; languages: string[]; buddy_capacity: number; buddy_active_count: number; buddy_preferences: Record<string, unknown> | null },
  member: { address: string | null; topics_enjoy: string[]; preferred_language: string; buddy_match_topics?: string[] }
): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  const memberTopics = [
    ...(member.topics_enjoy ?? []),
    ...(member.buddy_match_topics ?? []),
  ]

  // Location
  if (volunteer.city && member.address && member.address.toLowerCase().includes(volunteer.city.toLowerCase())) {
    score += 20
    reasons.push('Same city')
  }
  // Shared interests (max 45)
  const shared = volunteer.interests.filter(i => memberTopics.includes(i))
  const interestPoints = Math.min(shared.length * 15, 45)
  if (interestPoints > 0) {
    score += interestPoints
    reasons.push(`${shared.length} shared interest${shared.length > 1 ? 's' : ''}: ${shared.slice(0, 3).join(', ')}`)
  }
  // Language match
  if (member.preferred_language !== 'english' && volunteer.languages.includes(member.preferred_language)) {
    score += 20
    reasons.push('Language match')
  }
  // Availability
  if (volunteer.buddy_capacity > volunteer.buddy_active_count) {
    score += 10
    reasons.push('Has buddy capacity')
  } else {
    // At or over capacity
    score -= 10
  }

  return { score, reasons }
}

// Generates a pre-call Aria brief for a buddy (stub — real Claude API call in production).
export async function generateAriaBrief(memberId: string): Promise<{ brief: string; error: string | null }> {
  const admin = createAdminClient()
  const { data: member } = await (admin.from as any)('members')
    .select('preferred_name, topics_enjoy, buddy_match_era, buddy_intro_note')
    .eq('id', memberId)
    .single()

  if (!member) return { brief: '[STUB] Unable to generate Aria brief — member not found.', error: null }

  // Stub implementation — replace with real Claude API call when ANTHROPIC_API_KEY is set
  const topics = (member.topics_enjoy ?? []).slice(0, 3).join(', ') || 'general conversation'
  const era = member.buddy_match_era ? ` who enjoys reminiscing about ${member.buddy_match_era}` : ''
  const note = member.buddy_intro_note ? ` Note from family: "${member.buddy_intro_note}".` : ''

  const brief = `[STUB] ${member.preferred_name} enjoys talking about ${topics}${era}.${note} This is a warm 2–3 sentence brief to help the buddy start the call naturally.`

  return { brief, error: null }
}

// Returns all active buddy assignments across the platform (navigator overview).
export async function getAllActiveBuddyAssignments(): Promise<{ data: Array<BuddyAssignmentRow & { member_name: string; volunteer_name: string }> | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await (admin.from as any)('buddy_assignments')
    .select('*, members(preferred_name, full_name), volunteers(full_name)')
    .in('status', ['active', 'paused', 'ending'])
    .order('assigned_at', { ascending: false })
  if (error) return { data: null, error: error.message }
  const mapped = (data ?? []).map((a: BuddyAssignmentRow & { members: { preferred_name: string; full_name: string } | null; volunteers: { full_name: string } | null }) => ({
    ...a,
    member_name: a.members?.preferred_name ?? a.members?.full_name ?? 'Unknown',
    volunteer_name: a.volunteers?.full_name ?? 'Unknown',
  }))
  return { data: mapped, error: null }
}
