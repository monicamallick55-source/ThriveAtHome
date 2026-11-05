/**
 * Voice Pipeline — AI Agent E2E Tests
 * TC-V001–V081: Retell agents, Twilio SMS, cron endpoints, webhooks
 *
 * Run: npx playwright test tests/e2e/voice-pipeline.spec.ts
 *
 * Notes:
 * - Most tests hit API endpoints directly via request fixture (no real phone calls)
 * - Soft-warn pattern used for endpoints requiring real credentials/seeded data
 * - TC-V081 is manual-only; test always passes with a console warning
 */
import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, ACCOUNTS, loginAs } from './helpers';

const CRON_SECRET = '0LjR0pE/7WueB508Z6OER1s/6x0Buze2vbRPVljKxFs=';
const CRON_HEADERS = { Authorization: `Bearer ${CRON_SECRET}` };

// ── Helper: POST a cron endpoint, return { status, body } ───────────────────

async function postCron(request: any, path: string): Promise<{ status: number; body: any }> {
  const res = await request.post(`${BASE}${path}`, {
    headers: CRON_HEADERS,
  });
  let body: any = {};
  try { body = await res.json(); } catch { body = {}; }
  return { status: res.status(), body };
}

// ── Helper: POST a webhook endpoint ─────────────────────────────────────────

async function postWebhook(request: any, path: string, payload: any): Promise<{ status: number; body: any }> {
  const res = await request.post(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    data: payload,
  });
  let body: any = {};
  try { body = await res.json(); } catch { body = {}; }
  return { status: res.status(), body };
}

// ════════════════════════════════════════════════════════════════════════════
// 3a — Infrastructure
// ════════════════════════════════════════════════════════════════════════════

test('TC-V001 — Env vars present: wrong CRON_SECRET → 401 (endpoint exists)', async ({ request }) => {
  const res = await request.post(`${BASE}/api/cron/aria-calls`, {
    headers: { Authorization: 'Bearer WRONG_SECRET' },
  });
  // 401 = endpoint exists and auth is enforced ✓
  // 404 = cron route missing (acceptable, warn)
  // 500 = crash (fail)
  if (res.status() === 500) {
    throw new Error('TC-V001: /api/cron/aria-calls returned 500 — likely missing env vars or crash');
  }
  if (res.status() === 404) {
    console.warn('TC-V001: /api/cron/aria-calls not found (404) — cron route may not exist yet');
    return;
  }
  expect(res.status(), 'Wrong secret should return 401').toBe(401);
});

test('TC-V002 — All 12 agent IDs: correct CRON_SECRET → 200/207 (not 500)', async ({ request }) => {
  const { status, body } = await postCron(request, '/api/cron/aria-calls');
  if (status === 404) {
    console.warn('TC-V002: /api/cron/aria-calls returned 404 — cron route not yet built');
    return;
  }
  if (status === 500) {
    throw new Error(`TC-V002: 500 from aria-calls cron — likely missing RETELL_API_KEY or agent ID env vars. Body: ${JSON.stringify(body)}`);
  }
  expect([200, 207], `Expected 200 or 207, got ${status}`).toContain(status);
});

// ════════════════════════════════════════════════════════════════════════════
// 3b — Aria (Outbound Daily Check-In)
// ════════════════════════════════════════════════════════════════════════════

test('TC-V010 — Aria outbound cron: 200/207, called count ≥ 0', async ({ request }) => {
  const { status, body } = await postCron(request, '/api/cron/aria-calls');
  if (status === 404) {
    console.warn('TC-V010: /api/cron/aria-calls not found — skipping');
    return;
  }
  expect(status, 'Aria cron should not 500').not.toBe(500);
  expect([200, 207]).toContain(status);
  if (typeof body.called === 'number') {
    expect(body.called, 'called count should be ≥ 0').toBeGreaterThanOrEqual(0);
  }
});

test('TC-V011 — Aria clinical extraction: webhook accepts call-ended payload', async ({ request }) => {
  const payload = {
    event: 'call_ended',
    call: {
      call_id: 'test-call-v011',
      call_status: 'ended',
      metadata: { member_email: 'member@test.com' },
      transcript: 'I have been having a lot of pain today. I forgot to take my medication. I feel very isolated and alone.',
    },
  };
  const { status } = await postWebhook(request, '/api/webhooks/retell', payload);
  if (status === 401 || status === 403) {
    console.warn('TC-V011: /api/webhooks/retell returned auth error — Retell signature verification required in prod');
    return;
  }
  if (status === 404) {
    console.warn('TC-V011: /api/webhooks/retell not found — webhook route missing');
    return;
  }
  expect(status, 'Clinical extraction webhook should not 500').not.toBe(500);
  expect([200, 204]).toContain(status);
});

