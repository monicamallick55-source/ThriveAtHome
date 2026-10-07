// M23 — nightly ML analytics sweep.
// For every active member who has not opted out: recompute the wellness
// baseline, then run behavioral-anomaly, fall-risk and social-isolation models;
// run grief-pattern monitoring for members on a grief pathway.
// Called by /api/cron/ml-analytics. Never throws — collects per-member errors.

import { createAdminClient } from '../supabase/admin'
import { computeWellnessBaseline } from './wellnessBaseline'
import { detectBehavioralAnomaly } from './behavioralAnomaly'
import { computeFallRisk } from './fallRiskModel'
import { computeIsolationScore } from './isolationModel'
import { assessGriefPattern } from './griefPatternModel'

export interface MlSweepResult {
  membersChecked: number
  baselinesComputed: number
  anomaliesFlagged: number
  fallRiskHigh: number
  isolationHigh: number
  griefFlagsElevated: number
  errors: string[]
}

export async function runMlAnalyticsSweep(): Promise<MlSweepResult> {
  const admin = createAdminClient()
  const result: MlSweepResult = {
    membersChecked: 0,
    baselinesComputed: 0,
    anomaliesFlagged: 0,
    fallRiskHigh: 0,
    isolationHigh: 0,
    griefFlagsElevated: 0,
    errors: [],
  }

  const { data: members, error } = await admin
    .from('members')
    .select('id, status, ml_insights_opt_out, grief_welcome_path')
    .eq('status', 'active')

  if (error) {
    result.errors.push(`member fetch: ${error.message}`)
    return result
  }

  const eligible = (members ?? []).filter((m: any) => !m.ml_insights_opt_out)
  result.membersChecked = eligible.length

  for (const m of eligible) {
    try {
      const baseline = await computeWellnessBaseline(m.id)
      if (baseline.status === 'ok') result.baselinesComputed++
      if (baseline.error) result.errors.push(`${m.id} baseline: ${baseline.error}`)

      const anomaly = await detectBehavioralAnomaly(m.id)
      if (anomaly.outcome === 'concern' || anomaly.outcome === 'urgent') result.anomaliesFlagged++
      if (anomaly.error) result.errors.push(`${m.id} anomaly: ${anomaly.error}`)

      const fall = await computeFallRisk(m.id)
      if (fall.band === 'high') result.fallRiskHigh++
      if (fall.error) result.errors.push(`${m.id} fallRisk: ${fall.error}`)

      const isolation = await computeIsolationScore(m.id)
      if (isolation.band === 'high') result.isolationHigh++
      if (isolation.error) result.errors.push(`${m.id} isolation: ${isolation.error}`)

      const grief = await assessGriefPattern(m.id)
      if (grief.band === 'elevated' || grief.band === 'high') result.griefFlagsElevated++
      if (grief.error) result.errors.push(`${m.id} grief: ${grief.error}`)
    } catch (e) {
      result.errors.push(`${m.id}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return result
}

/** Run every M23 model for a single member (manual "recompute" action). */
export async function runMlForMember(memberId: string): Promise<{
  baseline: string
  anomalyScore: number
  fallRiskBand: string
  isolationBand: string
  griefBand: string
  errors: string[]
}> {
  const errors: string[] = []
  const baseline = await computeWellnessBaseline(memberId)
  if (baseline.error) errors.push(`baseline: ${baseline.error}`)
  const anomaly = await detectBehavioralAnomaly(memberId)
  if (anomaly.error) errors.push(`anomaly: ${anomaly.error}`)
  const fall = await computeFallRisk(memberId)
  if (fall.error) errors.push(`fallRisk: ${fall.error}`)
  const isolation = await computeIsolationScore(memberId)
  if (isolation.error) errors.push(`isolation: ${isolation.error}`)
  const grief = await assessGriefPattern(memberId)
  if (grief.error) errors.push(`grief: ${grief.error}`)
  return {
    baseline: baseline.status,
    anomalyScore: anomaly.score,
    fallRiskBand: fall.band,
    isolationBand: isolation.band,
    griefBand: grief.band,
    errors,
  }
}
