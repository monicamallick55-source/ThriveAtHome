// Phase 54 verification — Medicare Advantage / Enterprise Reporting API
// Tests: endpoint response, cohort suppression, audit log, rate limiting
// Run: npx tsx --env-file=.env.local scripts/test-phase54-enterprise-api.ts

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const TEST_API_KEY = 'ent_phase54_test_key_' + Date.now()

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

let passed = 0
let failed = 0
let testEmployerId: string | null = null
let testKeyId: string | null = null

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✅ ${msg}`)
    passed++
  } else {
    console.error(`  ❌ ${msg}`)
    failed++
  }
}

async function setup() {
  console.log('\n🔧 Setup: inserting test employer and API key...')

  // Create a test employer account
  const { data: employer, error: empErr } = await admin
    .from('employer_accounts')
    .insert({
      company_name: 'Phase54 Test Corp',
      contact_name: 'Test Contact',
      contact_email: 'test-phase54@thriveathome.dev',
      plan_tier: 'essentials',
      seats_purchased: 20,
      seats_used: 0,
      status: 'active',
    })
    .select('id')
    .single()

  if (empErr || !employer) {
    console.error('Failed to create test employer:', empErr)
    process.exit(1)
  }
  testEmployerId = employer.id
  console.log(`  → Test employer created: ${testEmployerId}`)

  // Create an API key for this employer
  const { data: key, error: keyErr } = await admin
    .from('partner_api_keys')
    .insert({
      employer_account_id: testEmployerId,
      key_name: 'Phase54 Test Key',
      api_key: TEST_API_KEY,
      is_active: true,
      requests_today: 0,
    })
    .select('id')
    .single()

  if (keyErr || !key) {
    console.error('Failed to create test API key:', keyErr)
    await cleanup()
    process.exit(1)
  }
  testKeyId = key.id
  console.log(`  → Test API key created: ${testKeyId}`)
}

async function testEndpointExists() {
  console.log('\n📋 Test 1: Endpoint exists and rejects missing auth...')
  const res = await fetch(`${BASE_URL}/api/enterprise/outcomes`)
  assert(res.status === 401, `No auth → 401 (got ${res.status})`)

  const body = await res.json() as Record<string, unknown>
  assert(typeof body.error === 'string' && (body.error as string).includes('Authorization'), 'Error message references Authorization header')
}

async function testInvalidKey() {
  console.log('\n📋 Test 2: Invalid API key → 401...')
  const res = await fetch(`${BASE_URL}/api/enterprise/outcomes`, {
    headers: { Authorization: 'Bearer not_a_real_key_xyz123' },
  })
  assert(res.status === 401, `Invalid key → 401 (got ${res.status})`)
  const body = await res.json() as Record<string, unknown>
  assert(body.error === 'Invalid API key', `Error message correct (got: ${body.error})`)
}

async function testCohortSuppression() {
  console.log('\n📋 Test 3: Cohort < 10 → data suppressed...')
  // The test employer has 0 enrolled members, well below the 10-member threshold
  const res = await fetch(`${BASE_URL}/api/enterprise/outcomes`, {
    headers: { Authorization: `Bearer ${TEST_API_KEY}` },
  })
  assert(res.status === 200, `Request with small cohort → 200 (got ${res.status})`)

  const body = await res.json() as Record<string, unknown>
  assert(body.data_suppressed === true, `data_suppressed is true (got: ${body.data_suppressed})`)
  assert(body.reason === 'Cohort too small to report', `reason correct (got: ${body.reason})`)
  assert(body.cohort_minimum === 10, `cohort_minimum is 10 (got: ${body.cohort_minimum})`)
  console.log(`  ℹ  data_suppressed: ${body.data_suppressed}, reason: "${body.reason}"`)
}

async function testAuditLog() {
  console.log('\n📋 Test 4: API access logged to audit_log...')
  const before = new Date(Date.now() - 5000).toISOString()

  // Make a request that should be logged
  await fetch(`${BASE_URL}/api/enterprise/outcomes`, {
    headers: { Authorization: `Bearer ${TEST_API_KEY}` },
  })

  const { data: auditRows, error } = await admin
    .from('audit_log')
    .select('id, action, resource_type, resource_id')
    .eq('action', 'ENTERPRISE_API_ACCESS')
    .eq('resource_type', 'partner_api_keys')
    .eq('resource_id', testKeyId!)
    .gte('created_at', before)

  if (error) {
    console.error('Audit log query error:', error)
    assert(false, 'Audit log query succeeded')
    return
  }

  assert((auditRows?.length ?? 0) > 0, `Audit log entry created (found ${auditRows?.length ?? 0} rows)`)
  assert(auditRows?.[0]?.action === 'ENTERPRISE_API_ACCESS', `Action is ENTERPRISE_API_ACCESS`)
  assert(auditRows?.[0]?.resource_type === 'partner_api_keys', `resource_type is partner_api_keys`)
}

async function testRateLimit() {
  console.log('\n📋 Test 5: Rate limiting (set counter to 100, next request → 429)...')

  // Set requests_today to 100 directly in DB to simulate hitting the limit
  await admin
    .from('partner_api_keys')
    .update({ requests_today: 100, requests_date: new Date().toISOString().slice(0, 10) })
    .eq('id', testKeyId!)

  const res = await fetch(`${BASE_URL}/api/enterprise/outcomes`, {
    headers: { Authorization: `Bearer ${TEST_API_KEY}` },
  })
  assert(res.status === 429, `101st effective request → 429 (got ${res.status})`)

  const body = await res.json() as Record<string, unknown>
  assert(typeof body.error === 'string' && (body.error as string).includes('Rate limit'), `Error mentions rate limit (got: ${body.error})`)

  // Reset counter for cleanup
  await admin
    .from('partner_api_keys')
    .update({ requests_today: 0, requests_date: null })
    .eq('id', testKeyId!)
}

async function cleanup() {
  console.log('\n🧹 Cleanup: removing test data...')
  if (testKeyId) {
    await admin.from('partner_api_keys').delete().eq('id', testKeyId)
    console.log('  → API key deleted')
  }
  if (testEmployerId) {
    await admin.from('employer_accounts').delete().eq('id', testEmployerId)
    console.log('  → Employer account deleted (cascades API keys + invitations)')
  }
}

async function run() {
  console.log(`\n═══════════════════════════════════════`)
  console.log(`  Phase 54 — Enterprise Reporting API`)
  console.log(`  Target: ${BASE_URL}`)
  console.log(`═══════════════════════════════════════`)

  await setup()
  await testEndpointExists()
  await testInvalidKey()
  await testCohortSuppression()
  await testAuditLog()
  await testRateLimit()
  await cleanup()

  console.log(`\n───────────────────────────────────────`)
  console.log(`  ${passed} passed   ${failed} failed`)
  console.log(`───────────────────────────────────────`)

  if (failed > 0) {
    console.error('\n❌ Some tests failed. See above for details.')
    process.exit(1)
  } else {
    console.log('\n✅ All Phase 54 tests PASSED')
  }
}

run().catch(err => {
  console.error('Test script error:', err)
  process.exit(1)
})
