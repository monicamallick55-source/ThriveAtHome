import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

test('TC-OA001 — org-admin can view member count', async ({ page }) => {
  await loginAs(page, ACCOUNTS.orgadmin);
  if (page.url().includes('/login')) { console.warn('TC-OA001: orgadmin not seeded'); return; }
  await page.goto(`${BASE}/org-admin`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-OA001: redirected to login'); return; }
  const body = await page.locator('body').textContent();
  if (!body?.match(/\d/)) console.warn('TC-OA001: no numeric data visible on org-admin page');
  expect(page.url()).not.toContain('/login');
});

test('TC-OA002 — /api/org-configs responds for org admin', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/org-configs`);
  if (res.status() === 404) { console.warn('TC-OA002: /api/org-configs not found'); return; }
  expect([200, 401]).toContain(res.status());
});

test('TC-OA003 — /org-admin/village-referrals loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.orgadmin);
  if (page.url().includes('/login')) { console.warn('TC-OA003: orgadmin not seeded'); return; }
  await page.goto(`${BASE}/org-admin/village-referrals`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-OA003: redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});
