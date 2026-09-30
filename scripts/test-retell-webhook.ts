// Retell webhook + tool route tests (G1.3 security, G1.4 call processing).
// Usage:
//   1. Start the app with a TEST key and fake agent ids:
//      RETELL_API_KEY=test_retell_key_g13 RETELL_AGENT_ID=agent_test_aria RETELL_ROSA_AGENT_ID=agent_test_rosa \
//      RETELL_HOPE_AGENT_ID=agent_test_hope npx next dev -p 3055
//   2. RETELL_TEST_KEY=test_retell_key_g13 BASE_URL=http://localhost:3055 npx tsx scripts/test-retell-webhook.ts [g13|g14|all]
// Never uses a real Retell key or places a call. Deletes every row it creates.
import Retell from 'retell-sdk'
import { createClient } from '@supabase/supabase-js'
import { processCallEnded, type RetellCall } from '../lib/voice/processCallEnded'
import { getCallsForMember } from '../lib/data/calls'

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
async function createTestMember(phone = TEST_PHONE): Promise<string> {
  const { data, error } = await admin
    .from('members')
    .insert({
      full_name: 'G1 Webhook Test',
      preferred_name: 'Webhook',
      date_of_birth: '1940-01-01',
      phone_number: phone,
      call_frequency_preference: 'weekly',
      family_can_see_call_summaries: true,
    })
    .select('id')
    .maybeSingle()
  if (error || !data) throw new Error(`test member insert failed: ${error?.message}`)
  return data.id as string
}

