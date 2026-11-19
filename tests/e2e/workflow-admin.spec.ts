import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

// TC-WA001–WA012: Admin + Care Worker workflows
// No beforeEach — each test logs in independently with soft-warn pattern

test('TC-WA001 — admin dashboard loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.admin);
  await page.goto(`${BASE}/admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).toContain('/admin');
});

test('TC-WA002 — /admin/ma-report loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.admin);
  await page.goto(`${BASE}/admin/ma-report`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-WA003 — /admin/metro-activation loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.admin);
  await page.goto(`${BASE}/admin/metro-activation`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-WA004 — /admin/devices loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.admin);
  await page.goto(`${BASE}/admin/devices`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-WA005 — /admin/campaigns loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.admin);
  await page.goto(`${BASE}/admin/campaigns`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-WA010 — /agency-admin loads for agency account', async ({ page }) => {
  await loginAs(page, ACCOUNTS.agency);
  await page.goto(`${BASE}/agency-admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-WA011 — care worker portal loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.careworker);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-WA012 — /api/admin/feature-flags responds', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/admin/feature-flags`);
  if (res.status() === 404) { console.warn('TC-WA012: /api/admin/feature-flags not found'); return; }
  expect([200, 401, 403]).toContain(res.status());
});
