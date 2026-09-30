// Crisis detection — phrase scanning and 5-step escalation pipeline.
// Runs FIRST in every call processing pipeline, wrapped in its own try/catch.

import { createAdminClient } from '../supabase/admin'
import { createAlert } from './createAlert'
import { ALERT_RULES } from './rules'
import { sendCareTeamUrgent } from './careTeamSms'

/**
 * Crisis phrases (medical emergencies + suicidal ideation) that trigger immediate escalation.
 * Matched case-insensitively against the call transcript.
 * Specific enough that benign phrases like "fell asleep" do not match.
 */
export const CRISIS_PHRASES: readonly string[] = [
  "i've fallen",
  "i have fallen",
  "i fell down",
  "i can't get up",
  "i cannot get up",
  "i need help now",
  "call 911",
  "call an ambulance",
  "i can't breathe",
  "i cannot breathe",
  "chest pain",
  "having a heart attack",
  "i think i'm having a stroke",
  "i'm bleeding badly",
  "i can't move",
  // Suicidal ideation — always escalate to a human
  "don't want to be here anymore",
  "do not want to be here anymore",
  "don't want to live anymore",
  "don't want to be alive",
  "want to kill myself",
  "going to kill myself",
  "want to end my life",
  "end it all",
  "better off without me",
  "i want to die",
]

/**
 * Scans a transcript for any crisis phrase.
 * Returns the first matched phrase, or null if none found.
 */
export function scanForCrisisPhrase(transcript: string): string | null {
  const lower = transcript.toLowerCase()
  for (const phrase of CRISIS_PHRASES) {
    if (lower.includes(phrase)) return phrase
  }
  return null
}

export interface CrisisDetectionParams {
  memberId: string
  callId?: string
  transcript: string
  /** Overrides the CARE_TEAM_PHONE on-call number (tests only). The assigned navigator is always texted too. */
  careTeamPhone?: string
  /** Injected scanner — overrides scanForCrisisPhrase for testing the error-fallback path */
  _scanner?: (transcript: string) => string | null
}

/**
 * Runs crisis detection on a completed call transcript.
 *
 * On phrase match fires 5 escalation steps:
 *   1. emergency_log row (written first, must survive even if step 2 fails)
 *   2. emergency alert row
 *   3. critical navigator task
 *   4. Realtime notification (via createAlert)
 *   5. Urgent SMS to the CARE_TEAM_PHONE on-call number and the assigned navigator
 *
 * Wrapped in its own try/catch — any exception creates a
 * "Crisis detection failed — manual review required" navigator task.
 * Call processing always continues regardless of outcome.
 */
export async function handleCrisisDetection(params: CrisisDetectionParams): Promise<void> {
  const { memberId, callId, transcript, careTeamPhone } = params
  const scanner = params._scanner ?? scanForCrisisPhrase
  const admin = createAdminClient()

  try {
    const triggeredPhrase = scanner(transcript)
    if (!triggeredPhrase) return

    // Steps 1 + 2 + 4 — emergency_log first, crisis alert, Realtime notification
    await createAlert({
      memberId,
      callId,
      ...ALERT_RULES.crisis,
      message: `Crisis phrase detected: "${triggeredPhrase}". Immediate attention required.`,
      writesEmergencyLog: true,
      triggeredPhrase,
    })

    // Step 3 — critical navigator task
    const { error: taskError } = await admin.from('navigator_tasks').insert({
      member_id: memberId,
      task_type: 'crisis',
      description: `CRISIS DETECTED: "${triggeredPhrase}" — immediate follow-up required.`,
      priority: 'critical',
    })
    if (taskError) {
      console.error('[alerts/crisis] Navigator task insert failed:', taskError)
    }

    // Step 5 — urgent SMS to the on-call number + assigned navigator.
    // Never throws: a missing CARE_TEAM_PHONE is logged and the task + alert above still stand.
    await sendCareTeamUrgent(
      memberId,
      `CRISIS ALERT for member ${memberId.substring(0, 8)}: "${triggeredPhrase}" detected in a check-in call. Open the navigator console now.`,
      careTeamPhone,
    )

  } catch (e) {
    console.error('[alerts/crisis] Crisis detection failed:', e)
    // Create manual-review navigator task; call processing continues regardless
    const { error: taskError } = await admin.from('navigator_tasks').insert({
      member_id: memberId,
      task_type: 'crisis_detection_failure',
      description: 'Crisis detection failed — manual review required',
      priority: 'critical',
    })
    if (taskError) {
      console.error('[alerts/crisis] Fallback navigator task insert failed:', taskError)
    }
  }
}
