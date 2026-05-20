// Test script for family-nudge-check logic — verifies nudge fires after 7-day absence with
// active alert, and does NOT fire again within the 7-day dedup window.
// All test rows are deleted at the end. Safe to run multiple times.

import { createClient } from '@supabase/supabase-js'
import { requireEnv, requireServerEnv } from '../lib/env'

const SUPABASE_URL = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_KEY = requireServerEnv('SUPABASE_SERVICE_ROLE_KEY')

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

let passed = 0
let failed = 0

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ ${label}`)
    passed++
  } else {
    console.log(`  ❌ ${label}`)
    failed++
  }
}

const NUDGE_WINDOW_DAYS = 7
const DEDUP_WINDOW_DAYS = 7

// ── Core nudge logic (mirrors the Edge Function but runs in-process for testing) ─────────────

async function runNudgeCheck(adminClient: typeof admin): Promise<{ nudgesSent: number; nudgesSkipped: number }> {
  const now = new Date()
  const cutoff = new Date(now.getTime() - NUDGE_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const dedupCutoff = new Date(now.getTime() - DEDUP_WINDOW_DAYS * 24 * 60 * 60 * 1000)

  const { data: candidates } = await adminClient
    .from('family_members')
    .select('id, member_id, full_name')
    .not('member_id', 'is', null)
    .or(`last_login_at.is.null,last_login_at.lte.${cutoff.toISOString()}`)

  let nudgesSent = 0
  let nudgesSkipped = 0

  for (const fm of (candidates ?? [])) {
    if (!fm.member_id) continue

    const { data: alerts } = await adminClient
      .from('alerts')
      .select('id')
      .eq('member_id', fm.member_id)
      .eq('acknowledged', false)
      .limit(1)

    if (!alerts || alerts.length === 0) {
      nudgesSkipped++
      continue
    }

    const { data: recent } = await adminClient
      .from('realtime_notifications')
      .select('id')
      .eq('member_id', fm.member_id)
      .eq('type', 'family_nudge')
      .gte('created_at', dedupCutoff.toISOString())
      .limit(1)

    if (recent && recent.length > 0) {
      nudgesSkipped++
      continue
    }

    const { error: insertError } = await adminClient.from('realtime_notifications').insert({
      member_id: fm.member_id,
      type: 'family_nudge',
      title: 'Family check-in reminder',
      body: 'Your family member has not checked the app in a week and there are active alerts.',
      severity: 'concern',
    })

    if (!insertError) nudgesSent++
  }

  return { nudgesSent, nudgesSkipped }
}

// ── Setup helpers ─────────────────────────────────────────────────────────────────────────────

async function createTestMember() {
  const { data: member, error } = await admin
    .from('members')
    .insert({
      full_name: 'Nudge Test Senior',
      preferred_name: 'NudgeTest',
      date_of_birth: '1945-01-01',
      phone_number: '+15550009999',
      plan_tier: 'basics',
      status: 'active',
    })
    .select('id')
    .maybeSingle()
  if (error || !member) throw new Error('Failed to create test member: ' + (error?.message ?? 'no data'))
  return member.id as string
}

async function createTestFamilyMember(memberId: string, lastLoginAt: string | null) {
  // Create a dummy auth user first
  const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
    email: `nudge-test-fm-${Date.now()}@thriveathome.dev`,
    password: 'TestPassword123!',
    email_confirm: true,
  })
  if (authErr || !authUser.user) throw new Error('Failed to create auth user: ' + authErr?.message)

  const { data: fm, error } = await admin
    .from('family_members')
    .insert({
      member_id: memberId,
      supabase_auth_id: authUser.user.id,
      full_name: 'Nudge Test Family',
      email: authUser.user.email!,
      role: 'family',
      last_login_at: lastLoginAt,
    })
    .select('id')
    .maybeSingle()
  if (error || !fm) throw new Error('Failed to create family member: ' + (error?.message ?? 'no data'))
  return { fmId: fm.id as string, authUserId: authUser.user.id as string }
}

async function createTestAlert(memberId: string) {
  const { data: alert, error } = await admin
    .from('alerts')
    .insert({
      member_id: memberId,
      alert_type: 'mood_drop',
      severity: 'concern',
      message: 'Nudge test alert',
      acknowledged: false,
    })
    .select('id')
    .maybeSingle()
  if (error || !alert) throw new Error('Failed to create alert: ' + (error?.message ?? 'no data'))
  return alert.id as string
}

async function countNudgeNotifications(memberId: string): Promise<number> {
  const { data } = await admin
    .from('realtime_notifications')
    .select('id')
    .eq('member_id', memberId)
    .eq('type', 'family_nudge')
  return data?.length ?? 0
}

// ── Cleanup ───────────────────────────────────────────────────────────────────────────────────

async function cleanup(memberId: string, authUserIds: string[]) {
  await admin.from('realtime_notifications').delete().eq('member_id', memberId)
  await admin.from('alerts').delete().eq('member_id', memberId)
  // family_members rows deleted by cascade when member is deleted
  await admin.from('members').delete().eq('id', memberId)
  for (const authId of authUserIds) {
    await admin.auth.admin.deleteUser(authId)
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('── Test: family-nudge-check logic ──────────────────────────')

  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()

  let memberId: string | null = null
  let authUserIds: string[] = []

  try {
    // ── Test 1: Nudge fires after 7-day absence + active alert ──────────────────
    console.log('\nTest 1: Nudge fires after 7-day absence with active alert')

    memberId = await createTestMember()
    const { fmId, authUserId } = await createTestFamilyMember(memberId, eightDaysAgo)
    authUserIds.push(authUserId)
    await createTestAlert(memberId)

    const beforeCount = await countNudgeNotifications(memberId)
    const result1 = await runNudgeCheck(admin)
    const afterCount = await countNudgeNotifications(memberId)

    assert(beforeCount === 0, 'No nudge notifications before first run')
    assert(result1.nudgesSent >= 1, `nudgesSent >= 1 (got ${result1.nudgesSent})`)
    assert(afterCount >= 1, `At least 1 family_nudge notification inserted (got ${afterCount})`)

    // ── Test 2: Dedup — nudge does NOT fire again within 7-day window ────────────
    console.log('\nTest 2: Dedup — second run within 7-day window does not send another nudge')

    const result2 = await runNudgeCheck(admin)
    const afterCount2 = await countNudgeNotifications(memberId)

    assert(afterCount2 === afterCount, `Count unchanged after second run (still ${afterCount})`)
    // The family member may be skipped entirely or nudged again if more members exist;
    // check that no additional notification was inserted for this specific member
    assert(afterCount2 - afterCount === 0, 'No additional nudge inserted for this member (dedup)')

    // ── Test 3: No nudge when last_login_at is recent ───────────────────────────
    console.log('\nTest 3: No nudge when last_login_at is 2 days ago')

    // Update last_login_at to 2 days ago for this family member
    await admin
      .from('family_members')
      .update({ last_login_at: twoDaysAgo })
      .eq('id', fmId)

    // Clear existing nudge notifications so dedup doesn't confuse the check
    await admin
      .from('realtime_notifications')
      .delete()
      .eq('member_id', memberId)
      .eq('type', 'family_nudge')

    const beforeRecent = await countNudgeNotifications(memberId)
    await runNudgeCheck(admin)
    const afterRecent = await countNudgeNotifications(memberId)

    assert(beforeRecent === 0, 'No nudges before run with recent login')
    assert(afterRecent === 0, 'No nudge sent when last_login_at is within 7 days')

    // ── Test 4: No nudge when no active alerts ───────────────────────────────────
    console.log('\nTest 4: No nudge when no unacknowledged alerts exist')

    // Set last_login_at back to 8 days ago but acknowledge all alerts
    await admin.from('family_members').update({ last_login_at: eightDaysAgo }).eq('id', fmId)
    await admin
      .from('alerts')
      .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
      .eq('member_id', memberId)

    const beforeNoAlert = await countNudgeNotifications(memberId)
    await runNudgeCheck(admin)
    const afterNoAlert = await countNudgeNotifications(memberId)

    assert(afterNoAlert === beforeNoAlert, 'No nudge when all alerts are acknowledged')

  } catch (err) {
    console.error('Test error:', err)
    failed++
  } finally {
    // Cleanup
    if (memberId) {
      await cleanup(memberId, authUserIds)
      console.log('\n  🧹 Test rows cleaned up')
    }
  }

  console.log(`\n── Results: ${passed} passed, ${failed} failed ───────────────`)
  if (failed > 0) process.exit(1)
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
