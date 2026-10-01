// Quinn front door: Agent Transfer detection, transfer-aware call processing, and every Retell tool
// resolving the caller from the phone number and actually saving a row.
// Usage:
//   1. Start the app with every provider stubbed:  bash scripts/dev-stub-server.sh 3055
//   2. RETELL_TEST_KEY=test_retell_key_g13 BASE_URL=http://localhost:3055 npx tsx scripts/test-agent-transfer.ts [unit|transfer|tools|all]
//   unit     — transfer detection on replayed payloads, no DB or server
//   transfer — replayed Quinn→Rosa / Quinn→Hope / Quinn→Claire call_ended webhooks (needs migration 088)
//   tools    — every tool via Quinn's inbound number, members and non-members (needs migration 088)
//   retell   — Retell's standard argument names, no member_id (needs migration 088)
// Never uses a real Retell key or places a call. Deletes every row it creates.
import Retell from 'retell-sdk'
import { createClient } from '@supabase/supabase-js'
import { createTestSession } from './lib/testSession'

// Same fake agent ids as scripts/dev-stub-server.sh, so in-process detection matches the server
process.env.RETELL_AGENT_ID = 'agent_test_aria'
for (const a of ['rosa', 'joy', 'grace', 'hope', 'claire', 'sam', 'morgan', 'nova', 'alex', 'quinn', 'jordan']) {
  process.env[`RETELL_${a.toUpperCase()}_AGENT_ID`] = `agent_test_${a}`
}

import { detectAgentsInvolved, type RetellTranscriptEvent } from '../lib/voice/transfers'
import { callAgents, memberSpeech, type RetellCall } from '../lib/voice/processCallEnded'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3055'
const KEY = process.env.RETELL_TEST_KEY ?? 'test_retell_key_g13'
const only = process.argv[2] ?? 'all'
const RUN = `xfer-${Date.now()}`
const T0 = Date.now() - 5 * 60_000
const QUINN_NUMBER = '+15555550190'

let allPass = true
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) allPass = false
}

// ── Replayed payloads ────────────────────────────────────────────────────────
type Transfer = 'rosa' | 'hope' | 'claire'

/** Quinn answers, transfers, then the destination agent talks with the caller. */
function quinnEvents(to: Transfer, userLines: string[]): RetellTranscriptEvent[] {
  const ask = { rosa: 'I need help arranging a ride.', hope: "I'd like the support line.", claire: 'I am calling about my mother.' }[to]
  const events: RetellTranscriptEvent[] = [
    { role: 'agent', content: 'Thank you for calling ThriveAtHome, this is Quinn. How can I help?' },
    { role: 'user', content: ask },
  ]
  // Three shapes Retell can record a transfer in
  if (to === 'rosa') {
    events.push({ role: 'tool_call_invocation', tool_call_id: 't1', name: 'transfer_to_rosa', arguments: '{}' })
    events.push({ role: 'tool_call_result', tool_call_id: 't1', content: 'success', successful: true })
  } else if (to === 'hope') {
    events.push({ role: 'tool_call_invocation', tool_call_id: 't1', name: 'agent_swap', arguments: JSON.stringify({ agent_id: 'agent_test_hope' }) })
    events.push({ role: 'tool_call_result', tool_call_id: 't1', content: '{"status":"swapped"}', successful: true })
  } else {
    events.push({ role: 'node_transition', former_node_id: 'n1', former_node_name: 'Greeting', new_node_id: 'n2', new_node_name: 'Transfer to Claire' })
  }
  const label = { rosa: 'Rosa', hope: 'Hope', claire: 'Claire' }[to]
  events.push({ role: 'agent', content: `Hi, this is ${label}. If it is ever an emergency, call 911.` })
  for (const content of userLines) events.push({ role: 'user', content })
  return events
}

function quinnCall(callId: string, to: Transfer, from: string, userLines: string[] = ['Thanks, that is all.']): RetellCall {
  const events = quinnEvents(to, userLines)
  const turns = events.filter(e => e.role === 'agent' || e.role === 'user') as { role: string; content: string }[]
  return {
    call_id: callId,
    agent_id: 'agent_test_quinn',
    direction: 'inbound',
    from_number: from,
    to_number: QUINN_NUMBER,
    start_timestamp: T0,
    end_timestamp: T0 + 120_000,
    duration_ms: 120_000,
    disconnection_reason: 'user_hangup',
    transcript: turns.map(t => `${t.role === 'agent' ? 'Agent' : 'User'}: ${t.content}`).join('\n'),
    transcript_object: turns,
    transcript_with_tool_calls: events,
    metadata: {},
  }
}

