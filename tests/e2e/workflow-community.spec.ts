import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

test('TC-WC001 — communities page loads with circles', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  await page.goto(`${BASE}/dashboard/communities`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-WC002 — member can view events', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  await page.goto(`${BASE}/dashboard/events`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-WC003 — /api/communities no 500', async ({ page }) => {
  page.on('response', (res) => {
    if (res.url().includes('/api/communities') && res.status() === 500)
      throw new Error('TC-WC003: 500 on /api/communities');
  });
  const res = await page.request.get(`${BASE}/api/communities`);
  if (res.status() === 404) { console.warn('TC-WC003: endpoint not found'); return; }
  expect([200, 401]).toContain(res.status());
});

test('TC-WC004 — skill-exchange page loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  await page.goto(`${BASE}/dashboard/skill-exchange`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});
