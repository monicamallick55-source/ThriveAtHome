// Check-in call data access functions — server-side only, uses admin client.
import { createAdminClient } from '../supabase/admin'
import { writeAuditLog } from './audit'
import type { Database } from '../../types/database'

export type CheckInCall = Database['public']['Tables']['check_in_calls']['Row']

// Family-facing view of a call. Family never sees transcripts, recordings or phone numbers.
export const FAMILY_CALL_COLUMNS = [
  'id', 'created_at', 'member_id', 'call_type', 'scheduled_at', 'started_at', 'ended_at',
  'duration_seconds', 'status', 'mood_score', 'energy_score', 'pain_score', 'medication_taken',
  'ai_summary', 'alert_flags', 'pain_mentioned', 'medication_adherence', 'social_isolation_signal',
  'fall_risk_mention', 'cognitive_concern_signal', 'agent_name', 'direction',
] as const
export type FamilyCall = Pick<CheckInCall, typeof FAMILY_CALL_COLUMNS[number]>

/** Fetch paginated calls for a member (family-safe columns), newest first. Pass callerUserId to emit an audit log entry. */
export async function getCallsForMember(
  memberId: string,
  limit = 20,
  offset = 0,
  callerUserId?: string
): Promise<{ data: FamilyCall[] | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('check_in_calls')
      .select(FAMILY_CALL_COLUMNS.join(', '))
      .eq('member_id', memberId)
      .order('scheduled_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) {
      console.error('[data/calls/getCallsForMember]', error)
      return { data: null, error: error.message }
    }
    if (callerUserId) {
      void writeAuditLog('calls_viewed', 'check_in_calls', memberId, callerUserId)
    }
    return { data: (data ?? []) as unknown as FamilyCall[], error: null }
  } catch (e) {
    console.error('[data/calls/getCallsForMember] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Return the total number of completed calls for a member. */
export async function getCallCountForMember(
  memberId: string
): Promise<{ data: number | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { count, error } = await admin
      .from('check_in_calls')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId)
    if (error) {
      console.error('[data/calls/getCallCountForMember]', error)
      return { data: null, error: error.message }
    }
    return { data: count ?? 0, error: null }
  } catch (e) {
    console.error('[data/calls/getCallCountForMember] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Fetch a single call by ID. */
export async function getCallById(
  callId: string
): Promise<{ data: CheckInCall | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('check_in_calls')
      .select('*')
      .eq('id', callId)
      .maybeSingle()
    if (error) {
      console.error('[data/calls/getCallById]', error)
      return { data: null, error: error.message }
    }
    if (!data) return { data: null, error: 'Not found' }
    return { data: data as CheckInCall, error: null }
  } catch (e) {
    console.error('[data/calls/getCallById] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}
