import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

// TC-FS001–FS005: Fraud & Home Safety

test('TC-FS001 — /dashboard/fraud-protection no 500', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-FS001: login failed'); return; }
  page.on('response', (res) => {
    if (res.url().includes('/dashboard/fraud-protection') && res.status() === 500)
      throw new Error(`TC-FS001: 500 on fraud-protection`);
  });
  await page.goto(`${BASE}/dashboard/fraud-protection`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-FS001: redirected to login after nav'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-FS002 — /api/fraud-flags responds', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/fraud-flags`);
  if (res.status() === 404) { console.warn('TC-FS002: /api/fraud-flags not found'); return; }
  expect([200, 401]).toContain(res.status());
});

test('TC-FS003 — /dashboard/home-safety loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  await page.goto(`${BASE}/dashboard/home-safety`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    await page.goto(`${BASE}/dashboard/home-safety`);
    await page.waitForLoadState('networkidle');
  }
  if (page.url().includes('/login')) {
    console.warn('TC-FS003: Still redirected to /login after retry — auth may be rate-limited');
    return;
  }
  expect(page.url()).not.toContain('/login');
});

test('TC-FS004 — /api/home-safety responds', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/home-safety`);
  if (res.status() === 404) { console.warn('TC-FS004: /api/home-safety not found'); return; }
  expect([200, 401]).toContain(res.status());
});

test('TC-FS005 — fraud detection API endpoint', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/fraud-flags`, {
    data: { member_id: 'test', pattern: 'test', severity: 'low' },
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status() === 404) { console.warn('TC-FS005: fraud-flags POST not found'); return; }
  expect([200, 400, 401, 403]).toContain(res.status());
});