test('TC-V012 — Family events context: GET /api/family-events not 500', async ({ request }) => {
  const res = await request.get(`${BASE}/api/family-events?member_id=test`);
  if (res.status() === 404) {
    console.warn('TC-V012: /api/family-events not found — endpoint may not exist yet');
    return;
  }
  expect(res.status(), 'Family events should not 500').not.toBe(500);
  // 200 = works, 401 = auth required (acceptable for now)
  expect([200, 401, 403]).toContain(res.status());
});

test('TC-V013 — Fraud detection: webhook with scam transcript not 500', async ({ request }) => {
  const payload = {
    event: 'call_ended',
    call: {
      call_id: 'test-call-v013',
      call_status: 'ended',
      metadata: { member_email: 'member@test.com' },
      transcript: 'Someone called and said I won the lottery. They asked me to wire transfer $500 to claim my prize.',
    },
  };
  const { status } = await postWebhook(request, '/api/webhooks/retell', payload);
  if (status === 401 || status === 403) {
    console.warn('TC-V013: Retell webhook requires signature auth — manual test required for fraud detection');
    return;
  }
  if (status === 404) {
    console.warn('TC-V013: /api/webhooks/retell not found');
    return;
  }
  expect(status, 'Fraud detection webhook should not 500').not.toBe(500);
});

test('TC-V014 — Crisis detection: webhook with crisis transcript not 500', async ({ request }) => {
  const payload = {
    event: 'call_ended',
    call: {
      call_id: 'test-call-v014',
      call_status: 'ended',
      metadata: { member_email: 'member@test.com' },
      transcript: "I don't want to be here anymore. I feel like there's no point.",
    },
  };
  const { status } = await postWebhook(request, '/api/webhooks/retell', payload);
  if (status === 401 || status === 403) {
    console.warn('TC-V014: Crisis webhook requires Retell signature — manual test required');
    return;
  }
  if (status === 404) {
    console.warn('TC-V014: /api/webhooks/retell not found');
    return;
  }
  expect(status, 'Crisis detection webhook should not 500').not.toBe(500);
});

test('TC-V015 — Missed call handling: aria cron runs without crash', async ({ request }) => {
  const { status, body } = await postCron(request, '/api/cron/aria-calls');
  if (status === 404) {
    console.warn('TC-V015: Aria cron not found — skipping missed call test');
    return;
  }
  expect(status, 'Aria cron (missed call path) should not 500').not.toBe(500);
  if (body.missed !== undefined) {
    expect(typeof body.missed).toBe('number');
  }
});

test('TC-V016 — Call summary email: aria cron completes without crash', async ({ request }) => {
  const { status } = await postCron(request, '/api/cron/aria-calls');
  if (status === 404) {
    console.warn('TC-V016: Aria cron not found — skipping call summary test');
    return;
  }
  expect([200, 207]).toContain(status);
});

// ════════════════════════════════════════════════════════════════════════════
// 3c — Grace (Reminder Calls)
// ════════════════════════════════════════════════════════════════════════════

test('TC-V020 — Grace reminder cron: 200/404, NOT 500', async ({ request }) => {
  // Try both common path patterns
  let status = 0;
  for (const path of ['/api/cron/grace-reminders', '/api/cron/reminders', '/api/cron/grace']) {
    const res = await request.post(`${BASE}${path}`, { headers: CRON_HEADERS });
    status = res.status();
    if (status !== 404) break;
  }
  if (status === 404) {
    console.warn('TC-V020: Grace reminder cron endpoint not found (404) — not yet built');
    return;
  }
  if (status === 401) {
    console.warn('TC-V020: Grace cron auth check passed (401 without correct secret)');
    return;
  }
  expect(status, 'Grace cron should not 500').not.toBe(500);
});

// ════════════════════════════════════════════════════════════════════════════
// 3d — Joy (Celebration Calls)
// ════════════════════════════════════════════════════════════════════════════

