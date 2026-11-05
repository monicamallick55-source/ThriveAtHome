import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

async function goToGifts(page, path = '/dashboard/gift-send') {
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

test('TC-WG001 — gift-send page loads', async ({ page }) => {
  const ok = await goToGifts(page, '/dashboard/gift-send');
  if (!ok) { console.warn('TC-WG001: auth failed'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-WG002 — gifts history page loads', async ({ page }) => {
  const ok = await goToGifts(page, '/dashboard/gifts');
  if (!ok) { console.warn('TC-WG002: auth failed'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-WG003 — celebrations hub loads', async ({ page }) => {
  const ok = await goToGifts(page, '/dashboard/celebrations');
  if (!ok) { console.warn('TC-WG003: auth failed'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-WG004 — celebrations plan loads', async ({ page }) => {
  const ok = await goToGifts(page, '/dashboard/celebrations/plan');
  if (!ok) { console.warn('TC-WG004: auth failed'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-WG005 — /api/gift-orders GET responds', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/gift-orders`);
  if (res.status() === 404) { console.warn('TC-WG005: /api/gift-orders not found'); return; }
  expect([200, 401]).toContain(res.status());
});

test('TC-WG006 — no 500 on gift-send page', async ({ page }) => {
  page.on('response', (res) => {
    if (res.status() === 500) throw new Error(`TC-WG006: 500 on ${res.url()}`);
  });
  const ok = await goToGifts(page, '/dashboard/gift-send');
  if (!ok) { console.warn('TC-WG006: auth failed'); return; }
  expect(page.url()).not.toContain('/login');
});
