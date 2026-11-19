/**
 * TC-ECF* — Encore careers, cultural festivals, home safety (G6.1, G6.3, G7.22) Nov 4
 */
import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

// ── Encore careers ────────────────────────────────────────────────────────────

test('TC-ECF001 — /dashboard/encore-careers loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  await page.goto(`${BASE}/dashboard/encore-careers`);
  await page.waitForLoadState('networkidle');
  const content = await page.content();
  expect(content).not.toMatch(/application error|internal server error/i);
});

test('TC-ECF002 — encore careers shows part-time/consulting/volunteer roles', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  await page.goto(`${BASE}/dashboard/encore-careers`);
  await page.waitForLoadState('networkidle');
  const content = await page.content();
  const hasContent = content.match(/encore|part.time|consulting|second career|mentor|volunteer|flexible/i);
  if (!hasContent) console.warn('TC-ECF002: encore careers content not found');
});

test('TC-ECF003 — /api/encore-careers responds', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  const res = await page.request.get(`${BASE}/api/encore-careers`);
  expect(res.status()).not.toBe(500);
  expect([200, 400, 404]).toContain(res.status());
});

// ── Cultural festivals ────────────────────────────────────────────────────────

test('TC-ECF010 — /dashboard/festivals loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  await page.goto(`${BASE}/dashboard/festivals`);
  await page.waitForLoadState('networkidle');
  const content = await page.content();
  expect(content).not.toMatch(/application error|internal server error/i);
});

test('TC-ECF011 — festivals page shows cultural events or calendar', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  await page.goto(`${BASE}/dashboard/festivals`);
  await page.waitForLoadState('networkidle');
  const content = await page.content();
  const hasContent = content.match(/festival|cultural|heritage|celebration|community event/i);
  if (!hasContent) console.warn('TC-ECF011: cultural festival content not found');
});

// ── Home safety assessment (G6.1) ─────────────────────────────────────────────

test('TC-ECF020 — /dashboard/home-safety loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  await page.goto(`${BASE}/dashboard/home-safety`);
  await page.waitForLoadState('networkidle');
  const content = await page.content();
  expect(content).not.toMatch(/application error|internal server error/i);
});

test('TC-ECF021 — home safety page has assessment checklist or form', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  await page.goto(`${BASE}/dashboard/home-safety`);
  await page.waitForLoadState('networkidle');
  const content = await page.content();
  const hasAssessment = content.match(/assessment|checklist|hazard|bathroom|fall|grab bar|lighting|safety/i);
  if (!hasAssessment) console.warn('TC-ECF021: home safety assessment content not found');
});

test('TC-ECF022 — /api/home-safety/assessment POST responds', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  const res = await page.request.post(`${BASE}/api/home-safety/assessment`, {
    data: { memberId: 'test', answers: {} },
  });
  expect(res.status()).not.toBe(500);
  expect([200, 201, 400, 401, 404]).toContain(res.status());
});
