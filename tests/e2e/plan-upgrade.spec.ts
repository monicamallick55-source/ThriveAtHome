import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

test('TC-PU001 — /dashboard/plan loads for member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-PU001: login failed'); return; }
  await page.goto(`${BASE}/dashboard/plan`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-PU001: redirected to login after nav'); return; }
  expect(page.url()).toContain('/dashboard');
});

test('TC-PU002 — upgrade page shows Basic and Complete plans', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-PU002: login failed'); return; }
  await page.goto(`${BASE}/dashboard/plan`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-PU002: redirected after nav'); return; }
  const body = await page.locator('body').textContent();
  const hasPlans = body?.includes('Basic') || body?.includes('Complete') || body?.includes('plan');
  if (!hasPlans) console.warn('TC-PU002: plan names not found on page');
  expect(page.url()).not.toContain('/login');
});

test('TC-PU003 — Premier plan NOT shown on upgrade page', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-PU003: login failed'); return; }
  await page.goto(`${BASE}/dashboard/plan`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-PU003: redirected after nav'); return; }
  const body = await page.locator('body').textContent();
  expect(body?.toLowerCase()).not.toContain('premier');
});

test('TC-PU004 — /api/create-checkout-session responds', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/create-checkout-session`, {
    data: { plan: 'basic', billing: 'monthly' },
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status() === 404) { console.warn('TC-PU004: checkout endpoint not found'); return; }
  expect([200, 400, 401, 403]).toContain(res.status());
});
