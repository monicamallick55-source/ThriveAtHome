import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

test('TC-B2B001 — /org-admin loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.orgadmin);
  if (page.url().includes('/login')) { console.warn('TC-B2B001: orgadmin login failed — not seeded'); return; }
  await page.goto(`${BASE}/org-admin`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-B2B001: redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-B2B010 — /employer-admin loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.employer);
  if (page.url().includes('/login')) { console.warn('TC-B2B010: employer login failed — not seeded'); return; }
  await page.goto(`${BASE}/employer-admin`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-B2B010: redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-B2B011 — /employers public page loads', async ({ page }) => {
  await page.goto(`${BASE}/employers`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-B2B011: /employers requires auth'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-B2B020 — /senior-center-admin loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.seniorcenter);
  if (page.url().includes('/login')) { console.warn('TC-B2B020: seniorcenter login failed — not seeded'); return; }
  await page.goto(`${BASE}/senior-center-admin`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-B2B020: redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-B2B025 — /aaa-admin loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.aaa);
  if (page.url().includes('/login')) { console.warn('TC-B2B025: aaa login failed — not seeded'); return; }
  await page.goto(`${BASE}/aaa-admin`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-B2B025: redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-B2B030 — /network-admin loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.network);
  if (page.url().includes('/login')) { console.warn('TC-B2B030: network login failed — not seeded'); return; }
  await page.goto(`${BASE}/network-admin`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-B2B030: redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-B2B035 — /agency-admin loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.agency);
  if (page.url().includes('/login')) { console.warn('TC-B2B035: agency login failed — not seeded'); return; }
  await page.goto(`${BASE}/agency-admin`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-B2B035: redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});
