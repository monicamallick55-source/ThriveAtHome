// Barrel export for the alerts module.
export { createAlert } from './createAlert'
export type { CreateAlertParams, CreateAlertResult } from './createAlert'
export { detectAlertsForCall, detectWellnessDrift } from './detectAlerts'
export { ALERT_RULES } from './rules'
export type { AlertRule } from './rules'
export { handleCrisisDetection, scanForCrisisPhrase, CRISIS_PHRASES } from './detectCrisis'
export type { CrisisDetectionParams } from './detectCrisis'
