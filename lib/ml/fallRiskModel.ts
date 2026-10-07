// Phase 95 — Fall risk prediction (XGBoost stand-in).
// Engineers a feature vector from the member record, medication text, fall
// history, recent activity vs baseline, and recent wellness drift, then asks the
// MlProvider for a probability. High risk opens a fall-prevention navigator task.

import { createAdminClient } from '../supabase/admin'
import { mean } from './stats'
import { getWellnessBaseline } from './wellnessBaseline'
import { mlProvider } from '../providers'
import type { FallRiskFeatures } from '../interfaces/MlProvider'

export const FALL_RISK_MODERATE = 0.34
export const FALL_RISK_HIGH = 0.6

const PSYCHOACTIVE_MED_KEYWORDS = [
  'lorazepam', 'alprazolam', 'diazepam', 'clonazepam', 'zolpidem', 'temazepam',
  'quetiapine', 'trazodone', 'sertraline', 'citalopram', 'escitalopram',
  'mirtazapine', 'amitriptyline', 'gabapentin', 'oxycodone', 'hydrocodone',
  'tramadol', 'diphenhydramine', 'benzo', 'opioid', 'sedative', 'sleeping pill',
]
const BP_MED_KEYWORDS = [
  'lisinopril', 'amlodipine', 'losartan', 'metoprolol', 'atenolol', 'hydrochlorothiazide',
  'furosemide', 'carvedilol', 'valsartan', 'diuretic', 'blood pressure',
]
const VISION_KEYWORDS = ['glaucoma', 'macular', 'cataract', 'low vision', 'legally blind', 'retinopathy']

export interface FallRiskResult {
  memberId: string
  outcome: 'scored' | 'error'
  probability: number
  band: 'low' | 'moderate' | 'high'
  factors: { factor: string; detail: string }[]
  error: string | null
}

function ageFromDob(dob: string | null): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

function keywordHit(text: string | null, keywords: string[]): boolean {
  if (!text) return false
  const t = text.toLowerCase()
  return keywords.some((k: any) => t.includes(k))
}