// ── unit ─────────────────────────────────────────────────────────────────────
function unit() {
  console.log('\n── transfer detection (replayed payloads) ──\n')
  const eq = (a: string[], b: string[]) => JSON.stringify(a) === JSON.stringify(b)

  for (const to of ['rosa', 'hope', 'claire'] as Transfer[]) {
    const r = callAgents(quinnCall(`u-${to}`, to, '+15555550100'))
    check(`Quinn→${to} → agents [quinn, ${to}], final ${to}`, eq(r.involved, ['quinn', to]) && r.final === to && r.first === 'quinn', r.involved.join(','))
  }

  const none = callAgents({ ...quinnCall('u-none', 'rosa', '+1'), transcript_with_tool_calls: [{ role: 'agent', content: 'Hi' }] })
  check('no transfer → [quinn]', eq(none.involved, ['quinn']) && none.final === 'quinn', none.involved.join(','))

  const failed = detectAgentsInvolved('quinn', [
    { role: 'tool_call_invocation', tool_call_id: 'x', name: 'transfer_to_hope', arguments: '{}' },
    { role: 'tool_call_result', tool_call_id: 'x', content: 'agent unavailable', successful: false },
  ])
  check('failed transfer (successful:false) ignored', eq(failed, ['quinn']), failed.join(','))

  const chain = detectAgentsInvolved('quinn', [
    { role: 'tool_call_invocation', tool_call_id: 'a', name: 'transfer_to_rosa', arguments: '{}' },
    { role: 'tool_call_invocation', tool_call_id: 'b', name: 'request_callback', arguments: '{"notes":"rosa said hi"}' },
    { role: 'tool_call_invocation', tool_call_id: 'c', name: 'swapToHope', arguments: '{}' },
  ])
  check('Quinn→Rosa→Hope chain; ordinary tools not counted', eq(chain, ['quinn', 'rosa', 'hope']), chain.join(','))

  const viaResult = detectAgentsInvolved('quinn', [
    { role: 'tool_call_invocation', tool_call_id: 'r', name: 'handoff', arguments: '{}' },
    { role: 'tool_call_result', tool_call_id: 'r', content: '{"agent_id":"agent_test_sam"}', successful: true },
  ])
  check('destination agent_id only in the tool result → detected', eq(viaResult, ['quinn', 'sam']), viaResult.join(','))

  const swapEvent = detectAgentsInvolved('quinn', [{ role: 'agent_swap', new_agent_id: 'agent_test_jordan' }])
  check('dedicated agent_swap transcript event → detected', eq(swapEvent, ['quinn', 'jordan']), swapEvent.join(','))

  const speech = memberSpeech({ ...quinnCall('u-s', 'claire', '+1', ["I don't want to be here anymore."]), transcript_object: null })
  check('member speech covers both Quinn and post-transfer segments', speech.includes('calling about my mother') && speech.includes("don't want to be here"), speech.replace(/\n/g, ' | '))
}

// ── DB + server helpers ──────────────────────────────────────────────────────
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function post(path: string, payload: unknown) {
  const body = JSON.stringify(payload)
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-retell-signature': await Retell.sign(body, KEY) },
    body,
  })
  let json: Record<string, unknown> | null = null
  try { json = await res.json() } catch { /* empty */ }
  return { status: res.status, json }
}

const memberIds: string[] = []
const familyIds: string[] = []
const phones: string[] = []
const sessionCleanups: (() => Promise<void>)[] = []

async function createMember(phone: string): Promise<string> {
  const { data, error } = await admin.from('members').insert({
    full_name: '[TEST] G1 Transfer', preferred_name: 'Transfer', date_of_birth: '1940-01-01',
    phone_number: phone, call_frequency_preference: 'weekly', family_can_see_call_summaries: false,
  }).select('id').maybeSingle()
  if (error || !data) throw new Error(`member insert: ${error?.message}`)
  memberIds.push(data.id); phones.push(phone)
  return data.id as string
}

