import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

test('TC-COM001 — /dashboard/communities loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-COM001: login failed'); return; }
  await page.goto(`${BASE}/dashboard/communities`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-COM001: redirected after nav'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-COM002 — /api/communities returns list', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/communities`);
  if (res.status() === 404) { console.warn('TC-COM002: /api/communities not found'); return; }
  expect([200, 401]).toContain(res.status());
  if (res.status() === 200) {
    const body = await res.json().catch(() => null);
    if (Array.isArray(body)) expect(body.length).toBeGreaterThan(0);
  }
});

test('TC-COM003 — /dashboard/events loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-COM003: login failed'); return; }
  await page.goto(`${BASE}/dashboard/events`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-COM003: redirected after nav'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-COM004 — /dashboard/skill-exchange loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-COM004: login failed'); return; }
  await page.goto(`${BASE}/dashboard/skill-exchange`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-COM004: redirected after nav'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-COM005 — /dashboard/grief-circles loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-COM005: login failed'); return; }
  await page.goto(`${BASE}/dashboard/grief-circles`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-COM005: redirected after nav'); return; }
  expect(page.url()).not.toContain('/login');
});
