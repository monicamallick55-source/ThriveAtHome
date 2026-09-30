// G1.5 verification — Aria opt-in gating + Launch Protocol navigator tasks.
// Usage:
//   1. Dev server running (for the portal-toggle check): npx next dev -p 3055
//   2. BASE_URL=http://localhost:3055 npx tsx scripts/test-aria-schedule.ts
// runAriaSchedule is scoped to the test members only, so no real member is touched.
// Stub call provider only — no real calls. Deletes every row it creates.
import { createClient } from '@supabase/supabase-js'
import { runAriaSchedule } from '../lib/voice/ariaSchedule'
import { createTestSession } from './lib/testSession'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3055'
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
async function member(label: string, fields: Record<string, unknown>): Promise<string> {
  const { data, error } = await admin.from('members').insert({
    full_name: `G1.5 Test ${label}`,
    preferred_name: label,
    date_of_birth: '1940-01-01',
    phone_number: `+1555555${String(1000 + created.length).slice(-4)}`,
    plan_tier: 'basics',
    ...fields,
  }).select('id').maybeSingle()
  if (error || !data) throw new Error(`insert ${label}: ${error?.message}`)
  created.push(data.id)
  return data.id as string
}

async function tasks(memberId: string, taskType: string) {
  const { data } = await admin.from('navigator_tasks').select('*').eq('member_id', memberId).eq('task_type', taskType)
  return data ?? []
}

/** Runs the scheduler scoped to our members, capturing [STUB][Call] log lines. */
async function run(): Promise<string[]> {
  const lines: string[] = []
  const orig = console.log
  console.log = (...args: unknown[]) => {
    const line = args.map(String).join(' ')
    if (line.startsWith('[STUB][Call]')) lines.push(line)
  }
  try {
    await runAriaSchedule({ memberIds: created })
  } finally {
    console.log = orig
  }
  return lines
}

async function main() {
  console.log('\n── G1.5 Aria opt-in + Launch Protocol ──\n')
  const now = Date.now()

  const newNoAria = await member('NewNoAria', { aria_call_opted_in: false, created_at: new Date(now - 2 * 3600_000).toISOString() })
  const newAria = await member('NewAria', { aria_call_opted_in: true, created_at: new Date(now - 2 * 3600_000).toISOString() })
  const day21 = await member('Day21', { aria_call_opted_in: false, created_at: new Date(now - 22 * DAY).toISOString() })
  const risky = await member('Risky', {
    aria_call_opted_in: false, risk_override_calls: true, checkin_preference: 'aria',
    onboarding_call_completed: true, created_at: new Date(now - 60 * DAY).toISOString(),
  })

  try {
    const calls1 = await run()
    const calls2 = await run()
    const allCalls = [...calls1, ...calls2]
    const called = (id: string) => allCalls.some(l => l.includes(id))

    // New member, not opted in
    const welcome = await tasks(newNoAria, 'welcome_call')
    check('non-opted-in new member → no Aria call', !called(newNoAria))
    check('non-opted-in new member → welcome_call task (high, due created+24h)',
      welcome.length >= 1 && welcome[0].priority === 'high' &&
      Math.abs(new Date(welcome[0].due_by).getTime() - (now - 2 * 3600_000 + DAY)) < 60_000 &&
      welcome[0].description.includes('do not mention Aria'),
      `${welcome.length} ${welcome[0]?.priority} ${welcome[0]?.due_by}`)
    check('cron twice → still one welcome_call task', welcome.length === 1, String(welcome.length))

    // Opted in → onboarding call
    const onboardingLine = calls1.find(l => l.includes(newAria)) ?? ''
    check('opted-in member → Aria onboarding call placed', onboardingLine.includes('aria →') && onboardingLine.includes('onboarding'), onboardingLine)
    check('opted-in member → no welcome_call task', (await tasks(newAria, 'welcome_call')).length === 0)

    // Day 21
    const intro = await tasks(day21, 'aria_intro')
    check('day-21 member → aria_intro task created once', intro.length === 1 && intro[0].description.includes('Default is NO'), String(intro.length))
    check('day-21 member → no Aria call', !called(day21))

    // Risk override does not bypass opt-in
    const risk = await tasks(risky, 'elevated_risk_call')
    check('risk_override on non-opted-in member → navigator task, no call', risk.length === 1 && !called(risky), `${risk.length} called=${called(risky)}`)

    // Portal toggle → aria_call_opted_in=false
    const session = await createTestSession('g15-member')
    try {
      await admin.from('members').update({ supabase_auth_id: session.userId, aria_call_opted_in: true }).eq('id', newAria)
      const res = await fetch(`${BASE_URL}/api/member/preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: session.cookieHeader },
        body: JSON.stringify({ aria_call_opted_in: false }),
      })
      const { data: after } = await admin.from('members').select('aria_call_opted_in').eq('id', newAria).maybeSingle()
      check('portal toggle off (PATCH /api/member/preferences) → aria_call_opted_in=false', res.status === 200 && after?.aria_call_opted_in === false,
        `${res.status} ${after?.aria_call_opted_in}`)
    } finally {
      await session.cleanup()
    }
  } finally {
    for (const id of created) {
      for (const t of ['navigator_tasks', 'alerts', 'check_in_calls', 'realtime_notifications']) {
        await admin.from(t).delete().eq('member_id', id)
      }
      await admin.from('members').delete().eq('id', id)
    }
  }

  console.log(allPass ? '\n✅ ALL PASS\n' : '\n❌ FAILURES ABOVE\n')
  process.exit(allPass ? 0 : 1)
}

main().catch(e => { console.error(e); process.exit(1) })
