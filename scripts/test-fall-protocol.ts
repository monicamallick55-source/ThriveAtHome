/**
 * Test script — M22 Phase 91 fall-detection emergency protocol.
 * Tests:
 *   1. handleFallEvent raises a 'fall' / 'emergency' alert + writes emergency_log
 *   2. A critical 'fall_response' navigator task is created
 *   3. A fall_events audit row is written and linked to the alert + task
 *   4. A burst of signals within the dedup window raises only ONE alert
 *   5. No-motion anomaly: detectNoMotionAnomaly escalates at the emergency threshold
 * Cleans up ALL inserted rows at end regardless of pass/fail.
 *
 * Run: npx tsx --env-file=.env.local scripts/test-fall-protocol.ts
 */

import { createClient } from '@supabase/supabase-js'
import { handleFallEvent } from '../lib/devices/fallProtocol'
import { detectNoMotionAnomaly } from '../lib/devices/anomalyDetection'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

let pass = 0
let fail = 0
const testMemberIds: string[] = []

function ok(label: string) { console.log(`  ✅ ${label}`); pass++ }
function err(label: string, detail?: unknown) { console.error(`  ❌ ${label}`, detail ?? ''); fail++ }

async function cleanup() {
  for (const memberId of testMemberIds) {
    await admin.from('fall_events').delete().eq('member_id', memberId)
    await admin.from('alerts').delete().eq('member_id', memberId)
    await admin.from('emergency_log').delete().eq('member_id', memberId)
    await admin.from('realtime_notifications').delete().eq('member_id', memberId)
    await admin.from('navigator_tasks').delete().eq('member_id', memberId)
    await admin.from('device_signals').delete().eq('member_id', memberId)
    await admin.from('member_devices').delete().eq('member_id', memberId)
    await admin.from('members').delete().eq('id', memberId)
  }
  console.log('\n🧹 Cleanup complete — all test rows removed')
}

async function makeMember(): Promise<string> {
  const { data, error } = await admin
    .from('members')
    .insert({
      full_name: 'Fall Test Member',
      preferred_name: 'Fall',
      date_of_birth: '1940-01-01',
      phone_number: '+15550000000',
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`Could not create test member: ${error?.message}`)
  testMemberIds.push(data.id)
  return data.id
}

async function main() {
  console.log('\n🧪 M22 Phase 91 — Fall-detection protocol\n')

  // ─── Test 1-3: single fall event ───
  const m1 = await makeMember()
  const result = await handleFallEvent({ memberId: m1, source: 'wearable', confidence: 0.92 })

  if (result.alertId) ok('fall event raised an alert')
  else err('fall event did not raise an alert', result.error)

  const { data: alert } = await admin
    .from('alerts')
    .select('alert_type, severity')
    .eq('id', result.alertId ?? '')
    .maybeSingle()
  if (alert?.alert_type === 'fall' && alert?.severity === 'emergency') ok("alert is alert_type='fall', severity='emergency'")
  else err('alert type/severity wrong', alert)

  const { data: emLog } = await admin.from('emergency_log').select('id').eq('member_id', m1)
  if ((emLog ?? []).length >= 1) ok('emergency_log row written')
  else err('no emergency_log row')

  const { data: task } = await admin
    .from('navigator_tasks')
    .select('task_type, priority')
    .eq('member_id', m1)
    .maybeSingle()
  if (task?.task_type === 'fall_response' && task?.priority === 'critical') ok("critical 'fall_response' navigator task created")
  else err('navigator task wrong', task)

  const { data: fe } = await admin
    .from('fall_events')
    .select('id, alert_id, navigator_task_id')
    .eq('member_id', m1)
    .maybeSingle()
  if (fe?.id && fe.alert_id === result.alertId) ok('fall_events audit row written and linked to the alert')
  else err('fall_events row missing or not linked', fe)

  // ─── Test 4: dedup burst ───
  const m2 = await makeMember()
  const r1 = await handleFallEvent({ memberId: m2, source: 'wearable' })
  const r2 = await handleFallEvent({ memberId: m2, source: 'wearable' })
  const { data: alertsForM2 } = await admin.from('alerts').select('id').eq('member_id', m2)
  if ((alertsForM2 ?? []).length === 1 && r2.deduplicated) ok('burst of 2 signals raised exactly 1 alert (deduplicated)')
  else err('dedup failed', { count: (alertsForM2 ?? []).length, r1Dedup: r1.deduplicated, r2Dedup: r2.deduplicated })

  const { data: feForM2 } = await admin.from('fall_events').select('id').eq('member_id', m2)
  if ((feForM2 ?? []).length === 2) ok('both signals still recorded 2 fall_events audit rows')
  else err('expected 2 fall_events audit rows', (feForM2 ?? []).length)

  // ─── Test 5: no-motion anomaly escalation ───
  const m3 = await makeMember()
  const { data: dev } = await admin
    .from('member_devices')
    .insert({ member_id: m3, device_category: 'smart_home', device_type: 'motion_sensor', status: 'active' })
    .select('id')
    .single()
  // last motion 20h ago (past the 16h emergency threshold)
  await admin.from('device_signals').insert({
    member_id: m3,
    device_id: dev?.id ?? null,
    signal_type: 'motion',
    occurred_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
  })
  const anomaly = await detectNoMotionAnomaly(m3)
  if (anomaly.outcome === 'emergency_raised') ok('20h no-motion → emergency_raised')
  else err('no-motion anomaly did not escalate', anomaly)

  const { data: m3Alerts } = await admin.from('alerts').select('alert_type').eq('member_id', m3)
  if ((m3Alerts ?? []).some((a: any) => a.alert_type === 'fall')) ok('no-motion emergency produced a fall alert')
  else err('no fall alert from no-motion emergency', m3Alerts)

  console.log(`\n${fail === 0 ? '✅' : '❌'} ${pass} passed, ${fail} failed`)
}

main()
  .catch((e) => { console.error('\n💥 Test run crashed:', e); fail++ })
  .finally(async () => {
    await cleanup()
    process.exit(fail === 0 ? 0 : 1)
  })
