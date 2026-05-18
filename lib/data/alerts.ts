// Alert data access functions — server-side only, uses admin client.
import { createAdminClient } from '../supabase/admin'
import type { Database } from '../../types/database'

export type Alert = Database['public']['Tables']['alerts']['Row']

/** Fetch alerts for a member, newest first. */
export async function getAlertsForMember(
  memberId: string,
  limit = 50
): Promise<{ data: Alert[] | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('alerts')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) {
      console.error('[data/alerts/getAlertsForMember]', error)
      return { data: null, error: error.message }
    }
    return { data: (data ?? []) as Alert[], error: null }
  } catch (e) {
    console.error('[data/alerts/getAlertsForMember] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Count unacknowledged alerts for a member. */
export async function getUnacknowledgedAlertsCount(
  memberId: string
): Promise<{ data: number | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { count, error } = await admin
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId)
      .eq('acknowledged', false)
    if (error) {
      console.error('[data/alerts/getUnacknowledgedAlertsCount]', error)
      return { data: null, error: error.message }
    }
    return { data: count ?? 0, error: null }
  } catch (e) {
    console.error('[data/alerts/getUnacknowledgedAlertsCount] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Mark an alert acknowledged by a given family member UUID. */
export async function acknowledgeAlert(
  alertId: string,
  acknowledgedBy: string
): Promise<{ data: Alert | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('alerts')
      .update({ acknowledged: true, acknowledged_by: acknowledgedBy, acknowledged_at: new Date().toISOString() })
      .eq('id', alertId)
      .select('*')
      .maybeSingle()
    if (error) {
      console.error('[data/alerts/acknowledgeAlert]', error)
      return { data: null, error: error.message }
    }
    if (!data) return { data: null, error: 'Not found' }
    return { data: data as Alert, error: null }
  } catch (e) {
    console.error('[data/alerts/acknowledgeAlert] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}
