import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

// TC-A005 Role Isolation — Cross-Role Access Blocked

test('TC-RAC001 — member cannot access /navigator', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  await page.goto(`${BASE}/navigator`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/navigator');
});

test('TC-RAC002 — volunteer cannot access /admin', async ({ page }) => {
  await loginAs(page, ACCOUNTS.volunteer, '/volunteer');
  await page.goto(`${BASE}/admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/admin');
});

test('TC-RAC003 — family cannot access /org-admin', async ({ page }) => {
  await loginAs(page, ACCOUNTS.family, '/dashboard/family');
  await page.goto(`${BASE}/org-admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/org-admin');
});

test('TC-RAC004 — member cannot access /employer-admin', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  await page.goto(`${BASE}/employer-admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/employer-admin');
});
