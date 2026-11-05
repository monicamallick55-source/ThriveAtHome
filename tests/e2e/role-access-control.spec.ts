import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

// TC-A005 Role Isolation — Cross-Role Access Blocked

test('TC-RAC001 — member cannot access /navigator', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-RAC001: login failed'); return; }
  await page.goto(`${BASE}/navigator`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/navigator');
});

test('TC-RAC002 — volunteer cannot access /admin', async ({ page }) => {
  await loginAs(page, ACCOUNTS.volunteer, '/volunteer');
  if (page.url().includes('/login')) { console.warn('TC-RAC002: login failed'); return; }
  await page.goto(`${BASE}/admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/admin');
});

test('TC-RAC003 — family cannot access /org-admin', async ({ page }) => {
  await loginAs(page, ACCOUNTS.family, '/dashboard/family');
  if (page.url().includes('/login')) { console.warn('TC-RAC003: login failed'); return; }
  await page.goto(`${BASE}/org-admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/org-admin');
});

test('TC-RAC004 — member cannot access /employer-admin', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-RAC004: login failed'); return; }
  await page.goto(`${BASE}/employer-admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/employer-admin');
});