async function deleteTestMember(id: string) {
  for (const t of ['navigator_tasks', 'alerts', 'emergency_log', 'realtime_notifications', 'check_in_calls']) {
    await admin.from(t).delete().eq('member_id', id)
  }
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

// ── G1.4 ─────────────────────────────────────────────────────────────────────
const RUN = `g14-${Date.now()}`
const T0 = Date.now() - 5 * 60_000

function endedPayload(callId: string, opts: {
  agentId: string; direction: 'inbound' | 'outbound'; memberId?: string; from?: string
  userLines?: string[]; disconnection?: string; event?: string; callType?: string
}) {
  const userLines = opts.userLines ?? ['I am doing fine today, thank you.']
  const turns = [
    { role: 'agent', content: 'Hi, this is your check-in call. How are you? If it is ever an emergency, call 911.' },
    ...userLines.map(content => ({ role: 'user', content })),
  ]
  return {
    event: opts.event ?? 'call_ended',
    call: {
      call_id: callId,
      agent_id: opts.agentId,
      direction: opts.direction,
      from_number: opts.from ?? '+15555550100',
      to_number: '+15555550199',
      start_timestamp: T0,
      end_timestamp: T0 + 95_000,
      duration_ms: 95_000,
      disconnection_reason: opts.disconnection ?? 'user_hangup',
      transcript: turns.map(t => `${t.role === 'agent' ? 'Agent' : 'User'}: ${t.content}`).join('\n'),
      transcript_object: turns,
      metadata: opts.memberId ? { member_id: opts.memberId, call_type: opts.callType ?? 'check_in' } : {},
    },
  }
}

async function callRows(callId: string) {
  const { data } = await admin.from('check_in_calls').select('*').eq('retell_call_id', callId)
  return data ?? []
}

async function countFor(table: string, memberId: string, extra: Record<string, string> = {}) {
  let q = admin.from(table).select('id', { count: 'exact', head: true }).eq('member_id', memberId)
  for (const [col, val] of Object.entries(extra)) q = q.eq(col, val)
  const { count } = await q
  return count ?? 0
}

function skippedOf(json: unknown): unknown {
  return (json as { skipped?: unknown } | null)?.skipped
}

async function g14(memberIds: string[]) {
  console.log('\n── G1.4 call-ended processing ──\n')

  // Outbound Aria call saves
  const m1 = await createTestMember('+15555550143'); memberIds.push(m1)
  const ariaId = `${RUN}-aria`
  const r1 = await post('/api/webhooks/retell', endedPayload(ariaId, { agentId: 'agent_test_aria', direction: 'outbound', memberId: m1 }))
  let rows = await callRows(ariaId)
  check('outbound Aria call_ended → 1 row, agent_name=aria', r1.status === 200 && rows.length === 1 && rows[0].agent_name === 'aria' && rows[0].member_id === m1,
    `${r1.status} rows=${rows.length} agent=${rows[0]?.agent_name}`)
  check('started_at/ended_at from Retell timestamps', rows[0]?.started_at && new Date(rows[0].started_at).getTime() === T0, rows[0]?.started_at)
  check('processed_at set', !!rows[0]?.processed_at)
  check('ai_summary populated (stub text)', typeof rows[0]?.ai_summary === 'string' && rows[0].ai_summary.length > 0, rows[0]?.ai_summary)
  check('mood_score populated from extractCallScores', rows[0]?.mood_score === 7, String(rows[0]?.mood_score))
  const { data: m1row } = await admin.from('members').select('last_aria_call_at').eq('id', m1).maybeSingle()
  check('members.last_aria_call_at updated', !!m1row?.last_aria_call_at)
  const { count: famNotif } = await admin.from('realtime_notifications').select('id', { count: 'exact', head: true })
    .eq('member_id', m1).eq('type', 'call_summary_ready')
  check('family "New call summary" notification pushed', (famNotif ?? 0) === 1, String(famNotif))

  // Idempotent: same payload again, plus call_analyzed
  const r1b = await post('/api/webhooks/retell', endedPayload(ariaId, { agentId: 'agent_test_aria', direction: 'outbound', memberId: m1 }))
  const r1c = await post('/api/webhooks/retell', endedPayload(ariaId, { agentId: 'agent_test_aria', direction: 'outbound', memberId: m1, event: 'call_analyzed' }))
  rows = await callRows(ariaId)
  const { count: famNotif2 } = await admin.from('realtime_notifications').select('id', { count: 'exact', head: true })
    .eq('member_id', m1).eq('type', 'call_summary_ready')
  check('same payload twice + call_analyzed → still 1 row, no re-processing',
    rows.length === 1 && skippedOf(r1b.json) === true && skippedOf(r1c.json) === true && famNotif2 === 1,
    `rows=${rows.length} skipped=${skippedOf(r1b.json)}/${skippedOf(r1c.json)} notifs=${famNotif2}`)

  // Inbound Rosa from member's phone (stored in a different format)
  const m2 = await createTestMember('(555) 555-0144'); memberIds.push(m2)
  const rosaId = `${RUN}-rosa`
  await post('/api/webhooks/retell', endedPayload(rosaId, { agentId: 'agent_test_rosa', direction: 'inbound', from: '+15555550144' }))
  rows = await callRows(rosaId)
  check('inbound Rosa call matched to member by phone', rows.length === 1 && rows[0].member_id === m2 && rows[0].agent_name === 'rosa' && rows[0].call_type === 'care_line' && rows[0].caller_role === 'member',
    `member=${rows[0]?.member_id === m2} agent=${rows[0]?.agent_name} type=${rows[0]?.call_type}`)

  // Unknown number → inbound_call_log
  const unkId = `${RUN}-unknown`
  await post('/api/webhooks/retell', endedPayload(unkId, { agentId: 'agent_test_rosa', direction: 'inbound', from: '+15555550999' }))
  const { data: unk } = await admin.from('inbound_call_log').select('*').eq('retell_call_id', unkId).maybeSingle()
  check('unknown inbound number → inbound_call_log, caller_role=unknown', unk?.caller_role === 'unknown' && unk?.agent_name === 'rosa', `${unk?.caller_role}`)
  check('no check_in_calls row for unknown caller', (await callRows(unkId)).length === 0)

  // Crisis transcript
  const m3 = await createTestMember('+15555550145'); memberIds.push(m3)
  const crisisId = `${RUN}-crisis`
  await post('/api/webhooks/retell', endedPayload(crisisId, {
    agentId: 'agent_test_aria', direction: 'outbound', memberId: m3,
    userLines: ["Honestly I don't want to be here anymore."],
  }))
  rows = await callRows(crisisId)
  const el = await countFor('emergency_log', m3)
  const al = await countFor('alerts', m3, { alert_type: 'crisis' })
  const tk = await countFor('navigator_tasks', m3, { priority: 'critical', task_type: 'crisis' })
  check('crisis phrase → emergency_log + crisis alert + critical navigator task', el >= 1 && al >= 1 && tk >= 1, `emergency_log=${el} alerts=${al} tasks=${tk}`)
  check('crisis call row still saved', rows.length === 1 && rows[0].status === 'completed')

  // No false positive
  const m4 = await createTestMember('+15555550146'); memberIds.push(m4)
  const benignId = `${RUN}-benign`
  await post('/api/webhooks/retell', endedPayload(benignId, {
    agentId: 'agent_test_aria', direction: 'outbound', memberId: m4,
    userLines: ['I fell asleep watching TV last night, it was lovely.'],
  }))
  const el4 = await countFor('emergency_log', m4)
  const al4 = await countFor('alerts', m4, { alert_type: 'crisis' })
  const tk4 = await countFor('navigator_tasks', m4, { task_type: 'crisis' })
  check('"fell asleep watching TV" → no crisis rows', el4 === 0 && al4 === 0 && tk4 === 0, `${el4}/${al4}/${tk4}`)
  check('agent saying "call 911" does not trigger crisis (member speech only)', el4 === 0)

  // Hope always escalates
  const m5 = await createTestMember('+15555550147'); memberIds.push(m5)
  const hopeId = `${RUN}-hope`
  await post('/api/webhooks/retell', endedPayload(hopeId, {
    agentId: 'agent_test_hope', direction: 'inbound', from: '+15555550147', userLines: ['I just needed someone to talk to.'],
  }))
  const { data: hopeTask } = await admin.from('navigator_tasks').select('priority, description').eq('member_id', m5)
    .ilike('description', 'Hope crisis-line call%').maybeSingle()
  check('Hope call → critical navigator task with no crisis phrase', hopeTask?.priority === 'critical', hopeTask?.description)

  // Hope from unknown number → needs_followup
  const hopeUnkId = `${RUN}-hope-unknown`
  await post('/api/webhooks/retell', endedPayload(hopeUnkId, { agentId: 'agent_test_hope', direction: 'inbound', from: '+15555550998' }))
  const { data: hopeUnk } = await admin.from('inbound_call_log').select('needs_followup').eq('retell_call_id', hopeUnkId).maybeSingle()
  check('Hope from unknown number → inbound_call_log needs_followup=true', hopeUnk?.needs_followup === true)

  // Missed call
  const m6 = await createTestMember('+15555550148'); memberIds.push(m6)
  const missedId = `${RUN}-missed`
  await post('/api/webhooks/retell', endedPayload(missedId, {
    agentId: 'agent_test_aria', direction: 'outbound', memberId: m6, disconnection: 'dial_no_answer', userLines: [],
  }))
  rows = await callRows(missedId)
  const missedAlerts = await countFor('alerts', m6, { alert_type: 'missed_call' })
  check('dial_no_answer → status missed + missed_call alert', rows[0]?.status === 'missed' && missedAlerts >= 1, `${rows[0]?.status} alerts=${missedAlerts}`)

  // Crisis detection throwing (direct call — test hook)
  const m7 = await createTestMember('+15555550149'); memberIds.push(m7)
  const throwId = `${RUN}-throw`
  const res = await processCallEnded(endedPayload(throwId, { agentId: 'unknown_agent', direction: 'outbound', memberId: m7 }).call as RetellCall, {
    _crisisScanner: () => { throw new Error('forced failure') },
  })
  const { data: failTask } = await admin.from('navigator_tasks').select('description, priority').eq('member_id', m7)
    .eq('description', 'Crisis detection failed — manual review required').maybeSingle()
  rows = await callRows(throwId)
  check('crisis detection throwing → manual review task, call still saved', !!failTask && rows.length === 1 && !!rows[0].ai_summary,
    `task=${!!failTask} rows=${rows.length} summary=${!!rows[0]?.ai_summary} agent=${res.agent}`)

  // Family view never includes the transcript
  const fam = await getCallsForMember(m1, 20, 0)
  const first = (fam.data ?? [])[0] as Record<string, unknown> | undefined
  check('family call data has ai_summary but no transcript/recording/phone fields',
    !!first && typeof first.ai_summary === 'string' && !('transcript' in first) && !('recording_url' in first) && !('from_number' in first),
    first ? Object.keys(first).join(',') : 'no rows')

  await admin.from('inbound_call_log').delete().like('retell_call_id', `${RUN}%`)
}

async function main() {
  const memberId = await createTestMember()
  const extra: string[] = []
  try {
    if (only === 'g13' || only === 'all') await g13(memberId)
    if (only === 'g14' || only === 'all') await g14(extra)
  } finally {
    await deleteTestMember(memberId)
    for (const id of extra) await deleteTestMember(id)
  }
  console.log(allPass ? '\n✅ ALL PASS\n' : '\n❌ FAILURES ABOVE\n')
  process.exit(allPass ? 0 : 1)
}

main().catch(e => { console.error(e); process.exit(1) })