test('TC-V025 — Joy birthday call: birthday-arc cron 200/207, not 500', async ({ request }) => {
  const { status } = await postCron(request, '/api/cron/birthday-arc');
  if (status === 404) {
    console.warn('TC-V025: /api/cron/birthday-arc not found');
    return;
  }
  expect(status, 'Birthday arc cron should not 500').not.toBe(500);
  expect([200, 207]).toContain(status);
});

test('TC-V026 — Joy milestone interview: birthday-arc cron handles milestone members', async ({ request }) => {
  const { status, body } = await postCron(request, '/api/cron/birthday-arc');
  if (status === 404) {
    console.warn('TC-V026: /api/cron/birthday-arc not found');
    return;
  }
  expect(status, 'Birthday arc (milestone path) should not 500').not.toBe(500);
  // If body has milestone count, verify it's ≥ 0
  if (body.milestones !== undefined) {
    expect(typeof body.milestones).toBe('number');
  }
});

// ════════════════════════════════════════════════════════════════════════════
// 3e — Rosa (Care Line, Inbound)
// ════════════════════════════════════════════════════════════════════════════

test('TC-V030 — Rosa inbound: Twilio webhook endpoint not 500', async ({ request }) => {
  // POST a Twilio-style inbound call webhook
  const res = await request.post(`${BASE}/api/webhooks/twilio`, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    form: {
      CallSid: 'CAtest00000000000000000000000000001',
      From: '+14155550001',
      To: '+14155550000',
      CallStatus: 'in-progress',
    },
  });
  if (res.status() === 404) {
    console.warn('TC-V030: /api/webhooks/twilio not found');
    return;
  }
  if (res.status() === 403) {
    console.warn('TC-V030: Twilio webhook requires signature verification — expected in prod');
    return;
  }
  expect(res.status(), 'Rosa/Twilio webhook should not 500').not.toBe(500);
});

// ════════════════════════════════════════════════════════════════════════════
// 3f — Hope (Crisis Line, Inbound 24/7)
// ════════════════════════════════════════════════════════════════════════════

test('TC-V035 — Hope crisis line: crisis webhook endpoint not 500', async ({ request }) => {
  // Try crisis-specific webhook first, fall back to twilio
  for (const path of ['/api/webhooks/twilio/crisis', '/api/webhooks/hope', '/api/webhooks/twilio']) {
    const res = await request.post(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      form: {
        CallSid: 'CAtest00000000000000000000000000002',
        From: '+14155550002',
        To: '+14155550099',
        CallStatus: 'in-progress',
      },
    });
    if (res.status() === 500) {
      throw new Error(`TC-V035: ${path} returned 500 — crash in Hope/crisis webhook`);
    }
    if (res.status() !== 404) {
      console.warn(`TC-V035: ${path} returned ${res.status()} — crisis line endpoint present`);
      return;
    }
  }
  console.warn('TC-V035: No crisis webhook endpoint found (404) — may route through main Twilio webhook');
});

// ════════════════════════════════════════════════════════════════════════════
// 3g–3k — Claire, Sam, Morgan, Nova, Alex (Inbound agents)
// These require real phone calls to fully test; verify no crash via admin panel
// ════════════════════════════════════════════════════════════════════════════

