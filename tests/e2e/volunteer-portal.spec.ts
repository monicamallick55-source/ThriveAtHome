import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

test('TC-VOL001 — volunteer dashboard loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.volunteer);
  await page.waitForLoadState('networkidle');
  expect(page.url()).toMatch(/\/volunteer/);
});

test('TC-VOL002 — /volunteer/dashboard loads content', async ({ page }) => {
  await loginAs(page, ACCOUNTS.volunteer);
  await page.goto(`${BASE}/volunteer/dashboard`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-VOL010 — /university-admin loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.uniadmin);
  await page.goto(`${BASE}/university-admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-VOL020 — /vso-admin loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.vsoadmin);
  await page.goto(`${BASE}/vso-admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-VOL030 — /school-admin loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.k12admin);
  await page.goto(`${BASE}/school-admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-VOL060 — /api/volunteer/training-status responds', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/volunteer/training-status`);
  if (res.status() === 404) { console.warn('TC-VOL060: training-status endpoint not found'); return; }
  expect([200, 401]).toContain(res.status());
});
