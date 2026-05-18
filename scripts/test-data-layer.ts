// Data layer test script — verifies all lib/data/ functions return {data, error}
// and never throw. Creates a temporary member for testing, then deletes it.

import { createClient } from '@supabase/supabase-js'
import { requireEnv, requireServerEnv } from '../lib/env'
import {
  getMemberById,
  getMemberForAuthUser,
  getCallsForMember,
  getCallById,
  getAlertsForMember,
  getUnacknowledgedAlertsCount,
  acknowledgeAlert,
  getNotificationsForMember,
  markNotificationRead,
  getFamilyMemberByAuthId,
  getFamilyMembersForMember,
  getTasksForMember,
  createFamilyTask,
  completeFamilyTask,
  getMessagesForMember,
  createFamilyMessage,
  getDocumentsForMember,
} from '../lib/data'

const SUPABASE_URL = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_KEY = requireServerEnv('SUPABASE_SERVICE_ROLE_KEY')

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TEST_EMAIL = 'data-layer-test@thriveathome-internal.test'
const TEST_PASSWORD = 'DataLayerTest-Phase7!'
const INVALID_UUID = '00000000-0000-0000-0000-000000000000'

let passed = 0
let failed = 0
let authUserId: string | null = null
let familyMemberId: string | null = null
let memberId: string | null = null
let callId: string | null = null
let alertId: string | null = null
let notifId: string | null = null
let taskId: string | null = null
let messageId: string | null = null

