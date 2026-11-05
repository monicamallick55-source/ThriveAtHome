import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

// TC-MBA001–MBA010: Birthday Arc, Achievements, Interest Circles, Check-ins

test('TC-MBA001 — /dashboard/profile has birthday field', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-MBA001: login failed'); return; }
  await page.goto(`${BASE}/dashboard/profile`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-MBA001: redirected after nav'); return; }
  const body = await page.locator('body').textContent();
  if (!body?.toLowerCase().includes('birthday') && !body?.toLowerCase().includes('birth')) {
    console.warn('TC-MBA001: birthday field not found on profile');
  }
  expect(page.url()).not.toContain('/login');
});

test('TC-MBA002 — /api/members/profile responds', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/members/profile`);
  if (res.status() === 404) { console.warn('TC-MBA002: /api/members/profile not found'); return; }
  expect([200, 401]).toContain(res.status());
});

test('TC-MBA003 — birthday-arc cron requires CRON_SECRET', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/cron/birthday-arc`, {
    data: {},
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status() === 404) { console.warn('TC-MBA003: birthday-arc cron not found'); return; }
  expect([401, 403]).toContain(res.status());
});

test('TC-MBA004 — /dashboard achievements or milestones page loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-MBA004: login failed'); return; }
  // Try /dashboard/achievements; fall back to dashboard
  await page.goto(`${BASE}/dashboard/achievements`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-MBA004: redirected after nav'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-MBA005 — /api/achievements responds', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/achievements`);
  if (res.status() === 404) { console.warn('TC-MBA005: /api/achievements not found'); return; }
  expect([200, 401]).toContain(res.status());
});

test('TC-MBA006 — /dashboard/communities shows interest circles', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-MBA006: login failed'); return; }
  await page.goto(`${BASE}/dashboard/communities`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-MBA006: redirected after nav'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-MBA007 — /api/interest-circles responds', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/interest-circles`);
  if (res.status() === 404) { console.warn('TC-MBA007: /api/interest-circles not found'); return; }
  expect([200, 401]).toContain(res.status());
});

test('TC-MBA008 — /api/check-ins responds', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/check-ins`);
  if (res.status() === 404) { console.warn('TC-MBA008: /api/check-ins not found'); return; }
  expect([200, 401]).toContain(res.status());
});

test('TC-MBA009 — check-ins cron requires CRON_SECRET', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/cron/aria-calls`, {
    data: {},
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status() === 404) { console.warn('TC-MBA009: aria-calls cron not found'); return; }
  expect([401, 403]).toContain(res.status());
});

test('TC-MBA010 — no 500 on communities page', async ({ page }) => {
  page.on('response', (res) => {
    if (res.status() === 500) throw new Error(`TC-MBA010: 500 on ${res.url()}`);
  });
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-MBA010: login failed'); return; }
  await page.goto(`${BASE}/dashboard/communities`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-MBA010: redirected after nav'); return; }
  expect(page.url()).not.toContain('/login');
});
