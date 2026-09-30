// G1.2 verification — agent registry + per-agent call routing.
// Usage: npx tsx scripts/test-agents.ts
// Uses fake env vars only. Never places a real call: the Retell provider is only
// exercised on the missing-env-var path, which throws before any network request.
import { AGENTS, AGENT_NAMES, agentIdFor, agentNameFromId } from '../lib/voice/agents'
import { StubCallProvider } from '../lib/stubs/StubCallProvider'
import { RetellCallProvider } from '../lib/services/RetellCallProvider'
import type { CallContext } from '../lib/interfaces/CallProvider'

let allPass = true
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) allPass = false
}

async function main() {
  console.log('\n── G1.2 agent registry ──\n')

  // 1. Exactly 12 agents
  check('AGENTS has exactly 12 entries', Object.keys(AGENTS).length === 12, String(Object.keys(AGENTS).length))

  // 2. Round-trip every agent through fake env vars
  const saved: Record<string, string | undefined> = {}
  for (const name of AGENT_NAMES) {
    const v = AGENTS[name].envVar
    saved[v] = process.env[v]
    process.env[v] = `agent_fake_${name}_0001`
  }
  for (const name of AGENT_NAMES) {
    const id = agentIdFor(name)
    check(`round-trip ${name}`, id === `agent_fake_${name}_0001` && agentNameFromId(id) === name, `${AGENTS[name].envVar} → ${id}`)
  }
  check('unknown agent_id → null', agentNameFromId('agent_not_ours') === null)
  check('null agent_id → null', agentNameFromId(null) === null)

  // 3. Joy call via stub logs joy + its env var
  const ctx: CallContext = {
    preferredName: 'Test', interests: [], priorCallSummaries: [], preferredLanguage: 'english',
    callType: 'celebration', agent: 'joy',
  }
  const logs: string[] = []
  const origLog = console.log
  console.log = (...args: unknown[]) => { logs.push(args.join(' ')) }
  await new StubCallProvider().scheduleCall('00000000-0000-0000-0000-000000000000', '+15555550100', ctx)
  console.log = origLog
  const line = logs.find(l => l.startsWith('[STUB][Call]')) ?? ''
  check('Joy stub call logs joy + RETELL_JOY_AGENT_ID', line.includes('joy →') && line.includes('RETELL_JOY_AGENT_ID'), line)

  // 4. Missing env var → readable error, no network call
  delete process.env.RETELL_GRACE_AGENT_ID
  const origFetch = globalThis.fetch
  let fetched = false
  globalThis.fetch = (async () => { fetched = true; throw new Error('fetch must not be called') }) as typeof fetch
  let message = ''
  try {
    await new RetellCallProvider().scheduleCall('00000000-0000-0000-0000-000000000000', '+15555550100', { ...ctx, agent: 'grace', callType: 'reminder' })
  } catch (e) {
    message = (e as Error).message
  }
  globalThis.fetch = origFetch
  check('missing env var error names RETELL_GRACE_AGENT_ID', message.includes('RETELL_GRACE_AGENT_ID is not set') && !fetched, message)

  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }

  console.log(allPass ? '\n✅ ALL PASS\n' : '\n❌ FAILURES ABOVE\n')
  process.exit(allPass ? 0 : 1)
}

main()
