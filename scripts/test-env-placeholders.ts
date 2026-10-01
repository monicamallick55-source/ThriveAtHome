// Verifies provider env handling: empty and "[SENSITIVE]"-style placeholder values are
// treated as missing (stubs), and RETELL_WEBHOOK_SECRET takes priority for signatures.
// Usage: npx tsx scripts/test-env-placeholders.ts   (no network, no DB)
import Retell from 'retell-sdk'

let allPass = true
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) allPass = false
}

async function main() {
  // Placeholders everywhere a real provider could switch on
  for (const v of ['ANTHROPIC_API_KEY', 'RETELL_API_KEY', 'TWILIO_ACCOUNT_SID', 'SENDGRID_API_KEY', 'STRIPE_SECRET_KEY']) {
    process.env[v] = '[SENSITIVE]'
  }
  process.env.RETELL_JOY_AGENT_ID = '[SENSITIVE]'
  process.env.RETELL_WEBHOOK_SECRET = ''

  const { envKey } = await import('../lib/env')
  check('envKey("[SENSITIVE]") → null', envKey('ANTHROPIC_API_KEY') === null)
  check('envKey("") → null', envKey('RETELL_WEBHOOK_SECRET') === null)

  const p = await import('../lib/providers')
  check('AI provider is the stub', p.aiProvider.constructor.name === 'StubAiProvider', p.aiProvider.constructor.name)
  check('call provider is the stub', p.callProvider.constructor.name === 'StubCallProvider', p.callProvider.constructor.name)
  check('SMS provider is the stub', p.smsProvider.constructor.name === 'StubSmsProvider', p.smsProvider.constructor.name)
  check('email provider is the stub', p.emailProvider.constructor.name === 'StubEmailProvider', p.emailProvider.constructor.name)
  check('billing provider is the stub', p.billingProvider.constructor.name === 'StubBillingProvider', p.billingProvider.constructor.name)

  const { agentIdFor } = await import('../lib/voice/agents')
  check('placeholder agent id → null', agentIdFor('joy') === null)

  const { verifyRetellRequest } = await import('../lib/voice/verifyRetell')
  const body = JSON.stringify({ event: 'ping' })
  const req = (sig?: string) => new Request('http://x/api/webhooks/retell', {
    method: 'POST', body, headers: sig ? { 'x-retell-signature': sig } : {},
  })
  check('placeholder keys → stub mode, unsigned request allowed', (await verifyRetellRequest(req())).ok === true)

  process.env.RETELL_API_KEY = 'api_key_test'
  process.env.RETELL_WEBHOOK_SECRET = 'webhook_secret_test'
  const sigSecret = await Retell.sign(body, 'webhook_secret_test')
  const sigApi = await Retell.sign(body, 'api_key_test')
  check('RETELL_WEBHOOK_SECRET set → secret-signed request passes', (await verifyRetellRequest(req(sigSecret))).ok === true)
  check('RETELL_WEBHOOK_SECRET set → API-key-signed request rejected', (await verifyRetellRequest(req(sigApi))).ok === false)

  process.env.RETELL_WEBHOOK_SECRET = '[SENSITIVE]'
  check('placeholder webhook secret → falls back to RETELL_API_KEY', (await verifyRetellRequest(req(sigApi))).ok === true)

  console.log(allPass ? '\n✅ ALL PASS\n' : '\n❌ FAILURES ABOVE\n')
  process.exit(allPass ? 0 : 1)
}

main().catch(e => { console.error(e); process.exit(1) })
