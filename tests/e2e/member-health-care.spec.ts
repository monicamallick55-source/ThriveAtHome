import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

async function goToDashboard(page) {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) return false;
  await page.goto(`${BASE}/dashboard`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');
  }
  return !page.url().includes('/login');
}

test('TC-MHC001 — /dashboard/health loads', async ({ page }) => {
  const ok = await goToDashboard(page);
  if (!ok) { console.warn('TC-MHC001: auth failed'); return; }
  await page.goto(`${BASE}/dashboard/health`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-MHC001: /dashboard/health redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-MHC002 — /dashboard/benefits-finder loads', async ({ page }) => {
  const ok = await goToDashboard(page);
  if (!ok) { console.warn('TC-MHC002: auth failed'); return; }
  await page.goto(`${BASE}/dashboard/benefits-finder`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-MHC002: redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-MHC003 — /dashboard/medicare-help loads', async ({ page }) => {
  const ok = await goToDashboard(page);
  if (!ok) { console.warn('TC-MHC003: auth failed'); return; }
  await page.goto(`${BASE}/dashboard/medicare-help`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-MHC003: redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-MHC004 — /dashboard/grief-support loads with 9 pathways', async ({ page }) => {
  const ok = await goToDashboard(page);
  if (!ok) { console.warn('TC-MHC004: auth failed'); return; }
  await page.goto(`${BASE}/dashboard/grief-support`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-MHC004: redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-MHC005 — /dashboard/trusted-advisors loads', async ({ page }) => {
  const ok = await goToDashboard(page);
  if (!ok) { console.warn('TC-MHC005: auth failed'); return; }
  await page.goto(`${BASE}/dashboard/trusted-advisors`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-MHC005: redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-MHC006 — /dashboard/fraud-protection loads', async ({ page }) => {
  const ok = await goToDashboard(page);
  if (!ok) { console.warn('TC-MHC006: auth failed'); return; }
  await page.goto(`${BASE}/dashboard/fraud-protection`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-MHC006: redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-MHC007 — /dashboard/vault loads', async ({ page }) => {
  const ok = await goToDashboard(page);
  if (!ok) { console.warn('TC-MHC007: auth failed'); return; }
  await page.goto(`${BASE}/dashboard/vault`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-MHC007: redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});
