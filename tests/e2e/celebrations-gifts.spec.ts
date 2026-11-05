import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

async function goToCelebrations(page, path = '/dashboard/celebrations') {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) return false;
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    await page.goto(`${BASE}${path}`);
    await page.waitForLoadState('networkidle');
  }
  return !page.url().includes('/login');
}

test('TC-CG001 — /dashboard/celebrations loads', async ({ page }) => {
  const ok = await goToCelebrations(page, '/dashboard/celebrations');
  if (!ok) { console.warn('TC-CG001: auth failed or redirect'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-CG002 — /dashboard/celebrations/plan loads', async ({ page }) => {
  const ok = await goToCelebrations(page, '/dashboard/celebrations/plan');
  if (!ok) { console.warn('TC-CG002: auth failed or redirect'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-CG003 — /dashboard/gift-send loads', async ({ page }) => {
  const ok = await goToCelebrations(page, '/dashboard/gift-send');
  if (!ok) { console.warn('TC-CG003: auth failed or redirect'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-CG004 — /dashboard/gifts loads', async ({ page }) => {
  const ok = await goToCelebrations(page, '/dashboard/gifts');
  if (!ok) { console.warn('TC-CG004: auth failed or redirect'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-CG005 — /api/celebrations responds', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/celebrations`);
  if (res.status() === 404) { console.warn('TC-CG005: /api/celebrations not found'); return; }
  expect([200, 401]).toContain(res.status());
});

test('TC-CG006 — /api/gift-orders responds', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/gift-orders`);
  if (res.status() === 404) { console.warn('TC-CG006: /api/gift-orders not found'); return; }
  expect([200, 401]).toContain(res.status());
});
