// ThriveAtHome — Phase 4 RLS Verification Script
// Creates two auth users with separate members and verifies cross-user isolation.
// All test rows are deleted at the end of this script.

import { createClient } from '@supabase/supabase-js'
import { requireEnv, requireServerEnv } from '../lib/env'

const SUPABASE_URL = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
const ANON_KEY = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
const SERVICE_KEY = requireServerEnv('SUPABASE_SERVICE_ROLE_KEY')

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TEST_PASSWORD = 'Test-RLS-Phase4!99'
const EMAIL_A = 'rls-test-a@thriveathome-internal.test'
const EMAIL_B = 'rls-test-b@thriveathome-internal.test'

let memberAId: string | null = null
let memberBId: string | null = null
let authUserAId: string | null = null
let authUserBId: string | null = null

let passed = 0
let failed = 0

function assert(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ✅ ${label}`)
    passed++
  } else {
    console.error(`  ❌ FAILED: ${label}${detail ? ` — ${detail}` : ''}`)
    failed++
  }
}

async function cleanup(): Promise<void> {
  console.log('\n── Cleanup ────────────────────────────────────────────')
  if (memberAId) {
    const { error } = await admin.from('members').delete().eq('id', memberAId)
    if (error) console.error('  cleanup memberA:', error.message)
    else console.log('  deleted member A (cascade deletes family_members)')
  }
  if (memberBId) {
    const { error } = await admin.from('members').delete().eq('id', memberBId)
    if (error) console.error('  cleanup memberB:', error.message)
    else console.log('  deleted member B (cascade deletes family_members)')
  }
  if (authUserAId) {
    const { error } = await admin.auth.admin.deleteUser(authUserAId)
    if (error) console.error('  cleanup authUserA:', error.message)
    else console.log('  deleted auth user A')
  }
  if (authUserBId) {
    const { error } = await admin.auth.admin.deleteUser(authUserBId)
    if (error) console.error('  cleanup authUserB:', error.message)
    else console.log('  deleted auth user B')
  }
}

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════╗')
  console.log('║   Phase 4 — RLS Verification             ║')
  console.log('╚══════════════════════════════════════════╝\n')

  // ── Step 1: Create two auth users ───────────────────────────────────────────
  console.log('── Step 1: Create auth users ──────────────────────────')

  // Clean up any leftover users from prior runs
  const existingUsers = await admin.auth.admin.listUsers()
  for (const u of existingUsers.data?.users ?? []) {
    if (u.email === EMAIL_A || u.email === EMAIL_B) {
      await admin.auth.admin.deleteUser(u.id)
      console.log(`  removed stale user: ${u.email}`)
    }
  }

  const { data: userAData, error: errA } = await admin.auth.admin.createUser({
    email: EMAIL_A,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (errA || !userAData.user) {
    console.error('Failed to create user A:', errA?.message)
    process.exit(1)
  }
  authUserAId = userAData.user.id
  console.log('  created auth user A:', authUserAId)

  const { data: userBData, error: errB } = await admin.auth.admin.createUser({
    email: EMAIL_B,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (errB || !userBData.user) {
    console.error('Failed to create user B:', errB?.message)
    await cleanup()
    process.exit(1)
  }
  authUserBId = userBData.user.id
  console.log('  created auth user B:', authUserBId)

  // ── Step 2: Create two members ───────────────────────────────────────────────
  console.log('\n── Step 2: Create members ────────────────────────────')

  const { data: mA, error: mAErr } = await admin
    .from('members')
    .insert({
      full_name: 'RLS Test Member A',
      preferred_name: 'Member A',
      date_of_birth: '1950-01-01',
      phone_number: '+15550000001',
      preferred_language: 'english',
      timezone: 'America/New_York',
      check_in_frequency: 'daily',
      plan_tier: 'basics',
      status: 'active',
    })
    .select('id')
    .maybeSingle()
  if (mAErr || !mA) {
    console.error('Failed to create member A:', mAErr?.message)
    await cleanup()
    process.exit(1)
  }
  memberAId = mA.id
  console.log('  created member A:', memberAId)

  const { data: mB, error: mBErr } = await admin
    .from('members')
    .insert({
      full_name: 'RLS Test Member B',
      preferred_name: 'Member B',
      date_of_birth: '1948-06-15',
      phone_number: '+15550000002',
      preferred_language: 'english',
      timezone: 'America/New_York',
      check_in_frequency: 'daily',
      plan_tier: 'basics',
      status: 'active',
    })
    .select('id')
    .maybeSingle()
  if (mBErr || !mB) {
    console.error('Failed to create member B:', mBErr?.message)
    await cleanup()
    process.exit(1)
  }
  memberBId = mB.id
  console.log('  created member B:', memberBId)

  // ── Step 3: Create family_members linking each user to their member ──────────
  console.log('\n── Step 3: Link auth users to members ────────────────')

  const { error: fmAErr } = await admin.from('family_members').insert({
    member_id: memberAId,
    supabase_auth_id: authUserAId,
    full_name: 'Family User A',
    email: EMAIL_A,
    role: 'family',
  })
  if (fmAErr) {
    console.error('Failed to create family_member A:', fmAErr.message)
    await cleanup()
    process.exit(1)
  }
  console.log('  linked user A → member A')

  const { error: fmBErr } = await admin.from('family_members').insert({
    member_id: memberBId,
    supabase_auth_id: authUserBId,
    full_name: 'Family User B',
    email: EMAIL_B,
    role: 'family',
  })
  if (fmBErr) {
    console.error('Failed to create family_member B:', fmBErr.message)
    await cleanup()
    process.exit(1)
  }
  console.log('  linked user B → member B')

  // ── Step 4: Sign in as User A — assert sees only Member A ───────────────────
  console.log('\n── Step 4: User A isolation ──────────────────────────')

  const clientA = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error: signInAErr } = await clientA.auth.signInWithPassword({
    email: EMAIL_A,
    password: TEST_PASSWORD,
  })
  if (signInAErr) {
    console.error('Failed to sign in as user A:', signInAErr.message)
    await cleanup()
    process.exit(1)
  }

  const { data: rowsA, error: queryAErr } = await clientA
    .from('members')
    .select('id')
  if (queryAErr) {
    console.error('Query as user A failed:', queryAErr.message)
    await cleanup()
    process.exit(1)
  }

  const idsA = (rowsA ?? []).map((r: { id: string }) => r.id)
  assert('User A sees Member A', idsA.includes(memberAId!), `got: [${idsA.join(', ')}]`)
  assert('User A does NOT see Member B', !idsA.includes(memberBId!), `got: [${idsA.join(', ')}]`)
  assert('User A sees exactly 1 member', idsA.length === 1, `count: ${idsA.length}`)

  // ── Step 5: Sign in as User B — assert sees only Member B ───────────────────
  console.log('\n── Step 5: User B isolation ──────────────────────────')

  const clientB = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error: signInBErr } = await clientB.auth.signInWithPassword({
    email: EMAIL_B,
    password: TEST_PASSWORD,
  })
  if (signInBErr) {
    console.error('Failed to sign in as user B:', signInBErr.message)
    await cleanup()
    process.exit(1)
  }

  const { data: rowsB, error: queryBErr } = await clientB
    .from('members')
    .select('id')
  if (queryBErr) {
    console.error('Query as user B failed:', queryBErr.message)
    await cleanup()
    process.exit(1)
  }

  const idsB = (rowsB ?? []).map((r: { id: string }) => r.id)
  assert('User B sees Member B', idsB.includes(memberBId!), `got: [${idsB.join(', ')}]`)
  assert('User B does NOT see Member A', !idsB.includes(memberAId!), `got: [${idsB.join(', ')}]`)
  assert('User B sees exactly 1 member', idsB.length === 1, `count: ${idsB.length}`)

  // ── Step 6: Service role sees both members ───────────────────────────────────
  console.log('\n── Step 6: Service role reads all ────────────────────')

  const { data: allRows, error: allErr } = await admin
    .from('members')
    .select('id')
    .in('id', [memberAId!, memberBId!])
  if (allErr) {
    console.error('Service role query failed:', allErr.message)
    await cleanup()
    process.exit(1)
  }

  const allIds = (allRows ?? []).map((r: { id: string }) => r.id)
  assert('Service role sees Member A', allIds.includes(memberAId!))
  assert('Service role sees Member B', allIds.includes(memberBId!))
  assert('Service role sees both test members', allIds.length === 2, `count: ${allIds.length}`)

  // ── Cleanup ──────────────────────────────────────────────────────────────────
  await cleanup()

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════')
  if (failed === 0) {
    console.log(`✅ Cross-user isolation: PASSED`)
    console.log(`✅ Own data access: PASSED`)
    console.log(`✅ Service role reads all: PASSED`)
    console.log(`✅ All test data cleaned up`)
    console.log(`\nAll ${passed} assertions passed.`)
  } else {
    console.error(`❌ ${failed} assertion(s) FAILED — see above`)
    console.log(`${passed} passed, ${failed} failed`)
    process.exit(1)
  }
  console.log('════════════════════════════════════════════')
}

main().catch((e: unknown) => {
  console.error('Unexpected error:', e)
  cleanup().finally(() => process.exit(1))
})
