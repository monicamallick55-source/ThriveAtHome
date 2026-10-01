// Crisis SMS routing + welfare-check alert metadata.
// Usage: npx tsx scripts/test-crisis-sms.ts [sms|welfare|all]
//   sms     — CARE_TEAM_PHONE + assigned navigator texting (no migration needed)
//   welfare — welfare-check alert saves with metadata (needs migration 087)
// Stub SMS provider, with sendUrgent spied so exact recipients can be checked.
// Deletes every row it creates.
import { createClient } from '@supabase/supabase-js'
import { smsProvider } from '../lib/providers'
import { handleCrisisDetection } from '../lib/alerts/detectCrisis'
import { processCallEnded } from '../lib/voice/processCallEnded'
import { run as welfareCheck } from '../lib/voice/tools/welfareCheck'

const only = process.argv[2] ?? 'all'
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

let allPass = true
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) allPass = false
}

// ── SMS spy ──────────────────────────────────────────────────────────────────
let sent: string[] = []
let failSends = false
smsProvider.sendUrgent = async (to: string) => {
  if (failSends) throw new Error('forced Twilio failure')
  sent.push(to)
}

// Capture console.error lines
async function withErrors<T>(fn: () => Promise<T>): Promise<{ value: T; errors: string[] }> {
  const errors: string[] = []
  const orig = console.error
  console.error = (...args: unknown[]) => { errors.push(args.map(String).join(' ')) }
  try { return { value: await fn(), errors } } finally { console.error = orig }
}

// ── Fixtures ─────────────────────────────────────────────────────────────────
const members: string[] = []
const navigators: string[] = []
const RUN = `crisis-sms-${Date.now()}`

async function member(label: string): Promise<string> {
  const { data, error } = await admin.from('members').insert({
    full_name: `[TEST] Crisis SMS ${label}`, preferred_name: label, date_of_birth: '1940-01-01',
    phone_number: `+1555557${String(1000 + members.length).slice(-4)}`,
  }).select('id').maybeSingle()
  if (error || !data) throw new Error(`member insert: ${error?.message}`)
  members.push(data.id)
  return data.id as string
}

async function assignNavigator(memberId: string, phone: string, isPrimary = true): Promise<void> {
  const { data: nav, error } = await admin.from('care_navigators').insert({
    full_name: '[TEST] Navigator', email: `nav-${Date.now()}-${navigators.length}@example.invalid`, phone, is_active: true,
  }).select('id').maybeSingle()
  if (error || !nav) throw new Error(`navigator insert: ${error?.message}`)
  navigators.push(nav.id)
  const { error: aErr } = await admin.from('navigator_assignments').insert({ member_id: memberId, navigator_id: nav.id, is_primary: isPrimary })
  if (aErr) throw new Error(`assignment insert: ${aErr.message}`)
}

async function count(table: string, memberId: string, extra: Record<string, string> = {}): Promise<number> {
  let q = admin.from(table).select('id', { count: 'exact', head: true }).eq('member_id', memberId)
  for (const [c, v] of Object.entries(extra)) q = q.eq(c, v)
  const { count: n } = await q
  return n ?? 0
}

const CRISIS = "I don't want to be here anymore"

