// Fall-detection emergency protocol.
// Runs when a wearable or smart-home signal indicates a probable fall.
// Target: alert + navigator task + Realtime + emergency SMS within 60 seconds.
//
// Reuses the existing alert engine (createAlert with alert_type='fall',
// severity='emergency', writesEmergencyLog=true) so falls flow through the same
// emergency_log / Realtime / SMS pipeline as crisis phrases detected on calls.

import { createAdminClient } from '../supabase/admin'
import { createAlert } from '../alerts/createAlert'

export type FallSource = 'wearable' | 'smart_home_no_motion' | 'manual' | 'voice_assistant'

export interface HandleFallEventParams {
  memberId: string
  source: FallSource
  /** 0..1 detector confidence, when the device reports it */
  confidence?: number
  deviceId?: string | null
  /** Raw payload from the device, stored for audit */
  raw?: Record<string, unknown>
}

export interface HandleFallEventResult {
  fallEventId: string | null
  alertId: string | null
  navigatorTaskId: string | null
  deduplicated: boolean
  error: string | null
}

const SOURCE_LABEL: Record<FallSource, string> = {
  wearable: 'wearable device',
  smart_home_no_motion: 'no-motion smart-home anomaly',
  manual: 'manual report',
  voice_assistant: 'voice assistant',
}

/**
 * Process a probable fall: write the fall_events audit row, raise an emergency
 * alert, open a critical navigator task, and link them all together.
 * Never throws — returns an error string instead so callers (webhooks, crons)
 * stay resilient.
 */
export async function handleFallEvent(
  params: HandleFallEventParams
): Promise<HandleFallEventResult> {
  const { memberId, source, confidence, deviceId, raw } = params
  const admin = createAdminClient()

  const result: HandleFallEventResult = {
    fallEventId: null,
    alertId: null,
    navigatorTaskId: null,
    deduplicated: false,
    error: null,
  }

  try {
    // Step 1 — emergency alert (dedup 1h so a burst of signals raises one alert)
    const label = SOURCE_LABEL[source]
    const confidenceText =
      typeof confidence === 'number' ? ` (detector confidence ${Math.round(confidence * 100)}%)` : ''
    const message = `Possible fall detected via ${label}${confidenceText}. Emergency contacts and the on-call navigator have been notified.`

    const alertResult = await createAlert({
      memberId,
      alertType: 'fall',
      severity: 'emergency',
      message,
      dedupWindowHours: 1,
      writesEmergencyLog: true,
      triggeredPhrase: `device_fall:${source}`,
    })
    result.alertId = alertResult.alertId
    result.deduplicated = alertResult.deduplicated
    if (alertResult.error) result.error = alertResult.error

    // Step 2 — critical navigator task (skip the duplicate when the alert was deduped)
    if (!alertResult.deduplicated) {
      const { data: task, error: taskError } = await admin
        .from('navigator_tasks')
        .insert({
          member_id: memberId,
          task_type: 'fall_response',
          description: `${message} Call the member now; if no answer, call emergency contacts, then dispatch 911 wellness check.`,
          priority: 'critical',
          due_by: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        })
        .select('id')
        .maybeSingle()
      if (taskError) {
        console.error('[devices/fallProtocol] navigator_tasks insert failed:', taskError)
      } else {
        result.navigatorTaskId = task?.id ?? null
      }
    }

    // Step 3 — fall_events audit row (always written, even on dedup, for the trail)
    const { data: fallEvent, error: fallError } = await admin
      .from('fall_events')
      .insert({
        member_id: memberId,
        device_id: deviceId ?? null,
        source,
        confidence: typeof confidence === 'number' ? confidence : null,
        alert_id: result.alertId,
        navigator_task_id: result.navigatorTaskId,
        raw: raw ?? {} as any,
      })
      .select('id')
      .maybeSingle()
    if (fallError) {
      console.error('[devices/fallProtocol] fall_events insert failed:', fallError)
      if (!result.error) result.error = fallError.message
    } else {
      result.fallEventId = fallEvent?.id ?? null
    }

    return result
  } catch (e) {
    console.error('[devices/fallProtocol] Unexpected error:', e)
    result.error = e instanceof Error ? e.message : String(e)
    return result
  }
}
