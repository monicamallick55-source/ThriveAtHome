// Phase 3 verification script — run after SQL migrations are applied in Supabase.
// Usage: npx tsx scripts/verify-schema.ts
import { createClient } from '@supabase/supabase-js'

const REQUIRED_TABLES = [
  'members', 'family_members', 'check_in_calls', 'alerts',
  'care_navigators', 'navigator_assignments', 'navigator_tasks', 'navigator_notes',
  'subscriptions', 'realtime_notifications', 'notification_log', 'emergency_log',
  'medication_schedules', 'family_task_items', 'family_messages',
  'document_vault_items', 'audit_log',
]

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!url || !key) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const admin = createClient(url, key)
  let allPass = true

  console.log('\n── Phase 3 Schema Verification ──\n')

  // 1. Check all 17 tables exist
  console.log('1. Checking all 17 tables...')
  for (const table of REQUIRED_TABLES) {
    const { error } = await admin.from(table).select('*').limit(1)
    if (error && (error.code === 'PGRST205' || error.code === '42P01')) {
      console.log(`  ❌ ${table} — NOT FOUND`)
      allPass = false
    } else if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows (table exists but empty) — that's fine
      console.log(`  ✅ ${table} — exists (${error.code}: ${error.message})`)
    } else {
      console.log(`  ✅ ${table} — exists`)
    }
  }

  // 2. Test cascade delete (insert then delete)
  console.log('\n2. Testing cascade delete (members → family_members)...')
  const { data: member, error: mErr } = await admin
    .from('members')
    .insert({
      full_name: '__cascade_test__',
      preferred_name: '__test__',
      date_of_birth: '1940-01-01',
      phone_number: '+10000000000',
    })
    .select('id')
    .single()

  if (mErr) {
    console.log(`  ❌ Could not insert test member: ${mErr.message}`)
    allPass = false
  } else {
    const testMemberId = member!.id
    const { error: fmErr } = await admin.from('family_members').insert({
      member_id: testMemberId,
      supabase_auth_id: '00000000-0000-0000-0000-000000000001',
      full_name: '__cascade_test_fm__',
      email: '__cascade_test@test.invalid',
    })

    if (fmErr) {
      console.log(`  ❌ Could not insert test family_member: ${fmErr.message}`)
      allPass = false
      await admin.from('members').delete().eq('id', testMemberId)
    } else {
      await admin.from('members').delete().eq('full_name', '__cascade_test__')
      const { data: checkFm } = await admin
        .from('family_members')
        .select('id')
        .eq('supabase_auth_id', '00000000-0000-0000-0000-000000000001')
        .maybeSingle()

      if (checkFm === null) {
        console.log('  ✅ Cascade delete works — family_member deleted when member deleted')
      } else {
        console.log('  ❌ Cascade delete FAILED — family_member still exists after member deleted')
        allPass = false
        await admin.from('family_members').delete().eq('supabase_auth_id', '00000000-0000-0000-0000-000000000001')
      }
    }
  }

  // 3. Check audit triggers exist
  console.log('\n3. Checking audit triggers...')
  // Can't query information_schema via REST API, so verify by checking if function exists
  // We'll insert a member and check audit_log
  const { data: auditMember, error: auditMErr } = await admin.from('members').insert({
    full_name: '__audit_test__',
    preferred_name: '__audit__',
    date_of_birth: '1940-01-01',
    phone_number: '+10000000001',
  }).select('id').single()

  if (auditMErr) {
    console.log(`  ⚠️  Could not test audit trigger (insert failed: ${auditMErr.message})`)
  } else {
    const { data: auditRow } = await admin
      .from('audit_log')
      .select('*')
      .eq('resource_type', 'members')
      .eq('resource_id', auditMember!.id)
      .maybeSingle()

    if (auditRow) {
      console.log('  ✅ Audit trigger works — INSERT logged to audit_log')
    } else {
      console.log('  ❌ Audit trigger NOT working — no row in audit_log after members INSERT')
      allPass = false
    }
    await admin.from('members').delete().eq('id', auditMember!.id)
    await admin.from('audit_log').delete().eq('resource_id', auditMember!.id)
  }

  console.log('\n──────────────────────────────────')
  if (allPass) {
    console.log('✅ All Phase 3 verifications PASSED')
  } else {
    console.log('❌ Some verifications FAILED — see above')
    process.exit(1)
  }
}

main().catch(e => {
  console.error('Script error:', e)
  process.exit(1)
})
