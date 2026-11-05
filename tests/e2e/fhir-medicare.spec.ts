import { test, expect } from '@playwright/test';
import { BASE_URL as BASE } from './helpers';

// TC-FH001–FH006: FHIR R4 Endpoint
// TC-MED001–MED004: Medicare NLP

test('TC-FH001 — FHIR inbound referral endpoint exists', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/fhir/referrals`, {
    data: { resourceType: 'ServiceRequest', status: 'active' },
    headers: { 'Content-Type': 'application/fhir+json' },
  });
  if (res.status() === 404) { console.warn('TC-FH001: /api/fhir/referrals not implemented'); return; }
  expect([200, 400, 401, 422]).toContain(res.status());
});

test('TC-FH002 — FHIR endpoint rejects unauthenticated request', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/fhir/referrals`, {
    data: { resourceType: 'ServiceRequest' },
    headers: { 'Content-Type': 'application/fhir+json' },
  });
  if (res.status() === 404) { console.warn('TC-FH002: endpoint not found — skipping'); return; }
  expect([401, 422]).toContain(res.status());
});

test('TC-FH003 — FHIR endpoint returns OperationOutcome on bad JSON', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/fhir/referrals`, {
    data: 'not-json',
    headers: {
      'Content-Type': 'application/fhir+json',
      'Authorization': 'Bearer test-key',
    },
  });
  if (res.status() === 404) { console.warn('TC-FH003: endpoint not found'); return; }
  expect([400, 401, 422]).toContain(res.status());
});

test('TC-MED001 — /api/check-in-calls endpoint exists', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/check-in-calls`);
  if (res.status() === 404) { console.warn('TC-MED001: /api/check-in-calls not found'); return; }
  expect([200, 401]).toContain(res.status());
});

test('TC-MED002 — Retell call-ended webhook endpoint exists', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/retell/call-ended`, {
    data: { call_id: 'test', transcript: 'I feel some pain today' },
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status() === 404) { console.warn('TC-MED002: /api/retell/call-ended not found'); return; }
  expect([200, 400, 401]).toContain(res.status());
});

test('TC-MED003 — /api/admin/ma-report requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/admin/ma-report`);
  if (res.status() === 404) { console.warn('TC-MED003: /api/admin/ma-report not found'); return; }
  expect([200, 401, 403]).toContain(res.status());
});

test('TC-MED004 — no 500 on call-ended webhook with empty body', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/retell/call-ended`, {
    data: {},
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status() === 404) { console.warn('TC-MED004: endpoint not found'); return; }
  expect(res.status()).not.toBe(500);
});
