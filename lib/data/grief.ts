import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

export type GriefSupportRequest = Database['public']['Tables']['grief_support_requests']['Row']

export async function createGriefSupportRequest(data: {
  memberId: string
  lossType: string
  circleTypeRequested?: string
  availabilityPreference?: string
  additionalNotes?: string
  lossAnniversaryDate?: string
}): Promise<{ data: GriefSupportRequest | null; error: string | null }> {
  const supabase = createAdminClient()
  const { data: row, error } = await supabase
    .from('grief_support_requests')
    .insert({
      member_id: data.memberId,
      loss_type: data.lossType,
      circle_type_requested: data.circleTypeRequested ?? null,
      availability_preference: data.availabilityPreference ?? null,
      additional_notes: data.additionalNotes ?? null,
      status: 'pending',
      loss_anniversary_date: data.lossAnniversaryDate ?? null,
    })
    .select()
    .single()
  if (error) return { data: null, error: error.message }
  return { data: row, error: null }
}

export async function getGriefSupportRequestsForMember(memberId: string): Promise<{
  data: GriefSupportRequest[] | null
  error: string | null
}> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('grief_support_requests')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function getAllPendingGriefRequests(): Promise<{
  data: (GriefSupportRequest & { members: { preferred_name: string; full_name: string; phone_number: string } | null })[] | null
  error: string | null
}> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('grief_support_requests')
    .select('*, members(preferred_name, full_name, phone_number)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) return { data: null, error: error.message }
  return { data: data as typeof data, error: null }
}

export async function updateGriefRequestStatus(
  requestId: string,
  status: string,
  navigatorNotes?: string
): Promise<{ error: string | null }> {
  const supabase = createAdminClient()
  const update: Partial<Database['public']['Tables']['grief_support_requests']['Update']> = { status }
  if (navigatorNotes !== undefined) update.navigator_notes = navigatorNotes
  if (status === 'matched') update.matched_at = new Date().toISOString()
  const { error } = await supabase
    .from('grief_support_requests')
    .update(update)
    .eq('id', requestId)
  if (error) return { error: error.message }
  return { error: null }
}

export async function setDailyCheckInForGrief(memberId: string): Promise<{ error: string | null }> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('members')
    .update({ check_in_frequency: 'daily' })
    .eq('id', memberId)
  if (error) return { error: error.message }
  return { error: null }
}

/** Returns member IDs with grief anniversaries in the next 7 days (month+day match regardless of year). */
export async function getMembersNearLossAnniversary(): Promise<{
  data: { member_id: string; loss_anniversary_date: string }[] | null
  error: string | null
}> {
  const supabase = createAdminClient()
  const today = new Date()
  // Build the next 7 days as MM-DD strings for matching
  const mmDds: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    mmDds.push(`${mm}-${dd}`)
  }
  // Query all grief requests with an anniversary date set
  const { data, error } = await supabase
    .from('grief_support_requests')
    .select('member_id, loss_anniversary_date')
    .not('loss_anniversary_date', 'is', null)
  if (error) return { data: null, error: error.message }
  // Filter: the MM-DD portion of loss_anniversary_date must be in the next 7 days
  const matches = (data ?? []).filter(r => {
    if (!r.loss_anniversary_date) return false
    const mmDd = r.loss_anniversary_date.slice(5) // "YYYY-MM-DD" → "MM-DD"
    return mmDds.includes(mmDd)
  })
  return { data: matches as { member_id: string; loss_anniversary_date: string }[], error: null }
}

/** Finds members with >= 10 completed calls in the last 90 days where >= 70% have mood_score <= 4.
 *  Returns member IDs that qualify for prolonged grief monitoring. */
export async function detectProlongedGriefMembers(): Promise<{
  data: string[] | null
  error: string | null
}> {
  const supabase = createAdminClient()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)

  const { data, error } = await supabase
    .from('check_in_calls')
    .select('member_id, mood_score')
    .eq('status', 'completed')
    .not('mood_score', 'is', null)
    .gte('created_at', cutoff.toISOString())
  if (error) return { data: null, error: error.message }

  // Group by member_id
  const byMember: Record<string, number[]> = {}
  for (const row of data ?? []) {
    if (!byMember[row.member_id]) byMember[row.member_id] = []
    if (row.mood_score !== null) byMember[row.member_id].push(row.mood_score)
  }

  const flagged: string[] = []
  for (const [memberId, scores] of Object.entries(byMember)) {
    if (scores.length < 10) continue
    const lowCount = scores.filter(s => s <= 4).length
    if (lowCount / scores.length >= 0.7) flagged.push(memberId)
  }
  return { data: flagged, error: null }
}

/** Creates a navigator task for prolonged grief review. Idempotent — skips if task exists. */
export async function createProlongedGriefTask(memberId: string): Promise<{ error: string | null }> {
  const supabase = createAdminClient()
  // Check if an open task of this type already exists for this member
  const { data: existing } = await supabase
    .from('navigator_tasks')
    .select('id')
    .eq('member_id', memberId)
    .eq('task_type', 'prolonged_grief_review')
    .eq('completed', false)
    .maybeSingle()
  if (existing) return { error: null }

  const { error } = await supabase.from('navigator_tasks').insert({
    member_id: memberId,
    task_type: 'prolonged_grief_review',
    description: 'Review for prolonged grief support — member has shown low mood scores for 90+ days.',
    priority: 'high',
  })
  return { error: error?.message ?? null }
}
