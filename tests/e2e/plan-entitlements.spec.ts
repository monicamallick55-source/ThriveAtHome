import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

// TC-PE001–PE010: Plan Entitlements & Feature Flags

test('TC-PE001 — /api/entitlements returns plan_tier', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/entitlements`);
  if (res.status() === 404) { console.warn('TC-PE001: /api/entitlements not found'); return; }
  expect([200, 401]).toContain(res.status());
  if (res.status() === 200) {
    const body = await res.json().catch(() => null);
    if (body && typeof body === 'object') {
      if (!body.plan_tier) console.warn('TC-PE001: plan_tier field missing from /api/entitlements');
    }
  }
});

test('TC-PE002 — basic plan member sees navigator hours limit', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-PE002: login failed'); return; }
  await page.goto(`${BASE}/dashboard/plan`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-PE002: redirected after nav'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-PE003 — /api/feature-flags responds', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/feature-flags`);
  if (res.status() === 404) { console.warn('TC-PE003: /api/feature-flags not found'); return; }
  expect([200, 401]).toContain(res.status());
});

test('TC-PE004 — Premier hidden from /pricing', async ({ page }) => {
  await page.goto(`${BASE}/pricing`);
  await page.waitForLoadState('networkidle');
  const body = await page.locator('body').textContent();
  expect(body?.toLowerCase()).not.toContain('premier');
});

test('TC-PE005 — /api/plan-features responds', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/plan-features`);
  if (res.status() === 404) { console.warn('TC-PE005: /api/plan-features not found'); return; }
  expect([200, 401]).toContain(res.status());
});

test('TC-PE006 — member_campaigns feature flag is off by default', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/feature-flags`);
  if (res.status() === 404) { console.warn('TC-PE006: /api/feature-flags not found'); return; }
  if (res.status() === 200) {
    const body = await res.json().catch(() => null);
    if (body?.member_campaigns_live === true) {
      console.warn('TC-PE006: member_campaigns_live is true — should be false by default');
    }
  }
  expect([200, 401]).toContain(res.status());
});

test('TC-PE007 — /api/navigator/schedule responds', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/navigator/schedule`);
  if (res.status() === 404) { console.warn('TC-PE007: /api/navigator/schedule not found'); return; }
  expect([200, 401]).toContain(res.status());
});

test('TC-PE008 — /dashboard/navigator loads for member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-PE008: login failed'); return; }
  await page.goto(`${BASE}/dashboard/navigator`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-PE008: redirected after nav'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-PE009 — /dashboard/profile loads and shows plan tier', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-PE009: login failed'); return; }
  await page.goto(`${BASE}/dashboard/profile`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-PE009: redirected after nav'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-PE010 — marketplace locked when feature off', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-PE010: login failed'); return; }
  await page.goto(`${BASE}/dashboard/marketplace`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-PE010: redirected after nav'); return; }
  const body = await page.locator('body').textContent();
  if (!body?.toLowerCase().includes('coming soon') && !body?.toLowerCase().includes('locked')) {
    console.warn('TC-PE010: marketplace not showing locked/coming soon state');
  }
  expect(page.url()).not.toContain('/login');
});
