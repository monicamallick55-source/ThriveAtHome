/**
 * TC-INF005 — Environment Variable Presence Check
 * Validates all 19 required env vars are set.
 *
 * Run (locally): npx tsx scripts/check-env.ts
 * In CI: runs automatically before Playwright tests.
 *
 * Checks .env.local first, then process.env.
 * Does NOT check Vercel directly (requires Vercel token + project access).
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

/** Load .env.local if present */
function loadEnvLocal(): Record<string, string> {
  const envPath = resolve(process.cwd(), '.env.local');
  try {
    const content = readFileSync(envPath, 'utf-8');
    const vars: Record<string, string> = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
      vars[key] = val;
    }
    return vars;
  } catch {
    return {};
  }
}

const ENV_VARS: Array<{ name: string; critical: boolean; note?: string }> = [
  // Retell AI agents (12 agents + base key)
  { name: 'RETELL_API_KEY',                critical: true },
  { name: 'RETELL_AGENT_ID',               critical: true,  note: 'Aria outbound' },
  { name: 'RETELL_ROSA_AGENT_ID',          critical: true,  note: 'Rosa inbound care line' },
  { name: 'RETELL_JOY_AGENT_ID',           critical: true,  note: 'Joy celebration calls' },
  { name: 'RETELL_GRACE_AGENT_ID',         critical: true,  note: 'Grace reminder calls' },
  { name: 'RETELL_HOPE_AGENT_ID',          critical: true,  note: 'Hope crisis 24/7' },
  { name: 'RETELL_CLAIRE_AGENT_ID',        critical: true,  note: 'Claire family support' },
  { name: 'RETELL_SAM_AGENT_ID',           critical: true,  note: 'Sam volunteer support' },
  { name: 'RETELL_MORGAN_AGENT_ID',        critical: true,  note: 'Morgan buddy support' },
  { name: 'RETELL_NOVA_AGENT_ID',          critical: true,  note: 'Nova navigator assist' },
  { name: 'RETELL_ALEX_AGENT_ID',          critical: true,  note: 'Alex staff support' },
  { name: 'RETELL_QUINN_AGENT_ID',         critical: false, note: 'Quinn concierge (deferred M9)' },
  { name: 'RETELL_JORDAN_AGENT_ID',        critical: true,  note: 'Jordan B2B partner support' },
  // Twilio
  { name: 'TWILIO_ACCOUNT_SID',            critical: true },
  { name: 'TWILIO_AUTH_TOKEN',             critical: true },
  { name: 'TWILIO_PHONE_NUMBER',           critical: true,  note: 'Outbound SMS number' },
  { name: 'TWILIO_INBOUND_NUMBER',         critical: true,  note: 'Inbound voice number' },
  // AI
  { name: 'ANTHROPIC_API_KEY',             critical: true },
  // Stripe
  { name: 'NEXT_PUBLIC_BASIC_PRICE_ID',    critical: true },
  { name: 'NEXT_PUBLIC_COMPLETE_PRICE_ID', critical: true },
  { name: 'NEXT_PUBLIC_BASIC_ANNUAL_PRICE_ID',    critical: true },
  { name: 'NEXT_PUBLIC_COMPLETE_ANNUAL_PRICE_ID', critical: true },
  { name: 'STRIPE_WEBHOOK_SECRET',         critical: true },
  { name: 'STRIPE_B2B_ENROLLMENT_PRICE_ID', critical: false, note: 'Required before B2B goes live' },
  // Supabase
  { name: 'NEXT_PUBLIC_SUPABASE_URL',      critical: true },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', critical: true },
  { name: 'SUPABASE_SERVICE_ROLE_KEY',     critical: true },
  // Other
  { name: 'FHIR_API_KEY',                  critical: true },
  { name: 'CRON_SECRET',                   critical: true },
  { name: 'RESEND_API_KEY',                critical: true,  note: 'New key — old re_SYD4Fgko revoked' },
];

function main() {
  const localEnv = loadEnvLocal();
  const env      = { ...localEnv, ...process.env };

  console.log('\n=== TC-INF005 — Environment Variable Check ===\n');
  if (Object.keys(localEnv).length > 0) {
    console.log(`📄 Loaded ${Object.keys(localEnv).length} vars from .env.local\n`);
  }

  let criticalMissing = 0;
  let optionalMissing = 0;
  let present = 0;

  for (const { name, critical, note } of ENV_VARS) {
    const val = env[name];
    const set = val !== undefined && val !== '';

    if (set) {
      const masked = val.length > 8 ? val.substring(0, 4) + '...' + val.slice(-4) : '****';
      console.log(`  ✅ ${name}=${masked}${note ? ` (${note})` : ''}`);
      present++;
    } else if (critical) {
      console.error(`  ❌ ${name} — MISSING (critical)${note ? ` — ${note}` : ''}`);
      criticalMissing++;
    } else {
      console.warn(`  ⚠️  ${name} — not set${note ? ` — ${note}` : ''}`);
      optionalMissing++;
    }
  }

  // Special check: old Resend key must NOT be active
  const resendKey = env['RESEND_API_KEY'] ?? '';
  if (resendKey.startsWith('re_SYD4Fgko')) {
    console.error('\n  ❌ TC-REG004: RESEND_API_KEY is the REVOKED old key! Replace immediately.\n');
    criticalMissing++;
  }

  console.log(`\n=== Results ===`);
  console.log(`  ✅ Present:          ${present}`);
  console.log(`  ❌ Critical missing: ${criticalMissing}`);
  console.log(`  ⚠️  Optional missing: ${optionalMissing}`);

  if (criticalMissing > 0) {
    console.error(`\n🔴 FAIL — ${criticalMissing} critical env vars missing. Add them to Vercel and .env.local.\n`);
    process.exit(1);
  } else {
    console.log(`\n🟢 PASS — All critical env vars set.${optionalMissing > 0 ? ` (${optionalMissing} optional vars not set)` : ''}\n`);
  }
}

main();