async function createFamily(memberId: string, phone: string): Promise<string> {
  const session = await createTestSession(`${RUN}-family`)
  sessionCleanups.push(session.cleanup)
  const { data, error } = await admin.from('family_members').insert({
    member_id: memberId, supabase_auth_id: session.userId, full_name: '[TEST] G1 Transfer Family', email: `${RUN}@example.invalid`, role: 'family', phone,
  }).select('id').maybeSingle()
  if (error || !data) throw new Error(`family insert: ${error?.message}`)
  familyIds.push(data.id); phones.push(phone)
  return data.id as string
}

async function cleanup() {
  for (const id of memberIds) {
    for (const t of ['navigator_tasks', 'alerts', 'emergency_log', 'realtime_notifications', 'callback_requests', 'service_bookings', 'check_in_calls']) {
      await admin.from(t).delete().eq('member_id', id)
    }
  }
  await admin.from('navigator_tasks').delete().like('description', `%[call ${RUN}%`)
  await admin.from('inbound_call_log').delete().like('retell_call_id', `${RUN}%`)
  for (const id of familyIds) await admin.from('family_members').delete().eq('id', id)
  for (const c of sessionCleanups.splice(0)) await c()
  for (const id of memberIds) await admin.from('members').delete().eq('id', id)
}

// ── transfer ─────────────────────────────────────────────────────────────────
async function transfer() {
  console.log('\n── Quinn transfers: call_ended processing ──\n')

  // Quinn → Rosa, member calling from their own phone
  const mRosa = await createMember('+15555550161')
  const rosaId = `${RUN}-rosa`
  const r1 = await post('/api/webhooks/retell', { event: 'call_ended', call: quinnCall(rosaId, 'rosa', '+15555550161') })
  const { data: rosaRow } = await admin.from('check_in_calls').select('*').eq('retell_call_id', rosaId).maybeSingle()
  check('Quinn→Rosa: agent_name=rosa, agents_involved={quinn,rosa}, call_type care_line',
    r1.status === 200 && rosaRow?.agent_name === 'rosa' && JSON.stringify(rosaRow?.agents_involved) === '["quinn","rosa"]' &&
      rosaRow?.call_type === 'care_line' && rosaRow?.member_id === mRosa && rosaRow?.direction === 'inbound',
    `${r1.status} ${rosaRow?.agent_name} ${JSON.stringify(rosaRow?.agents_involved)} ${rosaRow?.call_type}`)
  const { count: rosaHope } = await admin.from('navigator_tasks').select('id', { count: 'exact', head: true })
    .eq('member_id', mRosa).ilike('description', 'Hope crisis-line call%')
  check('Quinn→Rosa: no Hope task', (rosaHope ?? 0) === 0, String(rosaHope))

  // Quinn → Hope, calm member — Hope's always-escalate rule even though Quinn's webhook fired
  const mHope = await createMember('+15555550162')
  const hopeId = `${RUN}-hope`
  await post('/api/webhooks/retell', { event: 'call_ended', call: quinnCall(hopeId, 'hope', '+15555550162', ['I just needed someone to talk to.']) })
  const { data: hopeRow } = await admin.from('check_in_calls').select('agent_name, agents_involved').eq('retell_call_id', hopeId).maybeSingle()
  const { data: hopeTask } = await admin.from('navigator_tasks').select('priority, task_type')
    .eq('member_id', mHope).ilike('description', 'Hope crisis-line call%').maybeSingle()
  check('Quinn→Hope: agents {quinn,hope}, agent_name hope', hopeRow?.agent_name === 'hope' && JSON.stringify(hopeRow?.agents_involved) === '["quinn","hope"]',
    `${hopeRow?.agent_name} ${JSON.stringify(hopeRow?.agents_involved)}`)
  check('Quinn→Hope: critical crisis navigator task with no crisis phrase', hopeTask?.priority === 'critical' && hopeTask?.task_type === 'crisis', JSON.stringify(hopeTask))

  // Quinn → Hope from an unknown number
  const hopeUnkId = `${RUN}-hope-unknown`
  await post('/api/webhooks/retell', { event: 'call_ended', call: quinnCall(hopeUnkId, 'hope', '+15555550969') })
  const { data: hopeUnk } = await admin.from('inbound_call_log').select('agent_name, agents_involved, needs_followup').eq('retell_call_id', hopeUnkId).maybeSingle()
  check('Quinn→Hope unknown caller: inbound_call_log needs_followup, agents {quinn,hope}',
    hopeUnk?.needs_followup === true && hopeUnk?.agent_name === 'hope' && JSON.stringify(hopeUnk?.agents_involved) === '["quinn","hope"]', JSON.stringify(hopeUnk))

  // Quinn → Claire with a crisis phrase from a member: Claire never scanned before; now every call is scanned
  const mClaire = await createMember('+15555550163')
  const claireId = `${RUN}-claire`
  await post('/api/webhooks/retell', { event: 'call_ended', call: quinnCall(claireId, 'claire', '+15555550163', ["Honestly I don't want to be here anymore."]) })
  const { data: claireRow } = await admin.from('check_in_calls').select('agent_name, agents_involved').eq('retell_call_id', claireId).maybeSingle()
  const { count: el } = await admin.from('emergency_log').select('id', { count: 'exact', head: true }).eq('member_id', mClaire)
  const { count: tk } = await admin.from('navigator_tasks').select('id', { count: 'exact', head: true }).eq('member_id', mClaire).eq('task_type', 'crisis')
  check('Quinn→Claire: agents {quinn,claire}', claireRow?.agent_name === 'claire' && JSON.stringify(claireRow?.agents_involved) === '["quinn","claire"]',
    `${claireRow?.agent_name} ${JSON.stringify(claireRow?.agents_involved)}`)
  check('Quinn→Claire: crisis phrase after transfer → emergency_log + crisis task', (el ?? 0) >= 1 && (tk ?? 0) >= 1, `emergency_log=${el} tasks=${tk}`)

  // Quinn → Claire, unknown caller with crisis phrase → care-team page via needs_followup
  const claireUnkId = `${RUN}-claire-unknown`
  await post('/api/webhooks/retell', { event: 'call_ended', call: quinnCall(claireUnkId, 'claire', '+15555550968', ['I want to end my life.']) })
  const { data: claireUnk } = await admin.from('inbound_call_log').select('needs_followup').eq('retell_call_id', claireUnkId).maybeSingle()
  check('Quinn→Claire unknown caller with crisis phrase → needs_followup', claireUnk?.needs_followup === true, JSON.stringify(claireUnk))
}

