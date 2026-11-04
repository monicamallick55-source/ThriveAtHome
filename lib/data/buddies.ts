import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { BuddyAssignment, BuddyAssignmentInsert, BuddyCall, BuddyCallInsert, AriaBrief } from '@/types/buddy'
import Anthropic from '@anthropic-ai/sdk'

function supabase() { return createClient() }
function admin() { return createAdminClient() }

export async function getActiveBuddyAssignment(memberId: string): Promise<{ data: BuddyAssignment | null; error: unknown }> {
  const { data, error } = await (supabase() as any)
    .from('buddy_assignments')
    .select('*, volunteer:volunteers(id,first_name,last_name,buddy_bio,buddy_capacity,buddy_active_count,email), member:members(id,first_name,last_name,preferred_name,has_active_buddy)')
    .eq('member_id', memberId).eq('status', 'active').single()
  return { data: data as BuddyAssignment | null, error }
}

export async function getBuddyAssignments(volunteerId: string): Promise<{ data: BuddyAssignment[]; error: unknown }> {
  const { data, error } = await (supabase() as any)
    .from('buddy_assignments')
    .select('*, member:members(id,first_name,last_name,preferred_name,has_active_buddy), buddy_calls(id,started_at,duration_minutes,call_quality,concern_flag,milestone_flag,created_at)')
    .eq('volunteer_id', volunteerId).in('status', ['active','paused','ending']).order('assigned_at', { ascending: false })
  return { data: (data ?? []) as BuddyAssignment[], error }
}

export async function createBuddyAssignment(data: BuddyAssignmentInsert): Promise<{ data: BuddyAssignment | null; error: unknown }> {
  const db = admin() as any
  const { data: assignment, error: assignError } = await db.from('buddy_assignments').insert(data).select().single()
  if (assignError || !assignment) return { data: null, error: assignError }
  await db.from('volunteers').update({ buddy_active_count: db.rpc('greatest', {}) }).eq('id', data.volunteer_id)
  await db.from('members').update({ has_active_buddy: true }).eq('id', data.member_id)
  return { data: assignment as BuddyAssignment, error: null }
}

export async function endBuddyAssignment(assignmentId: string, reason: string): Promise<{ data: BuddyAssignment | null; error: unknown }> {
  const db = admin() as any
  const { data: existing } = await db.from('buddy_assignments').select('volunteer_id,member_id').eq('id', assignmentId).single()
  const { data, error } = await db.from('buddy_assignments').update({ status: 'ended', ended_at: new Date().toISOString(), end_reason: reason }).eq('id', assignmentId).select().single()
  if (error || !existing) return { data: null, error }
  const { data: otherActive } = await db.from('buddy_assignments').select('id').eq('member_id', existing.member_id).eq('status', 'active').neq('id', assignmentId).limit(1)
  if (!otherActive || otherActive.length === 0) {
    await db.from('members').update({ has_active_buddy: false }).eq('id', existing.member_id)
  }
  return { data: data as BuddyAssignment, error: null }
}

export async function getBuddyCalls(assignmentId: string, limit = 20): Promise<{ data: BuddyCall[]; error: unknown }> {
  const { data, error } = await (supabase() as any)
    .from('buddy_calls')
    .select('*, volunteer:volunteers(first_name,last_name), member:members(first_name,preferred_name)')
    .eq('assignment_id', assignmentId).order('created_at', { ascending: false }).limit(limit)
  return { data: (data ?? []) as BuddyCall[], error }
}

export async function createBuddyCall(data: BuddyCallInsert): Promise<{ data: BuddyCall | null; error: unknown }> {
  const { data: call, error } = await (supabase() as any).from('buddy_calls').insert(data).select().single()
  return { data: call as BuddyCall | null, error }
}

