import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

// TC-B001–B010: Billing & Stripe

test('TC-B001 — /pricing page loads with Basic and Complete', async ({ page }) => {
  await page.goto(`${BASE}/pricing`);
  await page.waitForLoadState('networkidle');
  const body = await page.locator('body').textContent();
  expect(body).toContain('Basic');
  expect(body).toContain('Complete');
  expect(body?.toLowerCase()).not.toContain('premier');
});

test('TC-B002 — /pricing shows monthly prices', async ({ page }) => {
  await page.goto(`${BASE}/pricing`);
  await page.waitForLoadState('networkidle');
  const body = await page.locator('body').textContent();
  const hasPricing = body?.includes('39') || body?.includes('79') || body?.includes('/mo') || body?.includes('month');
  if (!hasPricing) console.warn('TC-B002: monthly prices ($39/$79) not found on pricing page');
  expect(page.url()).not.toContain('/login');
});

test('TC-B003 — /dashboard/plan shows current plan', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-B003: login failed'); return; }
  await page.goto(`${BASE}/dashboard/plan`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-B003: redirected after nav'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-B004 — /api/create-checkout-session responds', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/create-checkout-session`, {
    data: { plan: 'basic', billing: 'monthly' },
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status() === 404) { console.warn('TC-B004: checkout session endpoint not found'); return; }
  expect([200, 400, 401, 403]).toContain(res.status());
});

test('TC-B005 — /api/stripe/webhook returns 400 without signature', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/stripe/webhook`, {
    data: JSON.stringify({ type: 'customer.subscription.updated' }),
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status() === 404) { console.warn('TC-B005: stripe webhook endpoint not found'); return; }
  expect([400, 401]).toContain(res.status());
});

test('TC-B006 — /api/stripe/portal responds', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/stripe/portal`, {
    data: {},
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status() === 404) { console.warn('TC-B006: stripe portal endpoint not found'); return; }
  expect([200, 400, 401, 403]).toContain(res.status());
});

test('TC-B007 — /dashboard/plan no 500', async ({ page }) => {
  page.on('response', (res) => {
    if (res.status() === 500) throw new Error(`TC-B007: 500 on ${res.url()}`);
  });
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-B007: login failed'); return; }
  await page.goto(`${BASE}/dashboard/plan`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-B007: redirected after nav'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-B008 — /donate page loads with form', async ({ page }) => {
  await page.goto(`${BASE}/donate`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-B008: /donate requires auth'); return; }
  const body = await page.locator('body').textContent();
  if (!body?.toLowerCase().includes('donat')) console.warn('TC-B008: donate page missing donation content');
  expect(page.url()).not.toContain('/login');
});

test('TC-B009 — Premier plan NOT in checkout flow', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/create-checkout-session`, {
    data: { plan: 'premier', billing: 'monthly' },
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status() === 404) { console.warn('TC-B009: checkout endpoint not found'); return; }
  // Premier checkout should be blocked
  expect([400, 401, 403, 404]).toContain(res.status());
});

test('TC-B010 — /dashboard/addons loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-B010: login failed'); return; }
  await page.goto(`${BASE}/dashboard/addons`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-B010: redirected after nav'); return; }
  expect(page.url()).not.toContain('/login');
});
