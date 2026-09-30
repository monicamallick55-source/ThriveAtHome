// Retell webhook + tool route tests (G1.3 security, G1.4 call processing).
// Usage:
//   1. Start the app with a TEST key:  RETELL_API_KEY=test_retell_key_g13 npx next dev -p 3055
//   2. RETELL_TEST_KEY=test_retell_key_g13 BASE_URL=http://localhost:3055 npx tsx scripts/test-retell-webhook.ts [g13|g14|all]
// Never uses a real Retell key or places a call. Deletes every row it creates.
import Retell from 'retell-sdk'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3055'
const KEY = process.env.RETELL_TEST_KEY ?? 'test_retell_key_g13'
const only = process.argv[2] ?? 'all'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

let allPass = true
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) allPass = false
}

async function post(path: string, payload: unknown, opts: { sign?: boolean; signature?: string } = {}) {
  const body = JSON.stringify(payload)
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (opts.signature) headers['x-retell-signature'] = opts.signature
  else if (opts.sign !== false) headers['x-retell-signature'] = await Retell.sign(body, KEY)
  const res = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body })
  let json: unknown = null
  try { json = await res.json() } catch { /* empty */ }
  return { status: res.status, json }
}

async function countCalls(): Promise<number> {
  const { count } = await admin.from('check_in_calls').select('id', { count: 'exact', head: true })
  return count ?? -1
}

// ── Test member fixture ──────────────────────────────────────────────────────
const TEST_PHONE = '+15555550142'
async function createTestMember(): Promise<string> {
  const { data, error } = await admin
    .from('members')
    .insert({
      full_name: 'G1 Webhook Test',
      preferred_name: 'Webhook',
      date_of_birth: '1940-01-01',
      phone_number: TEST_PHONE,
      call_frequency_preference: 'weekly',
    })
    .select('id')
    .maybeSingle()
  if (error || !data) throw new Error(`test member insert failed: ${error?.message}`)
  return data.id as string
}

async function deleteTestMember(id: string) {
  await admin.from('members').delete().eq('id', id)
}

// ── G1.3 ─────────────────────────────────────────────────────────────────────
async function g13(memberId: string) {
  console.log('\n── G1.3 webhook security ──\n')

  const before = await countCalls()
  const unsigned = await post('/api/webhooks/retell', {
    event: 'call_ended',
    call: { call_id: 'g13-unsigned', agent_id: 'x', metadata: { member_id: memberId }, transcript: 'hi' },
  }, { sign: false })
  const after = await countCalls()
  check('unsigned webhook POST → 401', unsigned.status === 401, String(unsigned.status))
  check('unsigned webhook POST → no check_in_calls rows written', before === after, `${before} → ${after}`)

  const forged = await post('/api/webhooks/retell', { event: 'call_started', call: { call_id: 'g13-forged' } }, {
    signature: `v=${Date.now()},d=${'0'.repeat(64)}`,
  })
  check('forged signature → 401', forged.status === 401, String(forged.status))

  const unsignedTool = await post('/api/retell/tools/welfare-check', {
    args: { member_id: memberId, concern_type: 'fall', description: 'test' },
  }, { sign: false })
  check('unsigned POST to /api/retell/tools/welfare-check → 401', unsignedTool.status === 401, String(unsignedTool.status))

  const signed = await post('/api/webhooks/retell', { event: 'ping', call: { call_id: 'g13-signed' } })
  check('valid signed payload → 200', signed.status === 200, String(signed.status))

  const tool = await post('/api/webhooks/retell', {
    event: 'tool_call',
    tool_name: 'update_call_preferences',
    args: { member_id: memberId, call_frequency: 'every day please' },
    call: { call_id: 'g13-tool' },
  })
  const { data: m } = await admin.from('members').select('call_frequency_preference').eq('id', memberId).maybeSingle()
  check('update_call_preferences via webhook → 200', tool.status === 200, JSON.stringify(tool.json))
  check('members.call_frequency_preference updated to daily', m?.call_frequency_preference === 'daily', String(m?.call_frequency_preference))

  const direct = await post('/api/retell/tools/update-call-preferences', {
    args: { member_id: memberId, call_frequency: 'once a week' },
  })
  const { data: m2 } = await admin.from('members').select('call_frequency_preference').eq('id', memberId).maybeSingle()
  check('signed direct tool route → 200 + weekly', direct.status === 200 && m2?.call_frequency_preference === 'weekly', `${direct.status} ${m2?.call_frequency_preference}`)
}

async function main() {
  const memberId = await createTestMember()
  try {
    if (only === 'g13' || only === 'all') await g13(memberId)
  } finally {
    await deleteTestMember(memberId)
  }
  console.log(allPass ? '\n✅ ALL PASS\n' : '\n❌ FAILURES ABOVE\n')
  process.exit(allPass ? 0 : 1)
}

main().catch(e => { console.error(e); process.exit(1) })
