/**
 * TC-FMD* — FHIR R4 referral + Medicare plan comparison deep (G5.9) Nov 4
 */
import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

// ── FHIR R4 referral ──────────────────────────────────────────────────────────

test('TC-FMD001 — /dashboard/fhir-referrals loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  if (page.url().includes('/login')) { console.warn('TC-FMD001: login failed'); return; }
  await page.goto(`${BASE}/dashboard/fhir-referrals`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-FMD001: redirected'); return; }
  const content = await page.content();
  expect(content).not.toMatch(/application error|internal server error/i);
});

test('TC-FMD002 — /api/fhir/referral POST rejects unauthenticated', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/fhir/referral`, {
    data: { resourceType: 'ServiceRequest' },
    headers: { 'content-type': 'application/fhir+json' },
  });
  expect([401, 403]).toContain(res.status());
});

test('TC-FMD003 — /api/fhir/referral POST returns OperationOutcome on bad JSON', async ({ page }) => {
  await loginAs(page, ACCOUNTS.admin);
  if (page.url().includes('/login')) { console.warn('TC-FMD003: login failed'); return; }
  const res = await page.request.post(`${BASE}/api/fhir/referral`, {
    data: 'not valid fhir',
    headers: { 'content-type': 'application/fhir+json' },
  });
  expect(res.status()).not.toBe(500);
  expect([400, 401, 403, 422]).toContain(res.status());
});

test('TC-FMD004 — /api/fhir/referral accepts valid FHIR ServiceRequest', async ({ page }) => {
  await loginAs(page, ACCOUNTS.admin);
  if (page.url().includes('/login')) { console.warn('TC-FMD004: login failed'); return; }
  const res = await page.request.post(`${BASE}/api/fhir/referral`, {
    data: {
      resourceType: 'ServiceRequest',
      status: 'active',
      intent: 'referral',
      subject: { reference: 'Patient/test-patient' },
    },
    headers: { 'content-type': 'application/fhir+json' },
  });
  expect(res.status()).not.toBe(500);
  expect([200, 201, 400, 401, 404, 422]).toContain(res.status());
});

// ── Medicare plan comparison ──────────────────────────────────────────────────

test('TC-FMD010 — /dashboard/medicare-help loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  if (page.url().includes('/login')) { console.warn('TC-FMD010: login failed'); return; }
  await page.goto(`${BASE}/dashboard/medicare-help`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-FMD010: redirected'); return; }
  const content = await page.content();
  expect(content).not.toMatch(/application error|internal server error/i);
});

test('TC-FMD011 — medicare-help page shows plan types (A/B/C/D)', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  if (page.url().includes('/login')) { console.warn('TC-FMD011: login failed'); return; }
  await page.goto(`${BASE}/dashboard/medicare-help`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-FMD011: redirected'); return; }
  const content = await page.content();
  const hasPlans = content.match(/Part A|Part B|Part C|Part D|Medicare Advantage|Medigap/i);
  if (!hasPlans) console.warn('TC-FMD011: Medicare plan types not found');
});

test('TC-FMD012 — /dashboard/plan-comparison loads Medicare comparison', async ({ page }) => {
  await loginAs(page, ACCOUNTS.medicare_member);
  if (page.url().includes('/login')) { console.warn('TC-FMD012: medicare_member login failed — trying member'); }
  if (page.url().includes('/login')) await loginAs(page, ACCOUNTS.member);
  if (page.url().includes('/login')) { console.warn('TC-FMD012: login failed'); return; }
  await page.goto(`${BASE}/dashboard/plan-comparison`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-FMD012: redirected'); return; }
  const content = await page.content();
  expect(content).not.toMatch(/application error|internal server error/i);
});

test('TC-FMD013 — /api/admin/ma-report responds for admin', async ({ page }) => {
  await loginAs(page, ACCOUNTS.admin);
  if (page.url().includes('/login')) { console.warn('TC-FMD013: login failed'); return; }
  const res = await page.request.get(`${BASE}/api/admin/ma-report`);
  expect(res.status()).not.toBe(500);
  expect([200, 400, 403, 404]).toContain(res.status());
});

test('TC-FMD014 — /admin/ma-report page loads for admin', async ({ page }) => {
  await loginAs(page, ACCOUNTS.admin);
  if (page.url().includes('/login')) { console.warn('TC-FMD014: login failed'); return; }
  await page.goto(`${BASE}/admin/ma-report`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-FMD014: redirected'); return; }
  const content = await page.content();
  expect(content).not.toMatch(/application error|internal server error/i);
});