async function smsTests() {
  console.log('\n── Crisis SMS routing ──\n')

  // 1. On-call number + assigned navigator (navigator phone stored in a non-E.164 format)
  process.env.CARE_TEAM_PHONE = '+15550001111'
  const m1 = await member('WithNavigator')
  await assignNavigator(m1, '(555) 000-2222')
  sent = []
  await handleCrisisDetection({ memberId: m1, transcript: CRISIS })
  check('CARE_TEAM_PHONE + assigned navigator both texted (navigator normalised to E.164)',
    sent.includes('+15550001111') && sent.includes('+15550002222') && sent.length === 2, JSON.stringify(sent))
  check('no text to the old literal "care-team"', !sent.includes('care-team'))

  // 2. No navigator → on-call only
  const m2 = await member('NoNavigator')
  sent = []
  await handleCrisisDetection({ memberId: m2, transcript: CRISIS })
  check('no assigned navigator → only CARE_TEAM_PHONE texted', sent.length === 1 && sent[0] === '+15550001111', JSON.stringify(sent))

  // 3. CARE_TEAM_PHONE missing → error logged, task + alert + Realtime still created
  delete process.env.CARE_TEAM_PHONE
  const m3 = await member('NoOnCall')
  sent = []
  const r3 = await withErrors(() => handleCrisisDetection({ memberId: m3, transcript: CRISIS }))
  check('CARE_TEAM_PHONE missing → error logged naming it', r3.errors.some(e => e.includes('CARE_TEAM_PHONE is not set')), r3.errors.find(e => e.includes('CARE_TEAM')) ?? '')
  check('CARE_TEAM_PHONE missing → no SMS sent', sent.length === 0, JSON.stringify(sent))
  const t3 = await count('navigator_tasks', m3, { task_type: 'crisis', priority: 'critical' })
  const a3 = await count('alerts', m3, { alert_type: 'crisis' })
  const n3 = await count('realtime_notifications', m3, { type: 'new_alert' })
  check('CARE_TEAM_PHONE missing → critical task + crisis alert + Realtime notification still created', t3 === 1 && a3 === 1 && n3 >= 1, `task=${t3} alert=${a3} notif=${n3}`)
  check('CARE_TEAM_PHONE missing → no "Crisis detection failed" fallback task', (await count('navigator_tasks', m3, { task_type: 'crisis_detection_failure' })) === 0)

  // 4. Placeholder / non-E.164 values are treated as missing
  process.env.CARE_TEAM_PHONE = '[SENSITIVE]'
  const m4 = await member('Placeholder')
  sent = []
  const r4 = await withErrors(() => handleCrisisDetection({ memberId: m4, transcript: CRISIS }))
  check('CARE_TEAM_PHONE="[SENSITIVE]" → treated as missing', sent.length === 0 && r4.errors.some(e => e.includes('CARE_TEAM_PHONE is not set')))
  process.env.CARE_TEAM_PHONE = '555-000-1111'
  const m5 = await member('NotE164')
  sent = []
  const r5 = await withErrors(() => handleCrisisDetection({ memberId: m5, transcript: CRISIS }))
  check('CARE_TEAM_PHONE not E.164 → not used, error logged', sent.length === 0 && r5.errors.some(e => e.includes('E.164')))

  // 5. Twilio failure → task still created, no fallback task
  process.env.CARE_TEAM_PHONE = '+15550001111'
  const m6 = await member('SendFails')
  failSends = true
  await withErrors(() => handleCrisisDetection({ memberId: m6, transcript: CRISIS }))
  failSends = false
  const t6 = await count('navigator_tasks', m6, { task_type: 'crisis' })
  const f6 = await count('navigator_tasks', m6, { task_type: 'crisis_detection_failure' })
  check('SMS send failure → crisis task kept, no "detection failed" task', t6 === 1 && f6 === 0, `crisis=${t6} failure=${f6}`)

  // 6. Hope call from an unknown number → on-call texted
  process.env.RETELL_HOPE_AGENT_ID = 'agent_test_hope'
  sent = []
  await processCallEnded({
    call_id: `${RUN}-hope-unknown`, agent_id: 'agent_test_hope', direction: 'inbound', from_number: '+15555550997',
    start_timestamp: Date.now() - 60_000, end_timestamp: Date.now(), duration_ms: 60_000,
    transcript: 'User: I just needed to talk.', transcript_object: [{ role: 'user', content: 'I just needed to talk.' }],
  })
  check('Hope call from unknown number → CARE_TEAM_PHONE texted', sent.length === 1 && sent[0] === '+15550001111', JSON.stringify(sent))
}

async function welfareTests() {
  console.log('\n── Welfare-check alert metadata (migration 087) ──\n')
  const m = await member('Welfare')
  const out = await welfareCheck({ concern_type: 'fall', description: '[TEST] said she slipped in the kitchen' }, { memberId: m })
  const { data: alert, error } = await admin.from('alerts').select('alert_type, severity, metadata')
    .eq('member_id', m).eq('alert_type', 'fall').maybeSingle()
  const meta = (alert?.metadata ?? {}) as Record<string, unknown>
  check('welfare-check tool returns 200', out.status === 200, JSON.stringify(out.body))
  check('welfare-check alert saved with metadata', !error && !!alert && meta.source === 'voice_call' && meta.concern_type === 'fall',
    error?.message ?? JSON.stringify(alert))
  const { data: def } = await admin.from('alerts').select('metadata').eq('member_id', members[0] ?? m).limit(1).maybeSingle()
  check('alerts without metadata default to {}', def === null || (typeof def.metadata === 'object' && def.metadata !== null))
}

async function main() {
  try {
    if (only === 'sms' || only === 'all') await smsTests()
    if (only === 'welfare' || only === 'all') await welfareTests()
  } finally {
    for (const id of members) {
      for (const t of ['navigator_tasks', 'alerts', 'emergency_log', 'realtime_notifications', 'navigator_assignments', 'check_in_calls']) {
        await admin.from(t).delete().eq('member_id', id)
      }
      await admin.from('members').delete().eq('id', id)
    }
    for (const id of navigators) await admin.from('care_navigators').delete().eq('id', id)
    await admin.from('inbound_call_log').delete().like('retell_call_id', `${RUN}%`)
  }
  console.log(allPass ? '\n✅ ALL PASS\n' : '\n❌ FAILURES ABOVE\n')
  process.exit(allPass ? 0 : 1)
}

main().catch(e => { console.error(e); process.exit(1) })
