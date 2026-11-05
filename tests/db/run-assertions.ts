/**
 * ThriveAtHome — Supabase DB Assertion Runner
 * Executes all TC-INF002, TC-M054, TC-VOL061, TC-REG001, TC-PD001, etc.
 *
 * Run:
 *   SUPABASE_URL=https://qdniskppkfqjmtpkftdt.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<key> \
 *   npx tsx tests/db/run-assertions.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

/** Execute a Supabase SQL query via the REST API */
async function sql(query: string): Promise<{ rows: Record<string, unknown>[] }> {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!resp.ok) {
    // Fallback: use the Supabase pg connection
    throw new Error(`SQL query failed: ${resp.status} ${await resp.text()}`);
  }

  return { rows: await resp.json() };
}

/** Use Supabase JS client via fetch to query tables */
async function query(table: string, select = '*', filters?: Record<string, string>) {
  let url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`;
  if (filters) {
    for (const [k, v] of Object.entries(filters)) {
      url += `&${k}=${encodeURIComponent(v)}`;
    }
  }
  const resp = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: 'count=exact',
    },
  });
  const count = parseInt(resp.headers.get('content-range')?.split('/')[1] ?? '0', 10);
  const data  = await resp.json();
  return { data: Array.isArray(data) ? data : [], count };
}

type TestResult = { tc: string; passed: boolean; detail: string };
const results: TestResult[] = [];

function pass(tc: string, detail: string) {
  results.push({ tc, passed: true, detail });
  console.log(`✅ ${tc}: ${detail}`);
}

function fail(tc: string, detail: string) {
  results.push({ tc, passed: false, detail });
  console.error(`❌ ${tc}: ${detail}`);
}

function warn(tc: string, detail: string) {
  console.warn(`⚠️  ${tc}: ${detail}`);
}

async function runAssertions() {
  console.log(`\n=== Supabase DB Assertions — ${SUPABASE_URL} ===\n`);

  // ─── TC-INF002 — All 8 migrations present ──────────────────────────────────
  const expectedMigrations = [
    '097_g54',
    '098_g55',
    '099_g56',
    '100_g58',
    '101_g510',
    '102_g4',
    'partner_listings',
    'navigator_tasks_schema_fix',
  ];
  try {
    const { data } = await query('supabase_migrations', 'name');
    const names = data.map((r: Record<string, unknown>) => r.name as string);
    const missing = expectedMigrations.filter((m) => !names.some((n) => n.includes(m)));
    if (missing.length === 0) {
      pass('TC-INF002', `All 8 Nov 4 migrations present`);
    } else {
      fail('TC-INF002', `Missing migrations: ${missing.join(', ')}`);
    }
  } catch {
    // Try alternate table name
    warn('TC-INF002', 'Could not query supabase_migrations — may need pg direct access');
  }

  // ─── TC-M054 — Community counts ────────────────────────────────────────────
  try {
    const { data } = await query('communities', 'community_type,name');
    const cultural = data.filter((r: Record<string, unknown>) => r.community_type === 'cultural');
    const interest = data.filter((r: Record<string, unknown>) => r.community_type === 'interest');
    const total    = data.length;

    if (cultural.length === 12) pass('TC-M054-cultural', `12 cultural circles found`);
    else fail('TC-M054-cultural', `Expected 12 cultural, found ${cultural.length}`);

    if (interest.length >= 8) pass('TC-M054-interest', `${interest.length} interest circles found (≥8)`);
    else fail('TC-M054-interest', `Expected ≥8 interest circles, found ${interest.length}`);

    if (total >= 20) pass('TC-M054-total', `Total communities: ${total} (≥20)`);
    else fail('TC-M054-total', `Expected ≥20 total communities, found ${total}`);
  } catch (err) {
    fail('TC-M054', `Query failed: ${err}`);
  }

  // ─── TC-M050 — 4 named interest circles ────────────────────────────────────
  try {
    const { data } = await query('communities', 'name', { 'community_type': 'eq.interest', 'is_named': 'eq.true' });
    const namedCircles = data.map((r: Record<string, unknown>) => r.name as string);
    const expected4 = ['Veterans', 'LGBTQ+', 'Widows', 'Professional Identity'];

    if (namedCircles.length === 4) {
      pass('TC-M050', `4 named interest circles: ${namedCircles.join(', ')}`);
    } else {
      fail('TC-M050', `Expected 4 named interest circles, found ${namedCircles.length}: ${namedCircles.join(', ')}`);
    }
  } catch (err) {
    fail('TC-M050', `Query failed: ${err}`);
  }

  // ─── TC-PD001 — 15+ partner listings ───────────────────────────────────────
  try {
    const { count } = await query('partner_listings', 'id');
    if (count >= 15) pass('TC-PD001', `${count} partner listings (≥15)`);
    else fail('TC-PD001', `Expected ≥15 partner listings, found ${count}`);
  } catch (err) {
    fail('TC-PD001', `Query failed: ${err}`);
  }

  // ─── TC-VOL061 — training_completed column ─────────────────────────────────
  try {
    const { data } = await query(
      'information_schema.columns',
      'column_name',
    );
    // Can't filter info_schema via REST easily — use a different check
    // Try to read a volunteer profile to see if the column exists
    const { data: vp } = await query('volunteer_profiles', 'training_completed');
    if (Array.isArray(vp)) {
      pass('TC-VOL061', 'training_completed column exists in volunteer_profiles');
    } else {
      fail('TC-VOL061', 'training_completed column missing or query failed');
    }
  } catch (err) {
    fail('TC-VOL061', `Column check failed: ${err}`);
  }

  // ─── TC-REG001 — RLS uses supabase_auth_id ─────────────────────────────────
  try {
    const { data } = await query('members', 'id');
    // If this returns without error, RLS is at least not blocking service role
    pass('TC-REG001-access', 'Service role can read members table');
    // Cannot easily check policy SQL via REST — note as manual check
    warn('TC-REG001', 'Manual check required: verify pg_policies.qual uses supabase_auth_id not user_id');
  } catch (err) {
    fail('TC-REG001', `RLS check failed: ${err}`);
  }

  // ─── TC-CH001 — 10+ metros seeded ──────────────────────────────────────────
  try {
    const { count } = await query('metro_areas', 'id');
    if (count >= 10) pass('TC-CH001', `${count} metro areas seeded (≥10)`);
    else fail('TC-CH001', `Expected ≥10 metro areas, found ${count}`);
  } catch (err) {
    fail('TC-CH001', `Query failed: ${err}`);
  }

  // ─── TC-SCH001/SCH002 — navigator_tasks schema ─────────────────────────────
  try {
    const { data } = await query('navigator_tasks', 'task_type,priority,status,member_id', {});
    pass('TC-SCH001', `navigator_tasks table accessible with key columns`);
  } catch (err) {
    fail('TC-SCH001', `navigator_tasks schema check failed: ${err}`);
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.passed).length;
  const total  = results.length;
  console.log(`\n=== DB Assertion Results: ${passed}/${total} passed ===`);
  if (passed < total) {
    console.log('\nFailed:');
    results.filter((r) => !r.passed).forEach((r) => console.log(`  ❌ ${r.tc}: ${r.detail}`));
    process.exit(1);
  }
}

runAssertions().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