export async function getUnacknowledgedConcernFlags(navigatorId: string): Promise<{ data: BuddyCall[]; error: unknown }> {
  const db = admin() as any
  const { data: memberLinks } = await db.from('member_navigators').select('member_id').eq('navigator_id', navigatorId)
  const memberIds = (memberLinks ?? []).map((m: { member_id: string }) => m.member_id)
  if (memberIds.length === 0) return { data: [], error: null }
  const { data, error } = await db.from('buddy_calls')
    .select('*, volunteer:volunteers(first_name,last_name), member:members(first_name,preferred_name)')
    .in('member_id', memberIds).eq('concern_flag', true).order('created_at', { ascending: false })
  return { data: (data ?? []) as BuddyCall[], error }
}

export async function generateAriaBrief(memberId: string): Promise<{ data: AriaBrief | null; error: unknown }> {
  const db = admin() as any
  const { data: member, error: memberError } = await db.from('members').select('first_name,preferred_name').eq('id', memberId).single()
  if (memberError || !member) return { data: null, error: memberError }
  const memberName = member.preferred_name || member.first_name
  const { data: calls } = await db.from('check_in_calls').select('summary,mood_score,energy_score,created_at').eq('member_id', memberId).not('summary', 'is', null).order('created_at', { ascending: false }).limit(2)
  if (!calls || calls.length === 0) {
    return { data: { memberId, memberName, briefText: `${memberName} is looking forward to your call! This will be a wonderful chance to get to know each other.`, generatedAt: new Date().toISOString(), sourceSummaryCount: 0 }, error: null }
  }
  const callContext = calls.map((c: { created_at: string; summary: string; mood_score?: number }) => {
    const date = new Date(c.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    return `Call from ${date}: ${c.summary}${c.mood_score ? ` (Mood: ${c.mood_score}/5)` : ''}`
  }).join('\n\n')
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514', max_tokens: 200,
      messages: [{ role: 'user', content: `You are writing a warm, friendly briefing for a volunteer buddy about to call their senior friend named ${memberName}. In 2-3 sentences, summarise what has been happening with this person based on their recent AI check-in calls. Write as a caring friend, not a medical professional. Never use clinical language.\n\nRecent check-in data:\n${callContext}` }],
    })
    const briefText = response.content[0].type === 'text' ? response.content[0].text : `${memberName} has been chatting with our AI check-in recently. Have a warm conversation!`
    return { data: { memberId, memberName, briefText, generatedAt: new Date().toISOString(), sourceSummaryCount: calls.length }, error: null }
  } catch {
    return { data: { memberId, memberName, briefText: `${memberName} will be happy to hear from you. Ask how their week has been going.`, generatedAt: new Date().toISOString(), sourceSummaryCount: calls.length }, error: null }
  }
}

export function scoreBuddyVolunteer(
  member: {
    city?: string | null
    languages_spoken?: string[] | null
    buddy_match_topics?: string[] | null
  },
  volunteer: {
    city?: string | null
    languages_spoken?: string[] | null
    interests?: string[] | null
    buddy_active_count?: number
    buddy_capacity?: number
  }
): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  if (member.city && volunteer.city && member.city.toLowerCase() === volunteer.city.toLowerCase()) {
    score += 20
    reasons.push('Same city')
  }

  const memberTopics = member.buddy_match_topics ?? []
  const volunteerInterests = volunteer.interests ?? []
  const shared = memberTopics.filter(t =>
    volunteerInterests.some(i => i.toLowerCase().includes(t.toLowerCase().split(' ')[0]))
  )
  score += Math.min(shared.length * 15, 45)
  if (shared.length > 0) reasons.push(`Shared interests: ${shared.slice(0, 2).join(', ')}`)

  const memberLangs = member.languages_spoken ?? ['English']
  const volunteerLangs = volunteer.languages_spoken ?? ['English']
  const langMatch = memberLangs.some(l => volunteerLangs.includes(l) && l !== 'English')
  if (langMatch) { score += 20; reasons.push('Language match') }

  const activeCount = volunteer.buddy_active_count ?? 0
  const capacity = volunteer.buddy_capacity ?? 3
  if (activeCount < capacity / 2) { score += 10; reasons.push('Good availability') }

  return { score, reasons }
}
