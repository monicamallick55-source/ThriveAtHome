// Maps ThriveAtHome wellness data to HL7 FHIR R4 resource inputs.
// Observations come from check-in call scores + wearable readings.
// Conditions come from flagged alerts (already carry ICD-10 codes).

import { createAdminClient } from '../supabase/admin'
import type { FhirObservationInput, FhirConditionInput } from '../interfaces/EhrProvider'

// LOINC codes for the wellness observations we can export.
const LOINC = {
  mood: { code: '89204-2', display: 'Mood / affect' },
  energy: { code: '89026-9', display: 'Energy level' },
  pain: { code: '72514-3', display: 'Pain severity 0-10 verbal numeric rating' },
  steps: { code: '41950-7', display: 'Number of steps in 24 hour Measured' },
  restingHr: { code: '40443-4', display: 'Heart rate --resting' },
  sleep: { code: '93832-4', display: 'Sleep duration' },
} as const

export interface FhirBundleForMember {
  observations: FhirObservationInput[]
  conditions: FhirConditionInput[]
}

/**
 * Build the FHIR resource inputs for a member over the last `days`.
 * Pure data assembly — the actual POST happens in the EhrProvider.
 */
export async function buildFhirBundleForMember(
  memberId: string,
  days = 30
): Promise<FhirBundleForMember> {
  const admin = createAdminClient()
  const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const [callsRes, readingsRes, alertsRes] = await Promise.all([
    admin
      .from('check_in_calls')
      .select('ended_at, mood_score, energy_score, pain_score')
      .eq('member_id', memberId)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false }),
    admin
      .from('wearable_readings')
      .select('reading_date, steps, resting_heart_rate, sleep_hours')
      .eq('member_id', memberId)
      .gte('reading_date', sinceIso.slice(0, 10))
      .order('reading_date', { ascending: false }),
    admin
      .from('alerts')
      .select('created_at, alert_type, message, acknowledged, icd10_codes')
      .eq('member_id', memberId)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false }),
  ])

  const observations: FhirObservationInput[] = []

  for (const call of callsRes.data ?? []) {
    const when = call.ended_at ?? new Date().toISOString()
    if (typeof call.mood_score === 'number')
      observations.push({ ...LOINC.mood, value: call.mood_score, unit: '{score}', effectiveDateTime: when })
    if (typeof call.energy_score === 'number')
      observations.push({ ...LOINC.energy, value: call.energy_score, unit: '{score}', effectiveDateTime: when })
    if (typeof call.pain_score === 'number')
      observations.push({ ...LOINC.pain, value: call.pain_score, unit: '{score}', effectiveDateTime: when })
  }

  for (const r of readingsRes.data ?? []) {
    const when = `${r.reading_date}T12:00:00Z`
    if (typeof r.steps === 'number')
      observations.push({ ...LOINC.steps, value: r.steps, unit: 'steps', effectiveDateTime: when })
    if (typeof r.resting_heart_rate === 'number')
      observations.push({ ...LOINC.restingHr, value: r.resting_heart_rate, unit: '/min', effectiveDateTime: when })
    if (typeof r.sleep_hours === 'number')
      observations.push({ ...LOINC.sleep, value: r.sleep_hours, unit: 'h', effectiveDateTime: when })
  }

  const conditions: FhirConditionInput[] = (alertsRes.data ?? [])
    .filter((a) => Array.isArray(a.icd10_codes) && (a.icd10_codes as string[]).length > 0)
    .map((a) => ({
      code: (a.icd10_codes as string[])[0],
      display: a.message.slice(0, 120),
      onsetDateTime: a.created_at,
      clinicalStatus: a.acknowledged ? ('resolved' as const) : ('active' as const),
    }))

  return { observations, conditions }
}
