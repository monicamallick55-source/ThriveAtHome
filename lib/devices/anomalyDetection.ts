// No-motion smart-home anomaly detection.
// If a member with smart-home sensors has had no motion signal for longer than
// the threshold during waking hours, raise a graduated alert. A very long gap
// escalates through the fall protocol as a no-motion emergency.

import { createAdminClient } from '../supabase/admin'
import { createAlert } from '../alerts/createAlert'
import { handleFallEvent } from './fallProtocol'

/** Hours with no motion that raises a "concern" wellness alert. */
export const NO_MOTION_CONCERN_HOURS = 10
/** Hours with no motion that triggers the no-motion emergency protocol. */
export const NO_MOTION_EMERGENCY_HOURS = 16

export interface NoMotionResult {
  memberId: string
  outcome: 'ok' | 'no_devices' | 'concern_raised' | 'emergency_raised' | 'no_data'
  hoursSinceMotion: number | null
}

/**
 * Check a single member for a no-motion anomaly.
 * Only members with an active smart-home device are evaluated.
 */
export async function detectNoMotionAnomaly(memberId: string): Promise<NoMotionResult> {
  const admin = createAdminClient()

  const { data: devices } = await admin
    .from('member_devices')
    .select('id')
    .eq('member_id', memberId)
    .eq('device_category', 'smart_home')
    .eq('status', 'active')

  if (!devices || devices.length === 0) {
    return { memberId, outcome: 'no_devices', hoursSinceMotion: null }
  }

  const { data: lastMotion } = await admin
    .from('device_signals')
    .select('occurred_at')
    .eq('member_id', memberId)
    .in('signal_type', ['motion', 'door_open', 'button_press', 'light_on'])
    .order('occurred_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!lastMotion) {
    return { memberId, outcome: 'no_data', hoursSinceMotion: null }
  }

  const hoursSinceMotion =
    (Date.now() - new Date(lastMotion.occurred_at).getTime()) / (1000 * 60 * 60)

  if (hoursSinceMotion >= NO_MOTION_EMERGENCY_HOURS) {
    await handleFallEvent({
      memberId,
      source: 'smart_home_no_motion',
      raw: { hoursSinceMotion: Math.round(hoursSinceMotion) },
    })
    return { memberId, outcome: 'emergency_raised', hoursSinceMotion }
  }

  if (hoursSinceMotion >= NO_MOTION_CONCERN_HOURS) {
    await createAlert({
      memberId,
      alertType: 'wellness_drift',
      severity: 'concern',
      message: `No movement detected at home for about ${Math.round(hoursSinceMotion)} hours. A friendly check-in call is recommended.`,
      dedupWindowHours: 12,
    })
    return { memberId, outcome: 'concern_raised', hoursSinceMotion }
  }

  return { memberId, outcome: 'ok', hoursSinceMotion }
}

/**
 * Run the no-motion check for every member with an active smart-home device.
 * Called by /api/cron/smart-home-anomaly.
 */
export async function runNoMotionSweep(): Promise<{
  checked: number
  concern: number
  emergency: number
}> {
  const admin = createAdminClient()
  const { data: rows } = await admin
    .from('member_devices')
    .select('member_id')
    .eq('device_category', 'smart_home')
    .eq('status', 'active')

  const memberIds = Array.from(new Set((rows ?? []).map((r: any) => r.member_id)))
  let concern = 0
  let emergency = 0

  for (const memberId of memberIds) {
    const res = await detectNoMotionAnomaly(memberId)
    if (res.outcome === 'concern_raised') concern++
    if (res.outcome === 'emergency_raised') emergency++
  }

  return { checked: memberIds.length, concern, emergency }
}
