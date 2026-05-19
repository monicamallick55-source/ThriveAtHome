// Alert rule definitions — 8 rules that govern when alerts are created and at what severity.

import type { Database } from '../../types/database'

type AlertType = Database['public']['Enums']['alert_type']
type AlertSeverity = Database['public']['Enums']['alert_severity']

export interface AlertRule {
  /** Unique name for the rule (used in test assertions) */
  name: string
  alertType: AlertType
  severity: AlertSeverity
  /** Hours before the same type can fire again for the same member (0 = always create) */
  dedupWindowHours: number
  /** Whether to write emergency_log BEFORE the alerts insert */
  writesEmergencyLog: boolean
}

/**
 * All 8 alert rules. The detection logic in detectAlerts.ts decides which rules to apply
 * based on call data. createAlert.ts applies deduplication and persists each rule.
 */
export const ALERT_RULES: Record<string, AlertRule> = {
  // Rule 1 — missed call (informational — first occurrence, or call failed)
  missed_call_informational: {
    name: 'missed_call_informational',
    alertType: 'missed_call',
    severity: 'informational',
    dedupWindowHours: 24,
    writesEmergencyLog: false,
  },

  // Rule 2 — mood drop (concern — score ≤ 5)
  mood_drop_concern: {
    name: 'mood_drop_concern',
    alertType: 'mood_drop',
    severity: 'concern',
    dedupWindowHours: 24,
    writesEmergencyLog: false,
  },

  // Rule 3 — mood drop (urgent — score ≤ 3, high risk of acute distress)
  mood_drop_urgent: {
    name: 'mood_drop_urgent',
    alertType: 'mood_drop',
    severity: 'urgent',
    dedupWindowHours: 24,
    writesEmergencyLog: false,
  },

  // Rule 4 — medication missed (medication_taken = false confirmed on call)
  medication_miss: {
    name: 'medication_miss',
    alertType: 'medication_miss',
    severity: 'concern',
    dedupWindowHours: 24,
    writesEmergencyLog: false,
  },

  // Rule 5 — wellness drift (sustained mood decline over 14-call rolling window)
  wellness_drift: {
    name: 'wellness_drift',
    alertType: 'wellness_drift',
    severity: 'concern',
    dedupWindowHours: 168, // 7-day deduplication
    writesEmergencyLog: false,
  },

  // Rule 6 — fall mentioned in call flags
  fall: {
    name: 'fall',
    alertType: 'fall',
    severity: 'urgent',
    dedupWindowHours: 0, // always create — each fall event matters
    writesEmergencyLog: false,
  },

  // Rule 7 — crisis phrase detected (emergency_log written first)
  crisis: {
    name: 'crisis',
    alertType: 'crisis',
    severity: 'emergency',
    dedupWindowHours: 0,
    writesEmergencyLog: true,
  },

  // Rule 8 — explicit emergency (emergency_log written first)
  emergency: {
    name: 'emergency',
    alertType: 'emergency',
    severity: 'emergency',
    dedupWindowHours: 0,
    writesEmergencyLog: true,
  },
}
