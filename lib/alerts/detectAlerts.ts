// Analyses a completed call and fires all applicable alert rules.
// Called after every check-in call is processed.

import { createAdminClient } from '../supabase/admin'
import { createAlert } from './createAlert'
import { ALERT_RULES } from './rules'

/** Minimum calls in the last 7 days required for wellness drift detection. */
const WELLNESS_DRIFT_MIN_CALLS = 4
/** Total calls in the rolling window for drift calculation. */
const WELLNESS_DRIFT_WINDOW = 14
/** Mood point difference between recent and prior half that triggers a drift alert. */
const WELLNESS_DRIFT_THRESHOLD = 1.5

/**
 * Runs all 8 alert rules against a completed call.
 * Each triggered rule calls createAlert, which handles deduplication internally.
 */
export async function detectAlertsForCall(
  callId: string,
  memberId: string,
): Promise<void> {
  const admin = createAdminClient()

  // Fetch the call
  const { data: call, error: callError } = await admin
    .from('check_in_calls')
    .select('id, mood_score, medication_taken, alert_flags, status, member_id')
    .eq('id', callId)
    .maybeSingle()

  if (callError || !call) {
    console.error('[alerts/detect] Could not fetch call:', callError)
    return
  }

  const flags: string[] = Array.isArray(call.alert_flags) ? call.alert_flags as string[] : []

  // Rule 1 — missed call
  if (call.status === 'missed' || call.status === 'failed') {
    await createAlert({
      memberId,
      callId,
      ...ALERT_RULES.missed_call_informational,
      message: 'A scheduled check-in call was not completed.',
    })
    return // no further rules apply to a missed call
  }

  // Rule 2 & 3 — mood drop
  if (typeof call.mood_score === 'number') {
    if (call.mood_score <= 3) {
      await createAlert({
        memberId,
        callId,
        ...ALERT_RULES.mood_drop_urgent,
        message: `Mood score was ${call.mood_score}/10 — significantly lower than normal.`,
      })
    } else if (call.mood_score <= 5) {
      await createAlert({
        memberId,
        callId,
        ...ALERT_RULES.mood_drop_concern,
        message: `Mood score was ${call.mood_score}/10 — lower than usual.`,
      })
    }
  }

  // Rule 4 — medication miss
  if (call.medication_taken === false) {
    await createAlert({
      memberId,
      callId,
      ...ALERT_RULES.medication_miss,
      message: 'Medications were not taken as reported on the check-in call.',
    })
  }

  // Rule 6 — fall
  if (flags.includes('fall')) {
    await createAlert({
      memberId,
      callId,
      ...ALERT_RULES.fall,
      message: 'A mention of a fall was detected during the check-in call.',
      triggeredPhrase: 'fall',
    })
  }

  // Rule 7 — crisis
  if (flags.includes('crisis')) {
    await createAlert({
      memberId,
      callId,
      ...ALERT_RULES.crisis,
      message: 'A crisis-level phrase was detected during the check-in call. Immediate attention required.',
      triggeredPhrase: flags.find(f => f === 'crisis') ?? 'crisis',
    })
  }

  // Rule 8 — emergency
  if (flags.includes('emergency')) {
    await createAlert({
      memberId,
      callId,
      ...ALERT_RULES.emergency,
      message: 'An emergency was reported during the check-in call. Immediate response required.',
      triggeredPhrase: flags.find(f => f === 'emergency') ?? 'emergency',
    })
  }

  // Rule 5 — wellness drift (checked last — needs recent call history)
  await detectWellnessDrift(memberId)
}

/**
 * Wellness drift: compares average mood of the most recent 7 calls to the prior 7.
 * Requires at least WELLNESS_DRIFT_MIN_CALLS in the last 7 days and
 * WELLNESS_DRIFT_WINDOW total calls with mood scores.
 */
export async function detectWellnessDrift(memberId: string): Promise<void> {
  const admin = createAdminClient()

  // Fetch last WELLNESS_DRIFT_WINDOW completed calls with mood scores, newest first
  const { data: calls, error } = await admin
    .from('check_in_calls')
    .select('mood_score, created_at')
    .eq('member_id', memberId)
    .eq('status', 'completed')
    .not('mood_score', 'is', null)
    .order('created_at', { ascending: false })
    .limit(WELLNESS_DRIFT_WINDOW)

  if (error || !calls || calls.length < WELLNESS_DRIFT_WINDOW) return

  // Confirm minimum calls in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentCount = calls.filter(c => new Date(c.created_at) >= sevenDaysAgo).length
  if (recentCount < WELLNESS_DRIFT_MIN_CALLS) return

  const scores = calls.map((c: any) => c.mood_score as number)
  const half = WELLNESS_DRIFT_WINDOW / 2

  const recentAvg = scores.slice(0, half).reduce((a, b) => a + b, 0) / half
  const priorAvg  = scores.slice(half).reduce((a, b) => a + b, 0) / half

  if (priorAvg - recentAvg >= WELLNESS_DRIFT_THRESHOLD) {
    await createAlert({
      memberId,
      ...ALERT_RULES.wellness_drift,
      message: `Wellness score has declined by ${(priorAvg - recentAvg).toFixed(1)} points over the last two weeks.`,
    })
  }
}
