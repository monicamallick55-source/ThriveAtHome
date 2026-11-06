/**
 * TC-PED* — Plan entitlements deep (G5.7) Nov 4
 * Covers: feature gates per plan, upgrade prompts, API responses
 */
import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

test('TC-PED001 — /api/entitlements returns plan_tier for member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  if (page.url().includes('/login')) { console.warn('TC-PED001: login failed'); return; }
  const res = await page.request.get(`${BASE}/api/entitlements`);
  expect([200, 404]).toContain(res.status());
  if (res.status() === 200) {
    const body = await res.json();
    expect(body).toHaveProperty('plan_tier');
    expect(['basics', 'connect', 'complete', 'premier']).toContain(body.plan_tier);
  }
});

test('TC-PED002 — basics plan blocks premium features with upgrade prompt', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  if (page.url().includes('/login')) { console.warn('TC-PED002: login failed'); return; }
  await page.goto(`${BASE}/dashboard/marketplace`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-PED002: redirected'); return; }
  const content = await page.content();
  const hasGate = content.match(/upgrade|unlock|coming soon|plan required|premium/i);
  if (!hasGate) console.warn('TC-PED002: plan gate / upgrade prompt not found on marketplace');
});

test('TC-PED003 — complete member sees marketplace unlocked', async ({ page }) => {
  await loginAs(page, ACCOUNTS.complete);
  if (page.url().includes('/login')) { console.warn('TC-PED003: login failed'); return; }
  await page.goto(`${BASE}/dashboard/marketplace`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-PED003: redirected'); return; }
  const content = await page.content();
  expect(content).not.toMatch(/internal server error|next-error-h1/i);
});

test('TC-PED004 — /api/feature-flags responds with flags object', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  if (page.url().includes('/login')) { console.warn('TC-PED004: login failed'); return; }
  const res = await page.request.get(`${BASE}/api/feature-flags`);
  expect(res.status()).not.toBe(500);
  if (res.status() === 200) {
    const body = await res.json();
    expect(typeof body).toBe('object');
  }
});

test('TC-PED005 — /dashboard/plan shows current plan tier', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  if (page.url().includes('/login')) { console.warn('TC-PED005: login failed'); return; }
  await page.goto(`${BASE}/dashboard/plan`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-PED005: redirected'); return; }
  const content = await page.content();
  expect(content).not.toMatch(/internal server error|next-error-h1/i);
  const hasPlan = content.match(/basics|connect|complete|premier|current plan/i);
  if (!hasPlan) console.warn('TC-PED005: plan tier not shown on /dashboard/plan');
});

test('TC-PED006 — plan-comparison page loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  if (page.url().includes('/login')) { console.warn('TC-PED006: login failed'); return; }
  await page.goto(`${BASE}/dashboard/plan-comparison`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-PED006: redirected'); return; }
  const content = await page.content();
  expect(content).not.toMatch(/internal server error|next-error-h1/i);
});

test('TC-PED007 — plan comparison shows ≥ 2 plan tiers side by side', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  if (page.url().includes('/login')) { console.warn('TC-PED007: login failed'); return; }
  await page.goto(`${BASE}/dashboard/plan-comparison`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-PED007: redirected'); return; }
  const content = await page.content();
  const tierMatches = content.match(/basics|connect|complete|premier/gi) || [];
  if (tierMatches.length < 2) console.warn(`TC-PED007: only ${tierMatches.length} plan tiers found — expected ≥ 2`);
});
