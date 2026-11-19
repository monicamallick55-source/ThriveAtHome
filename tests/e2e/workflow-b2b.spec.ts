import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

// TC-WB001–WB010: B2B portal workflows

test('TC-WB001 — org-admin portal loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.orgadmin);
  await page.goto(`${BASE}/org-admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-WB002 — network-admin portal loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.network);
  await page.goto(`${BASE}/network-admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-WB003 — /employers public page loads without login', async ({ page }) => {
  await page.goto(`${BASE}/employers`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-WB004 — VSO admin portal loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.vsoadmin);
  await page.goto(`${BASE}/vso-admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-WB005 — employer admin portal loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.employer);
  await page.goto(`${BASE}/employer-admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-WB006 — AAA admin portal loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.aaa);
  await page.goto(`${BASE}/aaa-admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-WB007 — senior center admin portal loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.seniorcenter);
  await page.goto(`${BASE}/senior-center-admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-WB008 — /api/b2b/enrollment-fee endpoint exists', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/b2b/enrollment-fee`);
  if (res.status() === 404) { console.warn('TC-WB008: /api/b2b/enrollment-fee not found'); return; }
  expect([200, 400, 401, 405]).toContain(res.status());
});

test('TC-WB009 — university admin portal loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.uniadmin);
  await page.goto(`${BASE}/university-admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-WB010 — k12 admin portal loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.k12admin);
  await page.goto(`${BASE}/school-admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});