function assert(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ✅ ${label}`)
    passed++
  } else {
    console.error(`  ❌ FAILED: ${label}${detail ? ` — ${detail}` : ''}`)
    failed++
  }
}

async function setup(): Promise<void> {
  console.log('\n── Setup ───────────────────────────────────────────────')

  // Clean up any stale test user from a previous crashed run
  const { data: existingUsers } = await admin.auth.admin.listUsers()
  const stale = existingUsers?.users.find((u) => u.email === TEST_EMAIL)
  if (stale) {
    await admin.from('family_members').delete().eq('supabase_auth_id', stale.id)
    await admin.auth.admin.deleteUser(stale.id)
    console.log('  Cleaned up stale test user')
  }

  // Create auth user
  const { data: newUser, error: userErr } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (userErr || !newUser.user) throw new Error(`Setup: auth user create failed: ${userErr?.message}`)
  authUserId = newUser.user.id

  // Create family_members row
  const { data: fm, error: fmErr } = await admin
    .from('family_members')
    .insert({
      supabase_auth_id: authUserId,
      full_name: 'Test User',
      email: TEST_EMAIL,
      role: 'family',
    })
    .select('id')
    .maybeSingle()
  if (fmErr || !fm) throw new Error(`Setup: family_members insert failed: ${fmErr?.message}`)
  familyMemberId = fm.id

  // Create member
  const { data: member, error: memberErr } = await admin
    .from('members')
    .insert({
      full_name: 'Test Senior',
      preferred_name: 'Testy',
      date_of_birth: '1940-01-01',
      phone_number: '+15559999999',
      plan_tier: 'basics',
      status: 'active',
    })
    .select('id')
    .maybeSingle()
  if (memberErr || !member) throw new Error(`Setup: members insert failed: ${memberErr?.message}`)
  memberId = member.id

  // Link family_members → member
  await admin.from('family_members').update({ member_id: memberId }).eq('id', familyMemberId)

  // Create a call
  const { data: call, error: callErr } = await admin
    .from('check_in_calls')
    .insert({ member_id: memberId, status: 'completed', mood_score: 7, call_type: 'check_in' })
    .select('id')
    .maybeSingle()
  if (callErr || !call) throw new Error(`Setup: check_in_calls insert failed: ${callErr?.message}`)
  callId = call.id

  // Create an alert
  const { data: alert, error: alertErr } = await admin
    .from('alerts')
    .insert({ member_id: memberId, alert_type: 'mood_drop', severity: 'concern', message: 'Test alert', acknowledged: false })
    .select('id')
    .maybeSingle()
  if (alertErr || !alert) throw new Error(`Setup: alerts insert failed: ${alertErr?.message}`)
  alertId = alert.id

  // Create a notification
  const { data: notif, error: notifErr } = await admin
    .from('realtime_notifications')
    .insert({ member_id: memberId, type: 'new_alert', title: 'Test', body: 'Test notification', severity: 'info', read: false })
    .select('id')
    .maybeSingle()
  if (notifErr || !notif) throw new Error(`Setup: realtime_notifications insert failed: ${notifErr?.message}`)
  notifId = notif.id

  console.log(`  Member: ${memberId}`)
  console.log(`  Call:   ${callId}`)
  console.log(`  Alert:  ${alertId}`)
  console.log(`  Notif:  ${notifId}`)
}

async function runTests(): Promise<void> {
  console.log('\n── Tests ───────────────────────────────────────────────')

  // getMemberById — valid ID
  const m1 = await getMemberById(memberId!)
  assert('getMemberById: returns data for valid ID', m1.data !== null && m1.error === null, JSON.stringify(m1))
  assert('getMemberById: data.full_name is "Test Senior"', m1.data?.full_name === 'Test Senior')

  // getMemberById — invalid ID (must not throw, must return error)
  const m2 = await getMemberById(INVALID_UUID)
  assert('getMemberById: invalid ID returns {data:null, error:"Not found"}', m2.data === null && m2.error === 'Not found', JSON.stringify(m2))

  // getMemberForAuthUser — valid
  const m3 = await getMemberForAuthUser(authUserId!)
  assert('getMemberForAuthUser: returns member for valid auth user', m3.data !== null && m3.error === null, JSON.stringify(m3))

  // getMemberForAuthUser — invalid auth user ID
  const m4 = await getMemberForAuthUser(INVALID_UUID)
  assert('getMemberForAuthUser: invalid auth ID returns null', m4.data === null, JSON.stringify(m4))

  // getCallsForMember
  const c1 = await getCallsForMember(memberId!)
  assert('getCallsForMember: returns array', Array.isArray(c1.data) && c1.error === null, JSON.stringify(c1))
  assert('getCallsForMember: includes seeded call', (c1.data?.length ?? 0) >= 1)

  // getCallsForMember — unknown member returns empty array
  const c2 = await getCallsForMember(INVALID_UUID)
  assert('getCallsForMember: unknown member returns empty array, not error', Array.isArray(c2.data) && c2.data.length === 0 && c2.error === null, JSON.stringify(c2))

  // getCallById — valid
  const c3 = await getCallById(callId!)
  assert('getCallById: returns call for valid ID', c3.data !== null && c3.error === null, JSON.stringify(c3))

  // getCallById — invalid
  const c4 = await getCallById(INVALID_UUID)
  assert('getCallById: invalid ID returns {data:null, error:"Not found"}', c4.data === null && c4.error === 'Not found', JSON.stringify(c4))

  // getAlertsForMember
  const a1 = await getAlertsForMember(memberId!)
  assert('getAlertsForMember: returns array', Array.isArray(a1.data) && a1.error === null, JSON.stringify(a1))

  // getUnacknowledgedAlertsCount
  const a2 = await getUnacknowledgedAlertsCount(memberId!)
  assert('getUnacknowledgedAlertsCount: returns a number', a2.data !== null && typeof a2.data === 'number', JSON.stringify(a2))
  assert('getUnacknowledgedAlertsCount: count is at least 1 (seeded unacked alert)', (a2.data ?? 0) >= 1)

  // acknowledgeAlert
  const a3 = await acknowledgeAlert(alertId!, familyMemberId!)
  assert('acknowledgeAlert: returns acknowledged alert', a3.data?.acknowledged === true && a3.error === null, JSON.stringify(a3))

  // getNotificationsForMember
  const n1 = await getNotificationsForMember(memberId!)
  assert('getNotificationsForMember: returns array', Array.isArray(n1.data) && n1.error === null, JSON.stringify(n1))

  // markNotificationRead
  const n2 = await markNotificationRead(notifId!)
  assert('markNotificationRead: returns read notification', n2.data?.read === true && n2.error === null, JSON.stringify(n2))

  // getFamilyMemberByAuthId — valid
  const f1 = await getFamilyMemberByAuthId(authUserId!)
  assert('getFamilyMemberByAuthId: returns row for valid auth user', f1.data !== null && f1.error === null, JSON.stringify(f1))

  // getFamilyMemberByAuthId — invalid
  const f2 = await getFamilyMemberByAuthId(INVALID_UUID)
  assert('getFamilyMemberByAuthId: invalid ID returns null', f2.data === null, JSON.stringify(f2))

  // getFamilyMembersForMember
  const f3 = await getFamilyMembersForMember(memberId!)
  assert('getFamilyMembersForMember: returns array', Array.isArray(f3.data) && f3.error === null, JSON.stringify(f3))
  assert('getFamilyMembersForMember: includes test family member', (f3.data?.length ?? 0) >= 1)

  // createFamilyTask
  const t1 = await createFamilyTask({ memberId: memberId!, createdBy: familyMemberId!, title: 'Test task', taskType: 'other' })
  assert('createFamilyTask: returns created task', t1.data !== null && t1.error === null, JSON.stringify(t1))
  taskId = t1.data?.id ?? null

  // getTasksForMember
  const t2 = await getTasksForMember(memberId!)
  assert('getTasksForMember: returns array with new task', Array.isArray(t2.data) && (t2.data?.length ?? 0) >= 1, JSON.stringify(t2))

  // completeFamilyTask
  if (taskId) {
    const t3 = await completeFamilyTask(taskId)
    assert('completeFamilyTask: returns completed task', t3.data?.completed === true && t3.error === null, JSON.stringify(t3))
  }

  // completeFamilyTask — invalid ID
  const t4 = await completeFamilyTask(INVALID_UUID)
  assert('completeFamilyTask: invalid ID returns {data:null, error:"Not found"}', t4.data === null && t4.error === 'Not found', JSON.stringify(t4))

  // createFamilyMessage
  const msg1 = await createFamilyMessage(memberId!, familyMemberId!, 'Hello from the test suite')
  assert('createFamilyMessage: returns created message', msg1.data !== null && msg1.error === null, JSON.stringify(msg1))
  messageId = msg1.data?.id ?? null

  // getMessagesForMember
  const msg2 = await getMessagesForMember(memberId!)
  assert('getMessagesForMember: returns array with new message', Array.isArray(msg2.data) && (msg2.data?.length ?? 0) >= 1, JSON.stringify(msg2))

  // getDocumentsForMember — empty is fine
  const d1 = await getDocumentsForMember(memberId!)
  assert('getDocumentsForMember: returns array (may be empty)', Array.isArray(d1.data) && d1.error === null, JSON.stringify(d1))
}

async function cleanup(): Promise<void> {
  console.log('\n── Cleanup ─────────────────────────────────────────────')

  if (memberId) {
    await admin.from('members').delete().eq('id', memberId)
    console.log('  ✅ Deleted member (cascades: calls, alerts, notifications, tasks, messages)')
  }
  if (authUserId) {
    await admin.from('family_members').delete().eq('supabase_auth_id', authUserId)
    await admin.auth.admin.deleteUser(authUserId)
    console.log('  ✅ Deleted auth user and family_members row')
  }
}

async function main(): Promise<void> {
  await setup()
  await runTests()
  await cleanup()

  console.log(`\n── Results ─────────────────────────────────────────────`)
  console.log(`  Passed: ${passed}`)
  console.log(`  Failed: ${failed}`)

  if (failed === 0) {
    console.log('\n✅ All data layer tests passed')
  } else {
    console.error(`\n❌ ${failed} test(s) failed`)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('\n❌ Test run failed unexpectedly:', e.message ?? e)
  process.exit(1)
})
