import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface CelebrationEvent {
  id: string
  created_at: string
  member_id: string
  celebration_type: string
  event_date: string
  status: string
  ai_message: string | null
  family_notified_at: string | null
  community_posted_at: string | null
}

export async function getCelebrationEvents(
  memberId: string
): Promise<{ data: CelebrationEvent[] | null; error: string | null }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('celebration_events')
    .select('*')
    .eq('member_id', memberId)
    .order('event_date', { ascending: false })
  if (error) return { data: null, error: error.message }
  return { data: data as CelebrationEvent[], error: null }
}

export async function getUpcomingCelebrationEvents(
  memberId: string
): Promise<{ data: CelebrationEvent[] | null; error: string | null }> {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('celebration_events')
    .select('*')
    .eq('member_id', memberId)
    .gte('event_date', today)
    .order('event_date', { ascending: true })
  if (error) return { data: null, error: error.message }
  return { data: data as CelebrationEvent[], error: null }
}

export async function createCelebrationEvent(event: {
  member_id: string
  celebration_type: string
  event_date: string
  status?: string
  ai_message?: string | null
}): Promise<{ data: CelebrationEvent | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('celebration_events')
    .insert({ ...event })
    .select()
    .single()
  if (error) return { data: null, error: error.message }
  return { data: data as CelebrationEvent, error: null }
}

export async function getExistingBirthdayCelebration(
  memberId: string,
  year: number
): Promise<{ exists: boolean; error: string | null }> {
  const admin = createAdminClient()
  const yearStart = `${year}-01-01`
  const yearEnd = `${year}-12-31`
  const { data, error } = await admin
    .from('celebration_events')
    .select('id')
    .eq('member_id', memberId)
    .eq('celebration_type', 'birthday')
    .gte('event_date', yearStart)
    .lte('event_date', yearEnd)
    .limit(1)
  if (error) return { exists: false, error: error.message }
  return { exists: (data?.length ?? 0) > 0, error: null }
}

export async function markCelebrationNotified(
  celebrationId: string
): Promise<void> {
  const admin = createAdminClient()
  await admin
    .from('celebration_events')
    .update({ family_notified_at: new Date().toISOString() })
    .eq('id', celebrationId)
}

export function getNextBirthdayDate(dateOfBirth: string): Date {
  const today = new Date()
  const dob = new Date(dateOfBirth + 'T00:00:00Z')
  const thisYearBirthday = new Date(
    today.getFullYear(),
    dob.getUTCMonth(),
    dob.getUTCDate()
  )
  if (thisYearBirthday < today) {
    thisYearBirthday.setFullYear(today.getFullYear() + 1)
  }
  return thisYearBirthday
}

export function isTodayBirthday(dateOfBirth: string): boolean {
  const today = new Date()
  const todayMD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return dateOfBirth.slice(5) === todayMD
}

/** Check whether a milestone celebration event already exists for this member+type. */
export async function getMilestoneExists(
  memberId: string,
  celebrationType: string
): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('celebration_events')
    .select('id')
    .eq('member_id', memberId)
    .eq('celebration_type', celebrationType)
    .limit(1)
  return (data?.length ?? 0) > 0
}

/** Get unique calendar dates (YYYY-MM-DD) of all completed calls for a member, newest first. */
export async function getCompletedCallDatesForStreak(
  memberId: string
): Promise<string[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('check_in_calls')
    .select('scheduled_at, created_at')
    .eq('member_id', memberId)
    .eq('status', 'completed')
    .order('scheduled_at', { ascending: false, nullsFirst: false })

  if (!data) return []
  const dateSet = new Set<string>()
  for (const call of data) {
    const raw = (call.scheduled_at as string | null) ?? (call.created_at as string)
    dateSet.add(raw.slice(0, 10))
  }
  return Array.from(dateSet).sort().reverse()
}

/** Returns true if the sorted-descending date list contains at least 30 consecutive calendar days. */
export function has30DayStreak(sortedDatesDesc: string[]): boolean {
  if (sortedDatesDesc.length < 30) return false
  const asc = [...sortedDatesDesc].sort()
  let streak = 1
  for (let i = 1; i < asc.length; i++) {
    const prev = new Date(asc[i - 1] + 'T00:00:00Z')
    const curr = new Date(asc[i] + 'T00:00:00Z')
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) {
      streak++
      if (streak >= 30) return true
    } else {
      streak = 1
    }
  }
  return false
}

/** Get the N most recent celebration events for a member (upcoming or past). */
export async function getRecentCelebrationEvents(
  memberId: string,
  limit = 3
): Promise<{ data: CelebrationEvent[] | null; error: string | null }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('celebration_events')
    .select('*')
    .eq('member_id', memberId)
    .order('event_date', { ascending: false })
    .limit(limit)
  if (error) return { data: null, error: error.message }
  return { data: data as CelebrationEvent[], error: null }
}