// ── tools ────────────────────────────────────────────────────────────────────
/** A tool call made during an inbound Quinn call: no metadata, caller known only by from_number. */
function toolPayload(tool: string, args: Record<string, unknown>, callId: string, from: string) {
  return {
    event: 'tool_call', tool_name: tool, args,
    call: { call_id: callId, agent_id: 'agent_test_quinn', direction: 'inbound', from_number: from, to_number: QUINN_NUMBER, metadata: {} },
  }
}
/** Same call via the Retell custom-function HTTP route (body: { call, name, args }). */
function routePayload(tool: string, args: Record<string, unknown>, callId: string, from: string) {
  const { call } = toolPayload(tool, args, callId, from)
  return { name: tool, args, call }
}

async function tools() {
  console.log('\n── tools via Quinn\'s inbound number ──\n')
  const phone = '+15555550171'
  const m = await createMember('(555) 555-0171') // stored in a different format from Retell's E.164
  const callId = `${RUN}-tools`
  await post('/api/webhooks/retell', { event: 'call_started', call: { ...toolPayload('x', {}, callId, phone).call, start_timestamp: T0 } })

  // update_call_preferences
  const prefs = await post('/api/webhooks/retell', toolPayload('update_call_preferences', { call_frequency: 'every day please' }, callId, phone))
  const { data: mrow } = await admin.from('members').select('call_frequency_preference').eq('id', m).maybeSingle()
  check('update_call_preferences (member by phone) → members.call_frequency_preference=daily', prefs.status === 200 && mrow?.call_frequency_preference === 'daily',
    `${prefs.status} ${mrow?.call_frequency_preference}`)

  // log_mood_score → check_in_calls.mood_score, kept after call_ended
  const mood = await post('/api/retell/tools/log-mood-score', routePayload('log_mood_score', { score: 3 }, callId, phone))
  const { data: moodRow } = await admin.from('check_in_calls').select('mood_score').eq('retell_call_id', callId).maybeSingle()
  check('log_mood_score → check_in_calls.mood_score=3', mood.status === 200 && moodRow?.mood_score === 3, `${mood.status} ${moodRow?.mood_score}`)

  const moodNoStart = `${RUN}-mood-nostart`
  await post('/api/retell/tools/log-mood-score', routePayload('log_mood_score', { score: '8' }, moodNoStart, phone))
  const { data: moodRow2 } = await admin.from('check_in_calls').select('mood_score, member_id').eq('retell_call_id', moodNoStart).maybeSingle()
  check('log_mood_score with no call_started row → row created with mood_score', moodRow2?.mood_score === 8 && moodRow2?.member_id === m, JSON.stringify(moodRow2))

  // request_callback → callback_requests
  const cb = await post('/api/retell/tools/request-callback', routePayload('request_callback', { preferred_time: 'tomorrow morning' }, callId, phone))
  const { data: cbRow } = await admin.from('callback_requests').select('requested_via, notes').eq('member_id', m).maybeSingle()
  check('request_callback (member by phone) → 200 + callback_requests row', cb.status === 200 && cbRow?.requested_via === 'inbound_call', `${cb.status} ${JSON.stringify(cbRow)}`)

  // create_navigator_alert → navigator_tasks
  const na = await post('/api/retell/tools/navigator-alert', routePayload('create_navigator_alert', { alert_type: 'housing', message: '[TEST] landlord issue', priority: 'high' }, callId, phone))
  const { data: naRow } = await admin.from('navigator_tasks').select('task_type, priority, caller_role').eq('member_id', m).eq('task_type', 'navigator_alert').maybeSingle()
  check('create_navigator_alert (member) → navigator_tasks row, priority high', na.status === 200 && naRow?.priority === 'high' && naRow?.caller_role === 'member', `${na.status} ${JSON.stringify(naRow)}`)

  // flag_welfare_concern → alerts (+ emergency_log for emergency)
  const wc = await post('/api/retell/tools/welfare-check', routePayload('flag_welfare_concern', { concern_type: 'fall', description: '[TEST] slipped in the kitchen', severity: 'emergency' }, callId, phone))
  const { data: wcAlert } = await admin.from('alerts').select('alert_type, severity, metadata').eq('member_id', m).eq('alert_type', 'fall').maybeSingle()
  const { data: wcEm } = await admin.from('emergency_log').select('alert_type, triggered_phrase, call_id').eq('member_id', m).maybeSingle()
  check('flag_welfare_concern → alerts row (fall, emergency, metadata.source voice_call)',
    wc.status === 200 && wcAlert?.severity === 'emergency' && (wcAlert?.metadata as { source?: string })?.source === 'voice_call', `${wc.status} ${JSON.stringify(wcAlert)}`)
  check('flag_welfare_concern emergency → emergency_log row linked to the call', !!wcEm && wcEm.alert_type === 'fall' && !!wcEm.call_id, JSON.stringify(wcEm))

  // create_service_request → service_bookings + navigator task
  const sr = await post('/api/retell/tools/service-request', routePayload('create_service_request', { service_type: 'transportation', description: '[TEST] ride to the clinic', preferred_date: 'next Tuesday', urgency: 'urgent' }, callId, phone))
  const { data: srRow } = await admin.from('service_bookings').select('service_type, requested_for, booking_details').eq('member_id', m).maybeSingle()
  const { data: srTask } = await admin.from('navigator_tasks').select('priority').eq('member_id', m).eq('task_type', 'service_request').maybeSingle()
  check('create_service_request ("next Tuesday") → service_bookings row + high-priority navigator task',
    sr.status === 200 && srRow?.service_type === 'transportation' && srRow?.requested_for === null && srTask?.priority === 'high', `${sr.status} ${JSON.stringify(srRow)} ${JSON.stringify(srTask)}`)

  // call_ended keeps the member's own mood score over the stub's AI score (7)
  const ended = quinnCall(callId, 'rosa', phone)
  await post('/api/webhooks/retell', { event: 'call_ended', call: ended })
  const { data: endRow } = await admin.from('check_in_calls').select('mood_score, processed_at, agent_name').eq('retell_call_id', callId).maybeSingle()
  check('after call_ended the tool-logged mood_score (3) is kept', endRow?.mood_score === 3 && !!endRow?.processed_at, JSON.stringify(endRow))

  console.log('\n── tools: non-member callers ──\n')
  const unk = '+15555550977'
  const ucall = `${RUN}-unknown`
  const ucb = await post('/api/retell/tools/request-callback', routePayload('request_callback', { notes: '[TEST] asking about volunteering' }, ucall, unk))
  const { data: ucbTask } = await admin.from('navigator_tasks').select('member_id, caller_phone, caller_role, description').eq('caller_phone', unk).eq('task_type', 'callback_request').maybeSingle()
  check('request_callback unknown caller → 200 (not 400) + navigator task with number/role/message',
    ucb.status === 200 && ucbTask?.caller_role === 'unknown' && ucbTask?.member_id === null && !!ucbTask?.description?.includes('asking about volunteering'),
    `${ucb.status} ${JSON.stringify(ucbTask)}`)

  const una = await post('/api/retell/tools/navigator-alert', routePayload('create_navigator_alert', { alert_type: 'general', message: '[TEST] question about services' }, ucall, unk))
  const { data: unaTask } = await admin.from('navigator_tasks').select('caller_phone, caller_role').eq('caller_phone', unk).eq('task_type', 'navigator_alert').maybeSingle()
  check('create_navigator_alert unknown caller → navigator task', una.status === 200 && unaTask?.caller_role === 'unknown', `${una.status} ${JSON.stringify(unaTask)}`)

  const umood = await post('/api/retell/tools/log-mood-score', routePayload('log_mood_score', { score: 5 }, ucall, unk))
  const uprefs = await post('/api/retell/tools/update-call-preferences', routePayload('update_call_preferences', { call_frequency: 'daily' }, ucall, unk))
  check('log_mood_score unknown caller → 200 with spoken result', umood.status === 200 && typeof umood.json?.result === 'string', `${umood.status} ${umood.json?.result}`)
  check('update_call_preferences unknown caller → 200 with spoken result (was 400)', uprefs.status === 200 && typeof uprefs.json?.result === 'string', `${uprefs.status} ${uprefs.json?.result}`)

  // Family caller: task attached to their member, caller_role family
  const famPhone = '+15555550178'
  await createFamily(m, famPhone)
  const fcb = await post('/api/webhooks/retell', toolPayload('request_callback', { notes: '[TEST] daughter wants an update' }, `${RUN}-family`, famPhone))
  const { data: fTask } = await admin.from('navigator_tasks').select('member_id, caller_role, caller_phone').eq('caller_phone', famPhone).eq('task_type', 'callback_request').maybeSingle()
  check('request_callback family caller → navigator task on their member, caller_role family',
    fcb.status === 200 && fTask?.member_id === m && fTask?.caller_role === 'family', JSON.stringify(fTask))

  await admin.from('navigator_tasks').delete().in('caller_phone', [unk, famPhone])
}

