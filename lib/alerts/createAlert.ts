// Creates a single alert with deduplication and Realtime notification.
// Writes emergency_log BEFORE the alerts insert for crisis/emergency types.

import { createAdminClient } from '../supabase/admin'
import { pushRealtimeNotification } from '../realtime/notifications'
import { smsProvider } from '../providers'
import type { Database } from '../../types/database'

type AlertType = Database['public']['Enums']['alert_type']
type AlertSeverity = Database['public']['Enums']['alert_severity']

// ICD-10 codes mapped by alert type for MA Outcomes reporting (Phase 76)
const ICD10_BY_ALERT_TYPE: Record<string, string[]> = {
  fall:             ['W19.XXXA', 'Z91.81'],  // Unspecified fall + history of falls
  medication_miss:  ['Z79.899'],             // Long-term drug therapy status
  mood_drop:        ['F32.9', 'F33.9'],      // Depressive episode / recurrent
  missed_call:      ['Z75.8'],               // Problems related to healthcare access
  wellness_drift:   ['Z74.3'],               // Need for continuous supervision
  crisis:           ['R45.851'],             // Suicidal ideation
  emergency:        ['R55'],                 // Syncope/emergency
}

export interface CreateAlertParams {
  memberId: string
  callId?: string
  alertType: AlertType
  severity: AlertSeverity
  message: string
  /** Hours before this type can fire again for the same member (0 = always create) */
  dedupWindowHours: number
  /** Write to emergency_log before alerts insert — must survive even if alerts insert fails */
  writesEmergencyLog?: boolean
  /** Original phrase that triggered a crisis/emergency rule (for emergency_log) */
  triggeredPhrase?: string
  /** Override ICD-10 codes (defaults to ICD10_BY_ALERT_TYPE mapping) */
  icd10Codes?: string[]
}

export interface CreateAlertResult {
  alertId: string | null
  /** true if a duplicate was found and no new row was inserted */
  deduplicated: boolean
  error: string | null
}

/**
 * Creates an alert with full deduplication, emergency log priority, and Realtime push.
 * Emergency log is written first — it must persist even if the alert insert fails.
 */
export async function createAlert(params: CreateAlertParams): Promise<CreateAlertResult> {
  const {
    memberId, callId, alertType, severity, message,
    dedupWindowHours, writesEmergencyLog = false, triggeredPhrase, icd10Codes,
  } = params
  const resolvedIcd10 = icd10Codes ?? ICD10_BY_ALERT_TYPE[alertType] ?? []

  const admin = createAdminClient()

  // Step 1 — write emergency_log FIRST for crisis/emergency types
  if (writesEmergencyLog) {
    const { error: logError } = await admin.from('emergency_log').insert({
      member_id: memberId,
      call_id: callId ?? null,
      alert_type: alertType,
      triggered_phrase: triggeredPhrase ?? null,
    })
    if (logError) {
      console.error('[alerts/createAlert] emergency_log insert failed:', logError)
      // Do not return — the alert insert must still be attempted
    }
  }

  // Step 2 — deduplication check
  if (dedupWindowHours > 0) {
    const windowStart = new Date(Date.now() - dedupWindowHours * 60 * 60 * 1000).toISOString()
    const { data: existing, error: dedupError } = await admin
      .from('alerts')
      .select('id')
      .eq('member_id', memberId)
      .eq('alert_type', alertType)
      .gte('created_at', windowStart)
      .limit(1)
      .maybeSingle()

    if (dedupError) {
      console.error('[alerts/createAlert] Dedup query failed:', dedupError)
      return { alertId: null, deduplicated: false, error: dedupError.message }
    }

    if (existing) {
      return { alertId: existing.id, deduplicated: true, error: null }
    }
  }

  // Step 3 — insert alert (alerts table has no call_id column; callId flows to emergency_log + notifs)
  const { data: alert, error: insertError } = await admin
    .from('alerts')
    .insert({
      member_id: memberId,
      alert_type: alertType,
      severity,
      message,
      icd10_codes: resolvedIcd10,
    })
    .select('id')
    .maybeSingle()

  if (insertError || !alert) {
    console.error('[alerts/createAlert] Alert insert failed:', insertError)
    return { alertId: null, deduplicated: false, error: insertError?.message ?? 'Insert returned no data' }
  }

  // Step 4 — push Realtime notification (never throws, logged on failure)
  await pushRealtimeNotification({
    type: 'new_alert',
    memberId,
    title: severityToTitle(severity),
    body: message,
    severity: alertSeverityToNotifSeverity(severity),
    alertId: alert.id,
    callId,
  })

  // Step 5 — emergency SMS to all linked family members
  if (severity === 'emergency') {
    try {
      const { data: familyMembers } = await admin
        .from('family_members')
        .select('phone')
        .eq('member_id', memberId)
        .not('phone', 'is', null)
      if (familyMembers && familyMembers.length > 0) {
        await Promise.allSettled(
          familyMembers
            .filter((fm) => fm.phone)
            .map((fm) => smsProvider.sendUrgent(fm.phone!, message))
        )
      }
    } catch (e) {
      console.error('[alerts/createAlert] Emergency SMS failed:', e)
    }
  }

  return { alertId: alert.id, deduplicated: false, error: null }
}

function severityToTitle(severity: AlertSeverity): string {
  switch (severity) {
    case 'emergency': return '🚨 Emergency Alert'
    case 'urgent':    return '⚠️ Urgent Alert'
    case 'concern':   return 'Alert: Attention Needed'
    default:          return 'Health Update'
  }
}

function alertSeverityToNotifSeverity(
  severity: AlertSeverity,
): 'info' | 'concern' | 'urgent' | 'emergency' {
  switch (severity) {
    case 'emergency':    return 'emergency'
    case 'urgent':       return 'urgent'
    case 'concern':      return 'concern'
    case 'informational': return 'info'
    default:             return 'info'
  }
}
