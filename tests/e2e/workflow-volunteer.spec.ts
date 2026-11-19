import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

test('TC-WV001 — volunteer dashboard loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.volunteer);
  await page.waitForLoadState('networkidle');
  expect(page.url()).toMatch(/\/volunteer/);
});

test('TC-WV002 — /volunteer/dashboard loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.volunteer);
  await page.goto(`${BASE}/volunteer/dashboard`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-WV003 — volunteer sees training module', async ({ page }) => {
  await loginAs(page, ACCOUNTS.volunteer);
  await page.goto(`${BASE}/dashboard/training`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-WV004 — /for-volunteers public page loads', async ({ page }) => {
  await page.goto(`${BASE}/for-volunteers`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});
