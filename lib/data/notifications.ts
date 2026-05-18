// Realtime notification data access functions — server-side only, uses admin client.
import { createAdminClient } from '../supabase/admin'
import type { Database } from '../../types/database'

export type RealtimeNotification = Database['public']['Tables']['realtime_notifications']['Row']

/** Fetch notifications for a member, newest first. */
export async function getNotificationsForMember(
  memberId: string,
  limit = 30
): Promise<{ data: RealtimeNotification[] | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('realtime_notifications')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) {
      console.error('[data/notifications/getNotificationsForMember]', error)
      return { data: null, error: error.message }
    }
    return { data: (data ?? []) as RealtimeNotification[], error: null }
  } catch (e) {
    console.error('[data/notifications/getNotificationsForMember] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Mark a single notification as read. */
export async function markNotificationRead(
  notificationId: string
): Promise<{ data: RealtimeNotification | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('realtime_notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select('*')
      .maybeSingle()
    if (error) {
      console.error('[data/notifications/markNotificationRead]', error)
      return { data: null, error: error.message }
    }
    if (!data) return { data: null, error: 'Not found' }
    return { data: data as RealtimeNotification, error: null }
  } catch (e) {
    console.error('[data/notifications/markNotificationRead] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}
