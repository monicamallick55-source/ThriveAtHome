/**
 * Test script — Phase 10 wellness drift detection.
 * Verifies declining scores trigger an alert and flat scores do not.
 * Cleans up ALL inserted rows at end.
 *
 * Run: npx tsx --env-file=.env.local scripts/test-wellness-drift.ts
 */

import { createClient } from '@supabase/supabase-js'
import { detectWellnessDrift } from '../lib/alerts/detectAlerts'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

let pass = 0
let fail = 0
const testMemberIds: string[] = []
const testCallIds: string[] = []
const testAlertIds: string[] = []
const testNotifIds: string[] = []

function ok(label: string) { console.log(`  ✅ ${label}`); pass++ }
function err(label: string, detail?: unknown) { console.error(`  ❌ ${label}`, detail ?? ''); fail++ }

async function cleanup() {
  if (testAlertIds.length) await admin.from('alerts').delete().in('id', testAlertIds)
  if (testNotifIds.length) await admin.from('realtime_notifications').delete().in('id', testNotifIds)
  if (testCallIds.length) await admin.from('check_in_calls').delete().in('id', testCallIds)
  for (const id of testMemberIds) await admin.from('members').delete().eq('id', id)
  console.log('\n🧹 Cleanup complete')
}

async function createTestMember(suffix: string): Promise<string> {
  const { data, error } = await admin.from('members').insert({
    full_name: `Drift Test ${suffix}`,
    preferred_name: `DriftTest${suffix}`,
    date_of_birth: '1945-01-01',
    phone_number: '+15550000001',
    plan_tier: 'basics',
  }).select('id').maybeSingle()
  if (error || !data) throw new Error(`Member create failed: ${error?.message}`)
  testMemberIds.push(data.id)
  return data.id
}

/** Creates N completed calls with the given mood scores, newest first. */
async function createCallsWithScores(memberId: string, scores: number[]): Promise<void> {
  for (let i = 0; i < scores.length; i++) {
    // Spread calls over last 8 days so recency check passes
    const daysAgo = i * 0.5
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await admin.from('check_in_calls').insert({
      member_id: memberId,
      call_type: 'check_in',
      status: 'completed',
      mood_score: scores[i],
      medication_taken: true,
      alert_flags: [],
      created_at: createdAt,
    }).select('id').maybeSingle()
    if (error || !data) throw new Error(`Call create failed at index ${i}: ${error?.message}`)
    testCallIds.push(data.id)
  }
}

async function getAlertsForMember(memberId: string) {
  const { data } = await admin.from('alerts').select('*').eq('member_id', memberId)
  return data ?? []
}

async function run() {
  console.log('🧪 Phase 10 — Wellness Drift Tests\n')

  try {
    // ── Test 1: Declining scores → wellness_drift alert ───────────────────
    console.log('Test 1 — Declining scores trigger wellness_drift')
    {
      const memberId = await createTestMember('DECLINE')
      // 14 calls: prior half (calls 8–14) = scores ~8, recent half (calls 1–7) = scores ~5
      // Written newest-first so the most recent = index 0
      const scores = [5, 4, 5, 4, 5, 5, 4, 8, 8, 8, 7, 8, 8, 8]
      await createCallsWithScores(memberId, scores)
      await detectWellnessDrift(memberId)

      const alerts = await getAlertsForMember(memberId)
      testAlertIds.push(...alerts.map((a: any) => a.id))
      const { data: notifs } = await admin.from('realtime_notifications').select('id').eq('member_id', memberId)
      testNotifIds.push(...(notifs ?? []).map((n: any) => n.id))

      const driftAlert = alerts.find(a => a.alert_type === 'wellness_drift')
      if (driftAlert) {
        ok('wellness_drift alert created for declining scores')
        if (driftAlert.severity === 'concern') ok('severity=concern')
        else err('expected severity=concern, got ' + driftAlert.severity)
      } else {
        err('wellness_drift alert NOT created for declining scores')
      }
    }

    // ── Test 2: Flat scores → no alert ────────────────────────────────────
    console.log('\nTest 2 — Flat scores do NOT trigger wellness_drift')
    {
      const memberId = await createTestMember('FLAT')
      // 14 calls all at score 7 — no meaningful difference between halves
      const scores = Array(14).fill(7)
      await createCallsWithScores(memberId, scores)
      await detectWellnessDrift(memberId)

      const alerts = await getAlertsForMember(memberId)
      testAlertIds.push(...alerts.map((a: any) => a.id))
      const { data: notifs } = await admin.from('realtime_notifications').select('id').eq('member_id', memberId)
      testNotifIds.push(...(notifs ?? []).map((n: any) => n.id))

      const driftAlert = alerts.find(a => a.alert_type === 'wellness_drift')
      if (!driftAlert) ok('no wellness_drift alert for flat scores')
      else err('false positive: wellness_drift fired for flat scores')
    }

    // ── Test 3: Insufficient data → no alert ──────────────────────────────
    console.log('\nTest 3 — Fewer than 14 calls → no wellness_drift')
    {
      const memberId = await createTestMember('INSUF')
      // Only 10 calls — not enough for the 14-call window
      const scores = [5, 4, 5, 4, 8, 8, 8, 8, 8, 8]
      await createCallsWithScores(memberId, scores)
      await detectWellnessDrift(memberId)

      const alerts = await getAlertsForMember(memberId)
      testAlertIds.push(...alerts.map((a: any) => a.id))
      const { data: notifs } = await admin.from('realtime_notifications').select('id').eq('member_id', memberId)
      testNotifIds.push(...(notifs ?? []).map((n: any) => n.id))

      const driftAlert = alerts.find(a => a.alert_type === 'wellness_drift')
      if (!driftAlert) ok('no wellness_drift when fewer than 14 calls in window')
      else err('false positive: wellness_drift fired with only 10 calls')
    }

    // ── Test 4: Improving scores → no alert ───────────────────────────────
    console.log('\nTest 4 — Improving scores do NOT trigger wellness_drift')
    {
      const memberId = await createTestMember('IMPROV')
      // Recent half = 8, prior half = 5 — improvement, not decline
      const scores = [8, 8, 8, 8, 8, 8, 8, 5, 4, 5, 4, 5, 5, 4]
      await createCallsWithScores(memberId, scores)
      await detectWellnessDrift(memberId)

      const alerts = await getAlertsForMember(memberId)
      testAlertIds.push(...alerts.map((a: any) => a.id))
      const { data: notifs } = await admin.from('realtime_notifications').select('id').eq('member_id', memberId)
      testNotifIds.push(...(notifs ?? []).map((n: any) => n.id))

      const driftAlert = alerts.find(a => a.alert_type === 'wellness_drift')
      if (!driftAlert) ok('no wellness_drift for improving scores')
      else err('false positive: wellness_drift fired for improving trend')
    }

  } finally {
    await cleanup()
  }

  console.log(`\n${'─'.repeat(50)}`)
  if (fail === 0) {
    console.log(`✅ All wellness drift tests passed — ${pass} checks`)
  } else {
    console.log(`❌ ${fail} test(s) FAILED — ${pass} passed`)
    process.exit(1)
  }
}

run().catch(e => { console.error('Fatal:', e); process.exit(1) })
