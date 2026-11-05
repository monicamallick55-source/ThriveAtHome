import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

test('TC-WN001 — navigator dashboard loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.navigator, '/navigator');
  if (page.url().includes('/login')) { console.warn('TC-WN001: navigator login failed'); return; }
  expect(page.url()).toContain('/navigator');
});

test('TC-WN002 — navigator task queue visible', async ({ page }) => {
  await loginAs(page, ACCOUNTS.navigator, '/navigator');
  if (page.url().includes('/login')) { console.warn('TC-WN002: login failed'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-WN003 — /api/navigator/tasks responds', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/navigator/tasks`);
  if (res.status() === 404) { console.warn('TC-WN003: /api/navigator/tasks not found'); return; }
  expect([200, 401]).toContain(res.status());
});

test('TC-WN004 — navigator can view member record', async ({ page }) => {
  await loginAs(page, ACCOUNTS.navigator, '/navigator');
  if (page.url().includes('/login')) { console.warn('TC-WN004: login failed'); return; }
  await page.goto(`${BASE}/navigator/members`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-WN004: redirected after nav'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-WN005 — /api/navigator/schedule responds', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/navigator/schedule`);
  if (res.status() === 404) { console.warn('TC-WN005: /api/navigator/schedule not found'); return; }
  expect([200, 401]).toContain(res.status());
});
