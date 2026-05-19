/**
 * Test script — Phase 11 crisis detection verification.
 * Tests: 5-step escalation on crisis phrase, no false positive on normal transcript,
 * no false positive on "fell asleep watching TV", fallback task on detection failure.
 * Cleans up ALL inserted rows at end regardless of pass/fail.
 *
 * Run: npx tsx --env-file=.env.local scripts/test-crisis-detection.ts
 */

import { createClient } from '@supabase/supabase-js'
import { handleCrisisDetection } from '../lib/alerts/detectCrisis'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

let pass = 0
let fail = 0
const testMemberIds: string[] = []
const testAlertIds: string[] = []
const testEmergencyLogIds: string[] = []
const testNotifIds: string[] = []

function ok(label: string)  { console.log(`  ✅ ${label}`); pass++ }
function err(label: string, detail?: unknown) { console.error(`  ❌ ${label}`, detail ?? ''); fail++ }

async function cleanup() {
  // Delete in FK-safe order; navigator_tasks cascade from member delete
  if (testAlertIds.length)        await admin.from('alerts').delete().in('id', testAlertIds)
  if (testNotifIds.length)        await admin.from('realtime_notifications').delete().in('id', testNotifIds)
  if (testEmergencyLogIds.length) await admin.from('emergency_log').delete().in('id', testEmergencyLogIds)
  for (const memberId of testMemberIds) {
    // navigator_tasks, check_in_calls, etc. cascade from member delete
    await admin.from('navigator_tasks').delete().eq('member_id', memberId)
    await admin.from('members').delete().eq('id', memberId)
  }
  console.log('\n🧹 Cleanup complete — all test rows removed')
}

async function createTestMember(suffix: string): Promise<string> {
  const { data, error } = await admin.from('members').insert({
    full_name: `Crisis Test ${suffix}`,
    preferred_name: `CrisisTest${suffix}`,
    date_of_birth: '1945-01-01',
    phone_number: '+15550000099',
    plan_tier: 'basics',
  }).select('id').maybeSingle()
  if (error || !data) throw new Error(`Could not create test member: ${error?.message}`)
  testMemberIds.push(data.id)
  return data.id
}

/**
 * Runs fn() while capturing all console.log output.
 * Restores console.log after fn() resolves or rejects.
 */
async function captureConsoleLogs(fn: () => Promise<void>): Promise<string[]> {
  const logs: string[] = []
  const orig = console.log
  console.log = (...args: unknown[]) => {
    const line = args.map(a => String(a)).join(' ')
    logs.push(line)
    orig(line)
  }
  try {
    await fn()
  } finally {
    console.log = orig
  }
  return logs
}

