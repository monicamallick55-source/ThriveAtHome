// Server-side helper to push a notification into realtime_notifications.
// Logs on failure but never throws — notification failure must not crash the calling pipeline.
import { createAdminClient } from '../supabase/admin'
import type { Tables } from '@/types/database'
type NotifType = any
type NotifSeverity = any

export interface RealtimeNotification {
  type: NotifType
  memberId: string
  title: string
  body: string
  severity?: NotifSeverity
  callId?: string
  alertId?: string
}

export async function pushRealtimeNotification(n: RealtimeNotification): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('realtime_notifications').insert({
    type: n.type,
    member_id: n.memberId,
    title: n.title,
    body: n.body,
    severity: n.severity ?? 'info',
    call_id: n.callId ?? null,
    alert_id: n.alertId ?? null,
  })
  if (error) console.error('[realtime/push] Insert failed:', error)
  // Never throw — callers must continue even if notification delivery fails
}
