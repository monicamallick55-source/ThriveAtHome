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
