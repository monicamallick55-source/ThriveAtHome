// Clear script — removes all seeded test data for test-family@thriveathome.dev and
// test-navigator@thriveathome.dev. Safe to run even if some rows do not exist.

import { createClient } from '@supabase/supabase-js'
import { requireEnv, requireServerEnv } from '../lib/env'

const SUPABASE_URL = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_KEY = requireServerEnv('SUPABASE_SERVICE_ROLE_KEY')

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TEST_EMAIL = 'test-family@thriveathome.dev'
const NAV_EMAIL = 'test-navigator@thriveathome.dev'

async function clear(): Promise<void> {
  console.log('── Clear: ThriveAtHome test data ───────────────────────')

  // ── 1. Find family_members and linked member ────────────────────
  const { data: existingUsers } = await admin.auth.admin.listUsers()
  const authUser = existingUsers?.users.find((u: any) => u.email === TEST_EMAIL)

  let memberId: string | null = null

  if (authUser) {
    const { data: fm } = await admin
      .from('family_members')
      .select('id, member_id')
      .eq('supabase_auth_id', authUser.id)
      .maybeSingle()

    if (fm?.member_id) {
      memberId = fm.member_id
    }
  }

  // ── 2. Delete member (cascades to all child tables) ────────────
  if (memberId) {
    const { error } = await admin.from('members').delete().eq('id', memberId)
    if (error) console.error('   ⚠ members delete error:', error.message)
    else console.log(`   ✅ Deleted member ${memberId} (cascade: calls, alerts, notifications, tasks, messages, documents)`)
  } else {
    console.log('   ↩  No member to delete')
  }

  // ── 3. Delete family_members row ───────────────────────────────
  if (authUser) {
    const { error } = await admin
      .from('family_members')
      .delete()
      .eq('supabase_auth_id', authUser.id)
    if (error) console.error('   ⚠ family_members delete error:', error.message)
    else console.log('   ✅ Deleted family_members row')

    // ── 4. Delete auth user ────────────────────────────────────────
    const { error: authErr } = await admin.auth.admin.deleteUser(authUser.id)
    if (authErr) console.error('   ⚠ auth user delete error:', authErr.message)
    else console.log(`   ✅ Deleted auth user: ${TEST_EMAIL}`)
  } else {
    console.log('   ↩  No auth user found for', TEST_EMAIL)
  }

  // ── 5. Delete test navigator ────────────────────────────────────
  const { data: nav } = await admin
    .from('care_navigators')
    .select('id')
    .eq('email', NAV_EMAIL)
    .maybeSingle()

  if (nav) {
    const { error } = await admin.from('care_navigators').delete().eq('id', nav.id)
    if (error) console.error('   ⚠ care_navigators delete error:', error.message)
    else console.log(`   ✅ Deleted care navigator (${nav.id})`)
  } else {
    console.log('   ↩  No test navigator found')
  }

  console.log('\n── Clear complete ───────────────────────────────────────')
}

clear().catch((e) => {
  console.error('\n❌ Clear failed:', e.message ?? e)
  process.exit(1)
})
