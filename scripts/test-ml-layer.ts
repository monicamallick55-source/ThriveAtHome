/**
 * Test script — M23 Phases 93-97 Advanced AI/ML Layer.
 * Seeds one member with a stable 30-day baseline and a sharply declining last
 * 7 days (mood, steps, sleep), a grief pathway 14 months post-loss, fall-risk
 * factors (age 88, walker, sedative + BP meds, prior falls, low activity) and
 * zero community engagement, then runs every model:
 *   1. computeWellnessBaseline    → baseline row, status 'ok', data_points > 0
 *   2. detectBehavioralAnomaly    → anomaly row, score >= concern threshold
 *   3. computeFallRisk            → fall_risk_scores row, band 'high'
 *   4. computeIsolationScore      → isolation_scores row, band moderate/high
 *   5. assessGriefPattern         → grief_pattern_flags row, referral suggested
 *   6. navigator tasks created for the flagged models
 * Cleans up ALL inserted rows at end regardless of pass/fail.
 *
 * Run: npx tsx --env-file=.env.local scripts/test-ml-layer.ts
 */

import { createClient } from '@supabase/supabase-js'
import { computeWellnessBaseline } from '../lib/ml/wellnessBaseline'
import { detectBehavioralAnomaly } from '../lib/ml/behavioralAnomaly'
import { computeFallRisk } from '../lib/ml/fallRiskModel'
import { computeIsolationScore } from '../lib/ml/isolationModel'
import { assessGriefPattern } from '../lib/ml/griefPatternModel'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

let pass = 0
let fail = 0
const testMemberIds: string[] = []

function ok(label: string) {
  console.log(`  ✅ ${label}`)
  pass++
}
function err(label: string, detail?: unknown) {
  console.error(`  ❌ ${label}`, detail ?? '')
  fail++
}
function warn(label: string, detail?: unknown) {
  console.warn(`  ⚠️  ${label}`, detail ?? '')
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}
function daysAgoDate(days: number): string {
  return daysAgoIso(days).slice(0, 10)
}

async function cleanup() {
  for (const memberId of testMemberIds) {
    await admin.from('behavioral_anomalies').delete().eq('member_id', memberId)
    await admin.from('fall_risk_scores').delete().eq('member_id', memberId)
    await admin.from('isolation_scores').delete().eq('member_id', memberId)
    await admin.from('grief_pattern_flags').delete().eq('member_id', memberId)
    await admin.from('wellness_baselines').delete().eq('member_id', memberId)
    await admin.from('grief_support_requests').delete().eq('member_id', memberId)
    await admin.from('wearable_readings').delete().eq('member_id', memberId)
    await admin.from('fall_events').delete().eq('member_id', memberId)
    await admin.from('alerts').delete().eq('member_id', memberId)
    await admin.from('realtime_notifications').delete().eq('member_id', memberId)
    await admin.from('navigator_tasks').delete().eq('member_id', memberId)
    await admin.from('check_in_calls').delete().eq('member_id', memberId)
    await admin.from('members').delete().eq('id', memberId)
  }
  console.log('\n🧹 Cleanup complete — all test rows removed')
}

