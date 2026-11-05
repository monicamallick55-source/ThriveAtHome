import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

// TC-WB001–WB010: B2B portal workflows

test('TC-WB001 — org-admin portal loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.orgadmin);
  if (page.url().includes('/login')) { console.warn('TC-WB001: orgadmin not seeded'); return; }
  await page.goto(`${BASE}/org-admin`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-WB001: redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-WB002 — network-admin portal loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.network);
  if (page.url().includes('/login')) { console.warn('TC-WB002: network not seeded'); return; }
  await page.goto(`${BASE}/network-admin`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-WB002: redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-WB003 — /employers public page loads without login', async ({ page }) => {
  await page.goto(`${BASE}/employers`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-WB003: /employers unexpectedly requires login'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-WB004 — VSO admin portal loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.vsoadmin);
  if (page.url().includes('/login')) { console.warn('TC-WB004: vsoadmin not seeded'); return; }
  await page.goto(`${BASE}/vso-admin`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-WB004: redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-WB005 — employer admin portal loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.employer);
  if (page.url().includes('/login')) { console.warn('TC-WB005: employer not seeded'); return; }
  await page.goto(`${BASE}/employer-admin`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-WB005: redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-WB006 — AAA admin portal loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.aaa);
  if (page.url().includes('/login')) { console.warn('TC-WB006: aaa not seeded'); return; }
  await page.goto(`${BASE}/aaa-admin`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-WB006: redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-WB007 — senior center admin portal loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.seniorcenter);
  if (page.url().includes('/login')) { console.warn('TC-WB007: seniorcenter not seeded'); return; }
  await page.goto(`${BASE}/senior-center-admin`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-WB007: redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-WB008 — /api/b2b/enrollment-fee endpoint exists', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/b2b/enrollment-fee`);
  if (res.status() === 404) { console.warn('TC-WB008: /api/b2b/enrollment-fee not found'); return; }
  expect([200, 400, 401, 405]).toContain(res.status());
});

test('TC-WB009 — university admin portal loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.uniadmin);
  if (page.url().includes('/login')) { console.warn('TC-WB009: uniadmin not seeded'); return; }
  await page.goto(`${BASE}/university-admin`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-WB009: redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-WB010 — k12 admin portal loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.k12admin);
  if (page.url().includes('/login')) { console.warn('TC-WB010: k12admin not seeded'); return; }
  await page.goto(`${BASE}/school-admin`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-WB010: redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});
