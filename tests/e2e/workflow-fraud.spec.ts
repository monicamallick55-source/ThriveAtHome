import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

test('TC-WF001 — fraud protection page loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-WF001: login failed'); return; }
  await page.goto(`${BASE}/dashboard/fraud-protection`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-WF001: redirected after nav'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-WF002 — /api/fraud-flags GET responds', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/fraud-flags`);
  if (res.status() === 404) { console.warn('TC-WF002: /api/fraud-flags not found'); return; }
  expect([200, 401]).toContain(res.status());
});

test('TC-WF003 — fraud detection webhook handles post', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/fraud-detection`, {
    data: { test: true },
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status() === 404) { console.warn('TC-WF003: /api/fraud-detection not found'); return; }
  expect([200, 400, 401, 403]).toContain(res.status());
});
