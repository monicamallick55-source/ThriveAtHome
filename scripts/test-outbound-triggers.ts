// G1.6 verification — Joy (celebrations) and Grace (reminders) outbound calls.
// Usage: npx tsx scripts/test-outbound-triggers.ts   (needs migration 086 applied)
// Triggers are scoped to the test members only. Stub call provider — no real calls.
// Deletes every row it creates.
import { createClient } from '@supabase/supabase-js'
import { runJoyCalls, runGraceCalls } from '../lib/voice/outboundTriggers'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const DAY = 24 * 60 * 60 * 1000

let allPass = true
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) allPass = false
}

const created: string[] = []
async function member(label: string, optedIn: boolean): Promise<string> {
  const { data, error } = await admin.from('members').insert({
    full_name: `G1.6 Test ${label}`,
    preferred_name: label,
    date_of_birth: '1940-01-01',
    phone_number: `+1555556${String(1000 + created.length).slice(-4)}`,
    aria_call_opted_in: optedIn,
  }).select('id').maybeSingle()
  if (error || !data) throw new Error(`insert ${label}: ${error?.message}`)
  created.push(data.id)
  return data.id as string
}

async function capture(fn: () => Promise<unknown>): Promise<string[]> {
  const lines: string[] = []
  const orig = console.log
  console.log = (...args: unknown[]) => {
    const line = args.map(String).join(' ')
    if (line.startsWith('[STUB][Call]') || line.startsWith('[voice/joy] Skipping')) lines.push(line)
  }
  try { await fn() } finally { console.log = orig }
  return lines
}

async function callRows(memberId: string, callType: string) {
  const { data } = await admin.from('check_in_calls').select('agent_name, status, direction').eq('member_id', memberId).eq('call_type', callType)
  return data ?? []
}

async function main() {
  console.log('\n── G1.6 Joy + Grace outbound ──\n')
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const tomorrow = new Date(now.getTime() + DAY).toISOString().slice(0, 10)

  const joyYes = await member('JoyYes', true)
  const joyGrief = await member('JoyGrief', true)
  const joyNo = await member('JoyNo', false)
  const graceYes = await member('GraceYes', true)
  const graceNo = await member('GraceNo', false)
  const graceNoFlag = await member('GraceNoFlag', true)

  try {
    for (const id of [joyYes, joyGrief, joyNo]) {
      const { error } = await admin.from('celebration_events').insert({ member_id: id, celebration_type: 'birthday', event_date: today, status: 'today' })
      if (error) throw new Error(`celebration insert: ${error.message}`)
    }
    const { error: gErr } = await admin.from('grief_support_requests').insert({
      member_id: joyGrief, loss_type: 'spouse', created_at: new Date(now.getTime() - 10 * DAY).toISOString(),
    })
    if (gErr) throw new Error(`grief insert: ${gErr.message}`)
    for (const [id, flag] of [[graceYes, true], [graceNo, true], [graceNoFlag, false]] as const) {
      const { error } = await admin.from('tracked_items').insert({
        member_id: id, item_type: 'doctor_appointment', category: 'appointment', item_name: 'Dr Patel check-up',
        expiration_or_appointment_date: tomorrow, status: 'active', call_reminder: flag,
      })
      if (error) throw new Error(`tracked_items insert: ${error.message}`)
    }

    // Joy
    const joy1 = await capture(() => runJoyCalls({ memberIds: created }))
    const joy2 = await capture(() => runJoyCalls({ memberIds: created }))
    const joyLine = joy1.find(l => l.includes(joyYes)) ?? ''
    check('birthday member (opted in) → Joy call', joyLine.includes('joy →') && joyLine.includes('RETELL_JOY_AGENT_ID') && joyLine.includes('celebration_type,personal_line'), joyLine)
    const joyRows = await callRows(joyYes, 'celebration')
    check('Joy call recorded as scheduled celebration row (agent joy, outbound)',
      joyRows.length === 1 && joyRows[0].agent_name === 'joy' && joyRows[0].direction === 'outbound', JSON.stringify(joyRows))
    check('running Joy twice → still one call', !joy2.some(l => l.includes(joyYes) && l.startsWith('[STUB][Call]')) && joyRows.length === 1)
    check('birthday member with recent grief request → no Joy call, skip logged',
      !joy1.some(l => l.startsWith('[STUB][Call]') && l.includes(joyGrief)) && joy1.some(l => l.startsWith('[voice/joy] Skipping') && l.includes(joyGrief)))
    check('non-opted-in birthday member → no Joy call', !joy1.some(l => l.includes(joyNo)) && (await callRows(joyNo, 'celebration')).length === 0)

    // Grace
    const grace1 = await capture(() => runGraceCalls({ memberIds: created }))
    const graceLine = grace1.find(l => l.includes(graceYes)) ?? ''
    check('appointment tomorrow with call_reminder=true → Grace call',
      graceLine.includes('grace →') && graceLine.includes('RETELL_GRACE_AGENT_ID') && graceLine.includes('item_name,due_date'), graceLine)
    check('Grace call recorded as scheduled reminder row', (await callRows(graceYes, 'reminder')).length === 1)
    check('non-opted-in member → no Grace call', !grace1.some(l => l.includes(graceNo)))
    check('call_reminder=false → no Grace call', !grace1.some(l => l.includes(graceNoFlag)))
  } finally {
    for (const id of created) {
      for (const t of ['check_in_calls', 'celebration_events', 'grief_support_requests', 'tracked_items', 'realtime_notifications']) {
        await admin.from(t).delete().eq('member_id', id)
      }
      await admin.from('members').delete().eq('id', id)
    }
  }

  console.log(allPass ? '\n✅ ALL PASS\n' : '\n❌ FAILURES ABOVE\n')
  process.exit(allPass ? 0 : 1)
}

main().catch(e => { console.error(e); process.exit(1) })