async function run() {
  console.log('🧪 Phase 11 — Crisis Detection Tests\n')

  try {

    // ── Test 1: Crisis transcript triggers all 5 escalation steps ─────────
    console.log('Test 1 — Crisis transcript triggers all 5 escalation steps')
    {
      const memberId = await createTestMember('T1')
      const transcript = "I was reaching for the shelf and I've fallen and I can't get up. Please help."

      const logs = await captureConsoleLogs(async () => {
        await handleCrisisDetection({ memberId, transcript, careTeamPhone: '+15550001234' })
      })

      // Step 1: emergency_log row
      const { data: emLogs } = await admin.from('emergency_log').select('*').eq('member_id', memberId)
      testEmergencyLogIds.push(...(emLogs ?? []).map(e => e.id))
      if ((emLogs ?? []).length > 0) ok('Step 1: emergency_log row written')
      else err('Step 1: emergency_log row NOT found')

      // Step 2: emergency alert with severity=emergency
      const { data: alerts } = await admin.from('alerts').select('*').eq('member_id', memberId)
      testAlertIds.push(...(alerts ?? []).map(a => a.id))
      const crisisAlert = (alerts ?? []).find(a => a.alert_type === 'crisis')
      if (crisisAlert?.severity === 'emergency') ok('Step 2: crisis alert — severity=emergency')
      else err('Step 2: crisis alert NOT found or wrong severity', crisisAlert?.severity)

      // Step 3: critical navigator task
      const { data: tasks } = await admin
        .from('navigator_tasks').select('*').eq('member_id', memberId).eq('task_type', 'crisis')
      const crisisTask = (tasks ?? []).find(t => t.priority === 'critical')
      if (crisisTask) ok('Step 3: critical navigator task created')
      else err('Step 3: critical navigator task NOT found')

      // Step 4: Realtime notification
      const { data: notifs } = await admin.from('realtime_notifications').select('*').eq('member_id', memberId)
      testNotifIds.push(...(notifs ?? []).map(n => n.id))
      if ((notifs ?? []).length > 0) ok('Step 4: Realtime notification inserted')
      else err('Step 4: Realtime notification NOT found')

      // Step 5: [STUB][SMS][URGENT] logged to console
      const smsLogged = logs.some(l => l.includes('[STUB][SMS][URGENT]'))
      if (smsLogged) ok('Step 5: [STUB][SMS][URGENT] log confirmed in console output')
      else err('Step 5: [STUB][SMS][URGENT] NOT found in console output')
    }

    // ── Test 2: Normal transcript — no false positive ─────────────────────
    console.log('\nTest 2 — Normal transcript produces no false positive')
    {
      const memberId = await createTestMember('T2')
      const transcript = "I'm feeling pretty good today. Had oatmeal for breakfast and took all my medications. Watched my shows in the evening."

      await handleCrisisDetection({ memberId, transcript })

      const { data: alerts }  = await admin.from('alerts').select('id').eq('member_id', memberId)
      const { data: tasks }   = await admin.from('navigator_tasks').select('id').eq('member_id', memberId)
      const { data: notifs }  = await admin.from('realtime_notifications').select('id').eq('member_id', memberId)
      const { data: emLogs }  = await admin.from('emergency_log').select('id').eq('member_id', memberId)

      testAlertIds.push(...(alerts ?? []).map(a => a.id))
      testNotifIds.push(...(notifs ?? []).map(n => n.id))
      testEmergencyLogIds.push(...(emLogs ?? []).map(e => e.id))

      const total = (alerts?.length ?? 0) + (tasks?.length ?? 0) + (notifs?.length ?? 0) + (emLogs?.length ?? 0)
      if (total === 0) ok('No escalation for normal transcript — 0 alerts, tasks, notifs, logs')
      else err(`False positive: ${total} row(s) created for normal transcript`)
    }

    // ── Test 3: "fell asleep watching TV" — no false positive ─────────────
    console.log('\nTest 3 — "fell asleep watching TV" produces no false positive')
    {
      const memberId = await createTestMember('T3')
      const transcript = "Oh you know, I fell asleep watching TV last night. Slept right through it. It was very comfortable."

      await handleCrisisDetection({ memberId, transcript })

      const { data: alerts }  = await admin.from('alerts').select('id').eq('member_id', memberId)
      const { data: tasks }   = await admin.from('navigator_tasks').select('id').eq('member_id', memberId)
      const { data: emLogs }  = await admin.from('emergency_log').select('id').eq('member_id', memberId)

      testAlertIds.push(...(alerts ?? []).map(a => a.id))
      testEmergencyLogIds.push(...(emLogs ?? []).map(e => e.id))

      const total = (alerts?.length ?? 0) + (tasks?.length ?? 0) + (emLogs?.length ?? 0)
      if (total === 0) ok('"fell asleep watching TV" — no escalation (correct, not a crisis phrase)')
      else err(`False positive: "fell asleep" triggered ${total} row(s)`)
    }

    // ── Test 4: Detection failure → fallback navigator task ───────────────
    console.log('\nTest 4 — Crisis detection failure creates fallback navigator task')
    {
      const memberId = await createTestMember('T4')

      // _scanner throws to simulate a crashed phrase-scanning engine
      await handleCrisisDetection({
        memberId,
        transcript: 'any transcript',
        _scanner: () => { throw new Error('Scanner engine crashed') },
      })

      const { data: tasks } = await admin
        .from('navigator_tasks')
        .select('*')
        .eq('member_id', memberId)
        .eq('task_type', 'crisis_detection_failure')

      const fallbackTask = (tasks ?? []).find(
        t => t.description === 'Crisis detection failed — manual review required',
      )
      if (fallbackTask) ok('Fallback navigator task created with correct description')
      else err('Fallback navigator task NOT found or description mismatch', (tasks ?? []).map(t => t.description))

      // handleCrisisDetection must not propagate the exception
      ok('Call processing continued normally (no exception was thrown to caller)')
    }

  } finally {
    await cleanup()
  }

  console.log(`\n${'─'.repeat(50)}`)
  if (fail === 0) {
    console.log(`✅ All crisis detection tests passed — ${pass} checks`)
  } else {
    console.log(`❌ ${fail} test(s) FAILED — ${pass} passed`)
    process.exit(1)
  }
}

run().catch(e => { console.error('Fatal:', e); process.exit(1) })
