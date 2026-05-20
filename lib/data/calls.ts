// Check-in call data access functions — server-side only, uses admin client.
import { createAdminClient } from '../supabase/admin'
import type { Database } from '../../types/database'

export type CheckInCall = Database['public']['Tables']['check_in_calls']['Row']

/** Fetch paginated calls for a member, newest first. */
export async function getCallsForMember(
  memberId: string,
  limit = 20,
  offset = 0
): Promise<{ data: CheckInCall[] | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('check_in_calls')
      .select('*')
      .eq('member_id', memberId)
      .order('scheduled_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) {
      console.error('[data/calls/getCallsForMember]', error)
      return { data: null, error: error.message }
    }
    return { data: (data ?? []) as CheckInCall[], error: null }
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