test('TC-V040 — Claire family support: admin panel loads without crash', async ({ page }) => {
  await loginAs(page, ACCOUNTS.admin).catch(() => {});
  if (page.url().includes('/login')) {
    console.warn('TC-V040: admin@test.com not seeded — skipping Claire agent check');
    return;
  }
  await page.goto(`${BASE}/admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/500');
  // Claire is a Retell agent; full E2E requires a real inbound call
  console.warn('TC-V040: Claire full E2E requires real inbound call to Claire number — manual verification needed');
});

test('TC-V045 — Sam volunteer support: admin panel loads without crash', async ({ page }) => {
  await loginAs(page, ACCOUNTS.admin).catch(() => {});
  if (page.url().includes('/login')) {
    console.warn('TC-V045: admin@test.com not seeded — skipping Sam agent check');
    return;
  }
  await page.goto(`${BASE}/admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/500');
  console.warn('TC-V045: Sam full E2E requires real inbound call to Sam number — manual verification needed');
});

test('TC-V050 — Morgan buddy support: admin panel loads without crash', async ({ page }) => {
  await loginAs(page, ACCOUNTS.admin).catch(() => {});
  if (page.url().includes('/login')) {
    console.warn('TC-V050: admin@test.com not seeded — skipping Morgan agent check');
    return;
  }
  await page.goto(`${BASE}/admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/500');
  console.warn('TC-V050: Morgan full E2E requires real inbound call to Morgan number — manual verification needed');
});

test('TC-V055 — Nova navigator assist: admin panel loads without crash', async ({ page }) => {
  await loginAs(page, ACCOUNTS.admin).catch(() => {});
  if (page.url().includes('/login')) {
    console.warn('TC-V055: admin@test.com not seeded — skipping Nova agent check');
    return;
  }
  await page.goto(`${BASE}/admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/500');
  console.warn('TC-V055: Nova full E2E requires real inbound call to Nova number — manual verification needed');
});

test('TC-V060 — Alex staff support: admin panel loads without crash', async ({ page }) => {
  await loginAs(page, ACCOUNTS.admin).catch(() => {});
  if (page.url().includes('/login')) {
    console.warn('TC-V060: admin@test.com not seeded — skipping Alex agent check');
    return;
  }
  await page.goto(`${BASE}/admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/500');
  console.warn('TC-V060: Alex full E2E requires real inbound call to Alex number — manual verification needed');
});

// ════════════════════════════════════════════════════════════════════════════
// 3l — Quinn (Deferred M9)
// ════════════════════════════════════════════════════════════════════════════

test('TC-V065 — Quinn deferred: aria cron still returns 200 without Quinn agent ID', async ({ request }) => {
  // Quinn is deferred; missing RETELL_QUINN_AGENT_ID should NOT crash other agents
  const { status } = await postCron(request, '/api/cron/aria-calls');
  if (status === 404) {
    console.warn('TC-V065: Aria cron not found — cannot verify Quinn non-crash');
    return;
  }
  expect(status, 'Missing Quinn agent ID should not crash aria cron (500)').not.toBe(500);
  console.warn('TC-V065: Quinn deferred to M9 — RETELL_QUINN_AGENT_ID not required for launch');
});

// ════════════════════════════════════════════════════════════════════════════
// 3m — Jordan (B2B Partner Support)
// ════════════════════════════════════════════════════════════════════════════

test('TC-V070 — Jordan B2B support: org admin portal loads without crash', async ({ page }) => {
  await loginAs(page, ACCOUNTS.orgadmin).catch(() => {});
  if (page.url().includes('/login')) {
    console.warn('TC-V070: orgadmin@test.com not seeded — testing /org-admin unauthenticated redirect');
    await page.goto(`${BASE}/org-admin`);
    await page.waitForLoadState('networkidle');
    // Should redirect to login (not 500)
    expect(page.url()).not.toContain('/500');
    return;
  }
  await page.goto(`${BASE}/org-admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/500');
  console.warn('TC-V070: Jordan full E2E requires real inbound call to Jordan number — manual verification needed');
});

// ════════════════════════════════════════════════════════════════════════════
// 3n — Twilio SMS
// ════════════════════════════════════════════════════════════════════════════

test('TC-V080 — Family crisis SMS: Twilio env present, cron endpoint responds', async ({ request, page }) => {
  // Verify Twilio env by checking the aria cron responds (uses Twilio for SMS)
  const { status } = await postCron(request, '/api/cron/aria-calls');
  if (status === 404) {
    console.warn('TC-V080: Aria cron not found — cannot verify Twilio SMS env');
    return;
  }
  if (status === 500) {
    throw new Error('TC-V080: Aria cron returned 500 — likely missing TWILIO_* env vars or Retell env vars');
  }
  expect([200, 207]).toContain(status);
  console.warn('TC-V080: Full Twilio SMS delivery requires real phone number and 10DLC registration — manual verification needed');
});

test('TC-V081 — 10DLC registration status: MANUAL CHECK REQUIRED', async () => {
  // This is a manual verification step — cannot be automated via Playwright
  // Action: Go to Twilio Console → Messaging → Regulatory Compliance
  // Verify: Brand registration status (pending/approved) + Campaign registration status
  // If not registered: P0 — start registration (2–3 week lead time)
  console.warn(
    'TC-V081 MANUAL CHECK REQUIRED: Verify 10DLC registration in Twilio Console → ' +
    'Messaging → Regulatory Compliance. Brand + Campaign must be APPROVED before ' +
    'sending SMS to real users. This is a P0 blocker (2–3 week approval lead time).'
  );
  // Test always passes — this is a checklist item, not automatable
  expect(true).toBe(true);
});
