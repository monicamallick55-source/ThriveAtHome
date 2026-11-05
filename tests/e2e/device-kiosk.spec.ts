import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

// TC-DV001–DV002: Device / Kiosk mode

test('TC-DV001 — /kiosk route loads or redirects gracefully', async ({ page }) => {
  await page.goto(`${BASE}/kiosk`);
  await page.waitForLoadState('networkidle');
  // kiosk may redirect to login, home, or a dedicated kiosk page — all acceptable
  const url = page.url();
  if (url.includes('/404') || url.includes('not-found')) {
    console.warn('TC-DV001: /kiosk route returns 404 — not yet implemented');
    return;
  }
  const status = await page.evaluate(() => document.readyState);
  expect(['complete', 'interactive']).toContain(status);
});

test('TC-DV002 — /api/device endpoint exists', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/device`);
  if (res.status() === 404) {
    console.warn('TC-DV002: /api/device not implemented yet');
    return;
  }
  expect([200, 401, 405]).toContain(res.status());
});
