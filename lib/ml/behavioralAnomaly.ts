// Phase 94 — Behavioral anomaly detection (Isolation Forest time-series stand-in).
// Compares a member's recent 7-day feature window against their rolling 30-day
// baseline. A high multivariate deviation raises a graduated wellness alert and,
// for the strongest signals, a navigator task.

import { createAdminClient } from '../supabase/admin'
import { mean } from './stats'
import { getWellnessBaseline } from './wellnessBaseline'
import { createAlert } from '../alerts/createAlert'
import { mlProvider } from '../providers'
import type { BaselineStat } from '../interfaces/MlProvider'

/** Anomaly score at/above which we raise a "concern" alert. */
export const ANOMALY_CONCERN_THRESHOLD = 0.5
/** Anomaly score at/above which the alert is escalated to "urgent" + navigator task. */
export const ANOMALY_URGENT_THRESHOLD = 0.8
const RECENT_WINDOW_DAYS = 7

export interface AnomalyDetectResult {
  memberId: string
  outcome: 'ok' | 'no_baseline' | 'insufficient_recent_data' | 'concern' | 'urgent'
  score: number
  drivers: string[]
  error: string | null
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

const DRIVER_LABELS: Record<string, string> = {
  mood: 'mood scores',
  energy: 'energy levels',
  pain: 'reported pain',
  sleep_hours: 'sleep hours',
  steps: 'daily steps',
  resting_hr: 'resting heart rate',
}

export async function detectBehavioralAnomaly(memberId: string): Promise<AnomalyDetectResult> {
  const admin = createAdminClient()
  const base: AnomalyDetectResult = {
    memberId,
    outcome: 'ok',
    score: 0,
    drivers: [],
    error: null,
  }

  try {
    const { data: baseline } = await getWellnessBaseline(memberId)
    if (!baseline || baseline.status !== 'ok') {
      return { ...base, outcome: 'no_baseline' }
    }

    const since = isoDaysAgo(RECENT_WINDOW_DAYS)
    const sinceDate = since.slice(0, 10)
    const [callsRes, readingsRes] = await Promise.all([
      admin
        .from('check_in_calls')
        .select('mood_score, energy_score, pain_score')
        .eq('member_id', memberId)
        .eq('status', 'completed')
        .gte('created_at', since),
      admin
        .from('wearable_readings')
        .select('steps, resting_heart_rate, sleep_hours')
        .eq('member_id', memberId)
        .gte('reading_date', sinceDate),
    ])

    const calls = callsRes.data ?? []
    const readings = readingsRes.data ?? []
    if (calls.length === 0 && readings.length === 0) {
      return { ...base, outcome: 'insufficient_recent_data' }
    }

    const current: Record<string, number> = {}
    const baselineStats: Record<string, BaselineStat> = {}

    const addFeature = (
      key: string,
      values: number[],
      meanVal: number | null,
      stdVal: number | null
    ) => {
      const m = mean(values)
      if (m === null || meanVal === null || stdVal === null || stdVal <= 0) return
      current[key] = m
      baselineStats[key] = { mean: meanVal, std: stdVal }
    }

    addFeature(
      'mood',
      calls.map((c) => c.mood_score).filter((n): n is number => typeof n === 'number'),
      baseline.mood_mean,
      baseline.mood_std
    )
    addFeature(
      'energy',
      calls.map((c) => c.energy_score).filter((n): n is number => typeof n === 'number'),
      baseline.energy_mean,
      baseline.energy_std
    )
    addFeature(
      'pain',
      calls.map((c) => c.pain_score).filter((n): n is number => typeof n === 'number'),
      baseline.pain_mean,
      baseline.pain_std
    )
    addFeature(
      'sleep_hours',
      readings.map((r) => r.sleep_hours).filter((n): n is number => typeof n === 'number'),
      baseline.sleep_hours_mean,
      baseline.sleep_hours_std
    )
    addFeature(
      'steps',
      readings.map((r) => r.steps).filter((n): n is number => typeof n === 'number'),
      baseline.steps_mean,
      baseline.steps_std
    )
    addFeature(
      'resting_hr',
      readings
        .map((r) => r.resting_heart_rate)
        .filter((n): n is number => typeof n === 'number'),
      baseline.resting_hr_mean,
      baseline.resting_hr_std
    )

    if (Object.keys(baselineStats).length === 0) {
      return { ...base, outcome: 'insufficient_recent_data' }
    }

    const { score, drivers } = await mlProvider.scoreBehavioralAnomaly({
      current,
      baseline: baselineStats,
    })
    base.score = score
    base.drivers = drivers

    if (score < ANOMALY_CONCERN_THRESHOLD) {
      // Still record a low-score row so the trend is visible, without any alert.
      await admin.from('behavioral_anomalies').insert({
        member_id: memberId,
        anomaly_score: score,
        severity: 'info',
        top_drivers: drivers,
        features: { current, baseline: baselineStats } as any,
      })
      return { ...base, outcome: 'ok' }
    }

    const isUrgent = score >= ANOMALY_URGENT_THRESHOLD
    const severity: 'concern' | 'urgent' = isUrgent ? 'urgent' : 'concern'
    const driverText =
      drivers.length > 0
        ? drivers.map((d) => DRIVER_LABELS[d] ?? d).join(', ')
        : 'several wellness signals'
    const message = `A shift from ${
      baseline.window_days
    }-day norms was detected in ${driverText}. A friendly check-in call is recommended.`

    const alertResult = await createAlert({
      memberId,
      alertType: 'wellness_drift',
      severity,
      message,
      dedupWindowHours: 24,
    })

    let navigatorTaskId: string | null = null
    if (isUrgent && !alertResult.deduplicated) {
      const { data: existingTask } = await admin
        .from('navigator_tasks')
        .select('id')
        .eq('member_id', memberId)
        .eq('task_type', 'behavioral_anomaly_review')
        .eq('completed', false)
        .maybeSingle()
      if (!existingTask) {
        const { data: task } = await admin
          .from('navigator_tasks')
          .insert({
            member_id: memberId,
            task_type: 'behavioral_anomaly_review',
            description: `${message} Model anomaly score ${(score * 100).toFixed(0)}%. Review recent calls and wearable trends.`,
            priority: 'high',
          })
          .select('id')
          .maybeSingle()
        navigatorTaskId = task?.id ?? null
      }
    }

    await admin.from('behavioral_anomalies').insert({
      member_id: memberId,
      anomaly_score: score,
      severity,
      top_drivers: drivers,
      features: { current, baseline: baselineStats } as any,
      alert_id: alertResult.alertId,
      navigator_task_id: navigatorTaskId,
    })

    return { ...base, outcome: isUrgent ? 'urgent' : 'concern', error: alertResult.error }
  } catch (e) {
    console.error('[ml/behavioralAnomaly] Unexpected error:', e)
    return { ...base, error: e instanceof Error ? e.message : String(e) }
  }
}
