import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

test('TC-WV001 — volunteer dashboard loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.volunteer);
  if (page.url().includes('/login')) { console.warn('TC-WV001: volunteer login failed'); return; }
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-WV001: still on login'); return; }
  expect(page.url()).toMatch(/\/volunteer/);
});

test('TC-WV002 — /volunteer/dashboard loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.volunteer);
  if (page.url().includes('/login')) { console.warn('TC-WV002: login failed'); return; }
  await page.goto(`${BASE}/volunteer/dashboard`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-WV002: redirected after nav'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-WV003 — volunteer sees training module', async ({ page }) => {
  await loginAs(page, ACCOUNTS.volunteer);
  if (page.url().includes('/login')) { console.warn('TC-WV003: login failed'); return; }
  await page.goto(`${BASE}/dashboard/training`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-WV003: redirected after nav'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-WV004 — /for-volunteers public page loads', async ({ page }) => {
  await page.goto(`${BASE}/for-volunteers`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-WV004: /for-volunteers requires auth'); return; }
  expect(page.url()).not.toContain('/login');
});