export async function computeFallRisk(memberId: string): Promise<FallRiskResult> {
  const admin = createAdminClient()
  const result: FallRiskResult = {
    memberId,
    outcome: 'scored',
    probability: 0,
    band: 'low',
    factors: [],
    error: null,
  }

  try {
    const { data: member } = await admin
      .from('members')
      .select('date_of_birth, lives_alone, mobility_devices, medications, health_conditions')
      .eq('id', memberId)
      .maybeSingle()
    if (!member) {
      return { ...result, outcome: 'error', error: 'Member not found' }
    }

    const since180 = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const since30Iso = since30.toISOString()
    const since30Date = since30Iso.slice(0, 10)

    const [fallsRes, driftRes, readingsRes, baselineRes] = await Promise.all([
      admin
        .from('fall_events')
        .select('id')
        .eq('member_id', memberId)
        .gte('detected_at', since180),
      admin
        .from('alerts')
        .select('id')
        .eq('member_id', memberId)
        .eq('alert_type', 'wellness_drift')
        .gte('created_at', since30Iso),
      admin
        .from('wearable_readings')
        .select('steps, active_minutes')
        .eq('member_id', memberId)
        .gte('reading_date', since30Date),
      getWellnessBaseline(memberId),
    ])

    const priorFalls = (fallsRes.data ?? []).length
    const recentDrift = (driftRes.data ?? []).length
    const readings = readingsRes.data ?? []
    const baseline = baselineRes.data

    const features: FallRiskFeatures = {}

    if (priorFalls > 0) {
      features.prior_falls = Math.min(priorFalls, 3) / 3 + 0.34 // any prior fall is significant
      result.factors.push({
        factor: 'Prior falls',
        detail: `${priorFalls} fall event(s) in the last 6 months`,
      })
    }

    if (keywordHit(member.medications, PSYCHOACTIVE_MED_KEYWORDS)) {
      features.psychoactive_meds = 1
      result.factors.push({
        factor: 'Psychoactive medication',
        detail: 'Medication list includes a sedative / psychoactive agent',
      })
    }
    if (keywordHit(member.medications, BP_MED_KEYWORDS)) {
      features.bp_meds = 1
      result.factors.push({
        factor: 'Blood-pressure medication',
        detail: 'Medication list includes an antihypertensive / diuretic (orthostatic risk)',
      })
    }

    const devices = Array.isArray(member.mobility_devices) ? member.mobility_devices : []
    if (devices.length > 0) {
      features.mobility_device = 1
      result.factors.push({
        factor: 'Mobility device',
        detail: `Uses ${devices.join(', ')}`,
      })
    }

    const meanSteps = mean(
      readings.map((r: any) => r.steps).filter((n): n is number => typeof n === 'number')
    )
    if (
      meanSteps !== null &&
      baseline?.steps_mean != null &&
      baseline.steps_mean > 0 &&
      meanSteps < baseline.steps_mean * 0.7
    ) {
      features.low_activity = 1
      result.factors.push({
        factor: 'Reduced activity',
        detail: `Recent daily steps ~${Math.round(meanSteps)} vs baseline ~${Math.round(baseline.steps_mean)}`,
      })
    } else if (meanSteps !== null && meanSteps < 1500) {
      features.low_activity = 0.6
      result.factors.push({
        factor: 'Low activity',
        detail: `Recent daily steps average ~${Math.round(meanSteps)}`,
      })
    }

    const age = ageFromDob(member.date_of_birth)
    if (age !== null && age >= 80) {
      features.age_over_80 = 1
      result.factors.push({ factor: 'Age 80+', detail: `${age} years old` })
    }

    if (member.lives_alone) {
      features.lives_alone = 1
      result.factors.push({
        factor: 'Lives alone',
        detail: 'Longer time-to-help after a fall',
      })
    }

    if (recentDrift > 0) {
      features.recent_wellness_drift = Math.min(recentDrift, 3) / 3
      result.factors.push({
        factor: 'Recent wellness drift',
        detail: `${recentDrift} wellness-drift alert(s) in the last 30 days`,
      })
    }

    if (keywordHit(member.health_conditions, VISION_KEYWORDS)) {
      features.vision_flag = 1
      result.factors.push({
        factor: 'Vision impairment',
        detail: 'Health conditions include a vision-limiting diagnosis',
      })
    }

    const { probability } = await mlProvider.predictFallRisk(features)
    result.probability = Math.round(probability * 1000) / 1000
    result.band =
      probability >= FALL_RISK_HIGH ? 'high' : probability >= FALL_RISK_MODERATE ? 'moderate' : 'low'

    // Persist the score.
    let navigatorTaskId: string | null = null
    if (result.band === 'high') {
      const { data: existingTask } = await admin
        .from('navigator_tasks')
        .select('id')
        .eq('member_id', memberId)
        .eq('task_type', 'fall_prevention_review')
        .eq('completed', false)
        .maybeSingle()
      if (!existingTask) {
        const factorList = result.factors.map((f: any) => f.factor).join('; ')
        const { data: task } = await admin
          .from('navigator_tasks')
          .insert({
            member_id: memberId,
            task_type: 'fall_prevention_review',
            description: `Fall-risk model flagged HIGH (${(probability * 100).toFixed(0)}%). Contributing factors: ${factorList}. Schedule a home-safety review and PT/OT referral discussion.`,
            priority: 'high',
          })
          .select('id')
          .maybeSingle()
        navigatorTaskId = task?.id ?? null
      }
    }

    const { error: insertError } = await admin.from('fall_risk_scores').insert({
      member_id: memberId,
      risk_probability: result.probability,
      risk_band: result.band,
      contributing_factors: result.factors,
      navigator_task_id: navigatorTaskId,
    })
    if (insertError) {
      console.error('[ml/fallRiskModel] insert failed:', insertError)
      result.error = insertError.message
    }

    return result
  } catch (e) {
    console.error('[ml/fallRiskModel] Unexpected error:', e)
    return { ...result, outcome: 'error', error: e instanceof Error ? e.message : String(e) }
  }
}