// ── retell: Retell's standard argument names, never a member_id ─────────────
async function retellNames() {
  console.log('\n── Retell argument names (no member_id) ──\n')
  const phone = '+15555550181'
  const m = await createMember(phone)
  const callId = `${RUN}-retell`
  const unk = '+15555550987'

  const na = await post('/api/retell/tools/navigator-alert', routePayload('create_navigator_alert', { alert_type: 'housing', description: '[TEST] heating broken', priority: 'medium' }, callId, phone))
  const { data: naRow } = await admin.from('navigator_tasks').select('description').eq('member_id', m).eq('task_type', 'navigator_alert').maybeSingle()
  check('create_navigator_alert with `description` → navigator task saved', na.status === 200 && !!naRow?.description?.includes('heating broken'), `${na.status} ${naRow?.description}`)

  const cb = await post('/api/retell/tools/request-callback', routePayload('request_callback', { requested_time: 'after lunch', reason: '[TEST] pharmacy question' }, callId, phone))
  const { data: cbRow } = await admin.from('callback_requests').select('notes').eq('member_id', m).maybeSingle()
  check('request_callback with `requested_time` + `reason` → callback_requests notes keep both', cb.status === 200 && !!cbRow?.notes?.includes('after lunch') && !!cbRow?.notes?.includes('pharmacy question'), `${cb.status} ${cbRow?.notes}`)

  const ucb = await post('/api/retell/tools/request-callback', routePayload('request_callback', { requested_time: 'tomorrow', reason: '[TEST] neighbour asking for help' }, `${RUN}-retell-unk`, unk))
  const { data: ucbTask } = await admin.from('navigator_tasks').select('description, caller_role').eq('caller_phone', unk).eq('task_type', 'callback_request').maybeSingle()
  check('request_callback Retell names, unknown caller → task with reason + time', ucb.status === 200 && ucbTask?.caller_role === 'unknown' &&
    !!ucbTask?.description?.includes('neighbour asking for help') && !!ucbTask?.description?.includes('tomorrow'), `${ucb.status} ${ucbTask?.description}`)
  await admin.from('navigator_tasks').delete().eq('caller_phone', unk)

  const pr = await post('/api/retell/tools/update-call-preferences', routePayload('update_call_preferences', { call_frequency: 'few_times_week' }, callId, phone))
  const { data: pRow } = await admin.from('members').select('call_frequency_preference').eq('id', m).maybeSingle()
  check('update_call_preferences exact `few_times_week` → saved', pr.status === 200 && pRow?.call_frequency_preference === 'few_times_week', `${pr.status} ${pRow?.call_frequency_preference}`)
  await post('/api/retell/tools/update-call-preferences', routePayload('update_call_preferences', { call_frequency: 'daily' }, callId, phone))
  const { data: pRow2 } = await admin.from('members').select('call_frequency_preference').eq('id', m).maybeSingle()
  check('update_call_preferences exact `daily` → saved', pRow2?.call_frequency_preference === 'daily', String(pRow2?.call_frequency_preference))

  const conf = await post('/api/retell/tools/welfare-check', routePayload('flag_welfare_concern', { concern_type: 'confusion', description: '[TEST] unsure what day it is' }, callId, phone))
  const { data: confTask } = await admin.from('navigator_tasks').select('priority').eq('member_id', m).eq('task_type', 'behavioral_concern').maybeSingle()
  const { count: confCrisis } = await admin.from('alerts').select('id', { count: 'exact', head: true }).eq('member_id', m).eq('alert_type', 'crisis')
  check('flag_welfare_concern confusion → behavioral_concern task, no crisis alert', conf.status === 200 && !!confTask && (confCrisis ?? 0) === 0, `${conf.status} ${JSON.stringify(confTask)} crisis=${confCrisis}`)

  const dis = await post('/api/retell/tools/welfare-check', routePayload('flag_welfare_concern', { concern_type: 'distress', description: '[TEST] very upset about the move' }, callId, phone))
  const { data: disTask } = await admin.from('navigator_tasks').select('priority').eq('member_id', m).eq('task_type', 'navigator_alert').ilike('description', '%distress%').maybeSingle()
  const { count: disCrisis } = await admin.from('alerts').select('id', { count: 'exact', head: true }).eq('member_id', m).eq('alert_type', 'crisis')
  check('flag_welfare_concern distress → high-priority navigator alert, no crisis alert', dis.status === 200 && disTask?.priority === 'high' && (disCrisis ?? 0) === 0, `${dis.status} ${JSON.stringify(disTask)} crisis=${disCrisis}`)

  for (const [concern, expected] of [['fall', 'fall'], ['medication', 'medication_miss'], ['emergency', 'emergency']] as const) {
    const r = await post('/api/retell/tools/welfare-check', routePayload('flag_welfare_concern', { concern_type: concern, description: `[TEST] ${concern}` }, callId, phone))
    const { count } = await admin.from('alerts').select('id', { count: 'exact', head: true }).eq('member_id', m).eq('alert_type', expected)
    check(`flag_welfare_concern ${concern} → ${expected} alert (unchanged)`, r.status === 200 && (count ?? 0) === 1, `${r.status} count=${count}`)
  }
}

async function main() {
  try {
    if (only === 'unit' || only === 'all') unit()
    if (only === 'transfer' || only === 'all') await transfer()
    if (only === 'tools' || only === 'all') await tools()
    if (only === 'retell' || only === 'all') await retellNames()
  } finally {
    if (only !== 'unit') await cleanup()
  }
  console.log(allPass ? '\n✅ ALL PASS\n' : '\n❌ FAILURES ABOVE\n')
  process.exit(allPass ? 0 : 1)
}

main().catch(async e => { console.error(e); await cleanup(); process.exit(1) })
