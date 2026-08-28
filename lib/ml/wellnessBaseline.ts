// Phase 93 — Wellness baseline modeling.
// Builds a rolling per-member baseline (mean + std) from the last N days of
// check-in call scores and wearable readings. Every downstream M23 model scores
// the member against their OWN baseline, not a population average.

import { createAdminClient } from '../supabase/admin'
import { mean, stddev, round } from './stats'
import type { WellnessBaselineRow } from '../../types/database'

export const BASELINE_WINDOW_DAYS = 30
/** Minimum combined data points before a baseline is considered usable. */
export const MIN_BASELINE_POINTS = 5

export interface BaselineComputeResult {
  memberId: string
  status: 'ok' | 'insufficient_data'
  dataPoints: number
  error: string | null
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

/**
 * Recompute and upsert the wellness baseline for one member.
 * Never throws — returns an error string instead.
 */
export async function computeWellnessBaseline(
  memberId: string,
  windowDays = BASELINE_WINDOW_DAYS
): Promise<BaselineComputeResult> {
  const admin = createAdminClient()
  try {
    const since = isoDaysAgo(windowDays)
    const sinceDate = since.slice(0, 10)

    const [callsRes, readingsRes] = await Promise.all([
      admin
        .from('check_in_calls')
        .select('status, mood_score, energy_score, pain_score, scheduled_at, created_at')
        .eq('member_id', memberId)
        .gte('created_at', since),
      admin
        .from('wearable_readings')
        .select('steps, resting_heart_rate, sleep_hours, reading_date')
        .eq('member_id', memberId)
        .gte('reading_date', sinceDate),
    ])

    const calls = callsRes.data ?? []
    const readings = readingsRes.data ?? []

    const mood = calls.map((c) => c.mood_score).filter((n): n is number => typeof n === 'number')
    const energy = calls.map((c) => c.energy_score).filter((n): n is number => typeof n === 'number')
    const pain = calls.map((c) => c.pain_score).filter((n): n is number => typeof n === 'number')
    const sleep = readings.map((r) => r.sleep_hours).filter((n): n is number => typeof n === 'number')
    const steps = readings.map((r) => r.steps).filter((n): n is number => typeof n === 'number')
    const restingHr = readings
      .map((r) => r.resting_heart_rate)
      .filter((n): n is number => typeof n === 'number')

    // Call engagement rate: completed calls / calls that were scheduled or attempted.
    const consideredCalls = calls.filter((c) =>
      ['completed', 'missed', 'failed', 'in_progress'].includes(c.status)
    )
    const completed = calls.filter((c) => c.status === 'completed').length
    const engagementRate =
      consideredCalls.length > 0 ? completed / consideredCalls.length : null

    const dataPoints = mood.length + energy.length + sleep.length + steps.length
    const status: 'ok' | 'insufficient_data' =
      dataPoints >= MIN_BASELINE_POINTS ? 'ok' : 'insufficient_data'

    const row = {
      member_id: memberId,
      window_days: windowDays,
      computed_at: new Date().toISOString(),
      data_points: dataPoints,
      status,
      mood_mean: round(mean(mood)),
      mood_std: round(stddev(mood)),
      energy_mean: round(mean(energy)),
      energy_std: round(stddev(energy)),
      pain_mean: round(mean(pain)),
      pain_std: round(stddev(pain)),
      sleep_hours_mean: round(mean(sleep)),
      sleep_hours_std: round(stddev(sleep)),
      steps_mean: round(mean(steps)),
      steps_std: round(stddev(steps)),
      resting_hr_mean: round(mean(restingHr)),
      resting_hr_std: round(stddev(restingHr)),
      call_engagement_rate: round(engagementRate),
    }

    const { error } = await admin
      .from('wellness_baselines')
      .upsert(row, { onConflict: 'member_id' })

    if (error) {
      console.error('[ml/wellnessBaseline] upsert failed:', error)
      return { memberId, status, dataPoints, error: error.message }
    }
    return { memberId, status, dataPoints, error: null }
  } catch (e) {
    console.error('[ml/wellnessBaseline] Unexpected error:', e)
    return {
      memberId,
      status: 'insufficient_data',
      dataPoints: 0,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}

/** Fetch the stored baseline for a member (null if never computed). */
export async function getWellnessBaseline(
  memberId: string
): Promise<{ data: WellnessBaselineRow | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('wellness_baselines')
    .select('*')
    .eq('member_id', memberId)
    .maybeSingle()
  return { data: (data as WellnessBaselineRow | null) ?? null, error: error?.message ?? null }
}