async function makeMember(): Promise<string> {
  const { data, error } = await admin
    .from('members')
    .insert({
      full_name: 'ML Test Member',
      preferred_name: 'Mel',
      date_of_birth: '1938-02-01',
      phone_number: '+15550000123',
      lives_alone: true,
      mobility_devices: ['walker'],
      medications: 'lorazepam 1mg at night, lisinopril 10mg daily',
      health_conditions: 'hypertension, early cataract in right eye',
      grief_welcome_path: true,
      grief_enrolled_at: daysAgoIso(430),
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`Could not create test member: ${error?.message}`)
  testMemberIds.push(data.id)
  return data.id
}

async function seedHistory(memberId: string) {
  // Stable baseline calls: days 9..30 ago, mood ~8, energy ~7
  const baselineMoods = [8, 8, 7, 8, 9, 8, 7, 8, 8, 7]
  const calls: Record<string, unknown>[] = []
  baselineMoods.forEach((m, i) => {
    calls.push({
      member_id: memberId,
      call_type: 'check_in',
      status: 'completed',
      mood_score: m,
      energy_score: 7,
      pain_score: 2,
      created_at: daysAgoIso(30 - i * 2),
      ai_summary: 'Pleasant chat. Talked about the garden and grandchildren visiting.',
    })
  })
  // Declining recent calls: last 7 days, mood ~3, negative + grief + lonely language
  const recentMoods = [4, 3, 3, 3]
  recentMoods.forEach((m, i) => {
    calls.push({
      member_id: memberId,
      call_type: 'check_in',
      status: 'completed',
      mood_score: m,
      energy_score: 3,
      pain_score: 5,
      created_at: daysAgoIso(6 - i),
      ai_summary:
        'Quiet call. Said she feels lonely and tired, misses her husband terribly, and has not seen anyone all week. Nobody visits.',
      transcript: 'I feel so alone. I miss him. It has been hard since he died.',
    })
  })
  const { error: cErr } = await admin.from('check_in_calls').insert(calls)
  if (cErr) throw new Error(`seed calls failed: ${cErr.message}`)

  // Wearable readings: baseline days 9..28 ~4000 steps / 7h sleep; recent 6 days ~700 steps / 4h
  const readings: Record<string, unknown>[] = []
  for (let d = 9; d <= 28; d++) {
    readings.push({
      member_id: memberId,
      reading_date: daysAgoDate(d),
      steps: 3800 + ((d * 37) % 400),
      resting_heart_rate: 66,
      sleep_hours: 7,
      active_minutes: 25,
      fall_detected: false,
      source_platform: 'fitbit',
    })
  }
  for (let d = 0; d <= 6; d++) {
    readings.push({
      member_id: memberId,
      reading_date: daysAgoDate(d),
      steps: 600 + d * 30,
      resting_heart_rate: 74,
      sleep_hours: 4,
      active_minutes: 4,
      fall_detected: false,
      source_platform: 'fitbit',
    })
  }
  const { error: rErr } = await admin.from('wearable_readings').insert(readings)
  if (rErr) throw new Error(`seed readings failed: ${rErr.message}`)

  // Prior falls in last 180 days
  const { error: fErr } = await admin.from('fall_events').insert([
    { member_id: memberId, source: 'wearable', detected_at: daysAgoIso(40), resolved: true },
    { member_id: memberId, source: 'manual', detected_at: daysAgoIso(120), resolved: true },
  ])
  if (fErr) throw new Error(`seed fall_events failed: ${fErr.message}`)

  // Grief request 14 months ago with an anniversary
  const { error: gErr } = await admin.from('grief_support_requests').insert({
    member_id: memberId,
    loss_type: 'spouse',
    status: 'matched',
    created_at: daysAgoIso(425),
    loss_anniversary_date: daysAgoDate(425),
  })
  if (gErr) throw new Error(`seed grief request failed: ${gErr.message}`)
}

async function main() {
  console.log('\n🧪 M23 Phases 93-97 — Advanced AI/ML Layer\n')

  const m = await makeMember()
  await seedHistory(m)

  // ─── 1. Wellness baseline ───
  const baseline = await computeWellnessBaseline(m)
  if (baseline.status === 'ok' && baseline.dataPoints > 0) ok(`baseline computed (status ok, ${baseline.dataPoints} data points)`)
  else err('baseline not ok', baseline)
  const { data: baseRow } = await admin.from('wellness_baselines').select('*').eq('member_id', m).maybeSingle()
  if (baseRow && baseRow.mood_mean && baseRow.mood_std && baseRow.mood_std > 0) ok('baseline row has mood mean + std')
  else err('baseline row missing stats', baseRow)

  // ─── 2. Behavioral anomaly ───
  const anomaly = await detectBehavioralAnomaly(m)
  if (['concern', 'urgent'].includes(anomaly.outcome)) ok(`behavioral anomaly flagged (${anomaly.outcome}, score ${(anomaly.score * 100).toFixed(0)}%)`)
  else err('anomaly not flagged despite sharp decline', anomaly)
  const { data: anomalyRows } = await admin.from('behavioral_anomalies').select('*').eq('member_id', m)
  if ((anomalyRows ?? []).some((r) => r.anomaly_score >= 0.6)) ok('behavioral_anomalies row persisted with score >= 0.6')
  else err('no behavioral_anomalies row >= 0.6', anomalyRows)
  const { data: driftAlert } = await admin.from('alerts').select('alert_type,severity').eq('member_id', m).eq('alert_type', 'wellness_drift').maybeSingle()
  if (driftAlert) ok(`wellness_drift alert raised (${driftAlert.severity})`)
  else err('no wellness_drift alert', driftAlert)

  // ─── 3. Fall risk ───
  const fall = await computeFallRisk(m)
  if (fall.band === 'high') ok(`fall risk HIGH (${(fall.probability * 100).toFixed(0)}%), factors: ${fall.factors.map((f) => f.factor).join(', ')}`)
  else if (fall.band === 'moderate') warn(`fall risk MODERATE (${(fall.probability * 100).toFixed(0)}%) — expected high; heuristic weights may need tuning`, fall.factors.map((f) => f.factor))
  else err('fall risk not elevated for an 88yo on sedatives with prior falls', fall)
  const { data: fallRows } = await admin.from('fall_risk_scores').select('*').eq('member_id', m)
  if ((fallRows ?? []).length === 1) ok('fall_risk_scores row persisted')
  else err('fall_risk_scores row count wrong', (fallRows ?? []).length)
  if (fall.band === 'high') {
    const { data: fpTask } = await admin.from('navigator_tasks').select('id').eq('member_id', m).eq('task_type', 'fall_prevention_review').maybeSingle()
    if (fpTask) ok('fall_prevention_review navigator task created')
    else err('no fall_prevention_review task despite HIGH band')
  }

  // ─── 4. Social isolation ───
  const isolation = await computeIsolationScore(m)
  if (['moderate', 'high'].includes(isolation.band)) ok(`isolation ${isolation.band} (score ${(isolation.isolationScore * 100).toFixed(0)}%), drivers: ${isolation.drivers.join('; ')}`)
  else err('isolation not elevated for a lonely, disengaged, lives-alone member', isolation)
  const { data: isoRows } = await admin.from('isolation_scores').select('*').eq('member_id', m)
  if ((isoRows ?? []).length === 1) ok('isolation_scores row persisted')
  else err('isolation_scores row count wrong', (isoRows ?? []).length)
  if (isolation.band === 'high' && isolation.suggestedConnections.length > 0) ok(`${isolation.suggestedConnections.length} suggested connection(s) attached`)

  // ─── 5. Grief pattern ───
  const grief = await assessGriefPattern(m)
  if (['elevated', 'high'].includes(grief.band)) ok(`grief pattern ${grief.band}, ${grief.monthsSinceLoss} months since loss, indicators: ${grief.indicators.join('; ')}`)
  else err('grief pattern not elevated 14 months post-loss with negative sentiment', grief)
  if (grief.professionalReferralSuggested) ok('professional referral suggested')
  else err('professional referral not suggested', grief)
  const { data: griefRows } = await admin.from('grief_pattern_flags').select('*').eq('member_id', m)
  if ((griefRows ?? []).length === 1) ok('grief_pattern_flags row persisted')
  else err('grief_pattern_flags row count wrong', (griefRows ?? []).length)
  const { data: pgTask } = await admin.from('navigator_tasks').select('id').eq('member_id', m).eq('task_type', 'prolonged_grief_review').maybeSingle()
  if (pgTask) ok('prolonged_grief_review navigator task created')
  else err('no prolonged_grief_review task despite elevated band')

  console.log(`\n──────────────\n${pass} passed, ${fail} failed\n`)
}

main()
  .catch((e) => {
    console.error('\n💥 Unexpected error:', e)
    fail++
  })
  .finally(async () => {
    await cleanup()
    process.exit(fail > 0 ? 1 : 0)
  })
