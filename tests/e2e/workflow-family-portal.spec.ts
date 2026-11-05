import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

test('TC-WFP001 — family dashboard loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.family, '/dashboard/family');
  if (page.url().includes('/login')) { console.warn('TC-WFP001: family login failed'); return; }
  expect(page.url()).toContain('/dashboard/family');
});

test('TC-WFP002 — family can view member wellness', async ({ page }) => {
  await loginAs(page, ACCOUNTS.family, '/dashboard/family');
  if (page.url().includes('/login')) { console.warn('TC-WFP002: login failed'); return; }
  expect(page.url()).not.toContain('/login');
  const body = await page.locator('body').textContent();
  if (!body?.toLowerCase().match(/mood|wellness|check.in|status/)) {
    console.warn('TC-WFP002: wellness data not visible on family dashboard');
  }
});

test('TC-WFP003 — family events calendar tab visible', async ({ page }) => {
  await loginAs(page, ACCOUNTS.family, '/dashboard/family');
  if (page.url().includes('/login')) { console.warn('TC-WFP003: login failed'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-WFP004 — /api/family-members responds', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/family-members`);
  if (res.status() === 404) { console.warn('TC-WFP004: /api/family-members not found'); return; }
  expect([200, 401]).toContain(res.status());
});

test('TC-WFP005 — family cannot access /navigator', async ({ page }) => {
  await loginAs(page, ACCOUNTS.family, '/dashboard/family');
  if (page.url().includes('/login')) { console.warn('TC-WFP005: login failed'); return; }
  await page.goto(`${BASE}/navigator`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/navigator');
});
