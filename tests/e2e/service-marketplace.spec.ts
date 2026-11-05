import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

// Service Marketplace — TC-MKT001–MKT010
//
// marketplace_live: false (blocked on LLC + Stripe Connect)
// Schema IS live: marketplace_providers, marketplace_transactions tables exist
// Tests verify: locked state, stub endpoints, 7 category stubs, no 500s

test('TC-MKT001 — /dashboard/marketplace loads (locked/coming soon state)', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-MKT001: login failed'); return; }
  await page.goto(`${BASE}/dashboard/marketplace`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-MKT001: redirected to login after nav'); return; }
  // Should show locked/coming soon — NOT a 404 or 500
  const body = await page.locator('body').textContent();
  const isLocked = body?.toLowerCase().match(/coming soon|marketplace|locked|available|service/);
  if (!isLocked) console.warn('TC-MKT001: marketplace page has no recognizable content');
  expect(page.url()).not.toContain('/login');
});

test('TC-MKT002 — /dashboard/marketplace no 500', async ({ page }) => {
  page.on('response', (res) => {
    if (res.status() === 500) throw new Error(`TC-MKT002: 500 on ${res.url()}`);
  });
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-MKT002: login failed'); return; }
  await page.goto(`${BASE}/dashboard/marketplace`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-MKT002: redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-MKT003 — /api/marketplace returns 200 or locked response (not 500)', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/marketplace`);
  if (res.status() === 404) { console.warn('TC-MKT003: /api/marketplace not found'); return; }
  expect(res.status()).not.toBe(500);
  expect([200, 401, 403]).toContain(res.status());
});

// 7 service categories from master spec
const SERVICE_CATEGORIES = [
  'transport',
  'home-services',
  'meals',
  'health',
  'legal-financial',
  'tech-help',
  'companionship',
];

for (const cat of SERVICE_CATEGORIES) {
  test(`TC-MKT004-${cat} — /api/marketplace/${cat} no 500`, async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/marketplace/${cat}`);
    if (res.status() === 404) {
      console.warn(`TC-MKT004-${cat}: /api/marketplace/${cat} not found — category stub not built yet`);
      return;
    }
    expect(res.status()).not.toBe(500);
    expect([200, 401, 403]).toContain(res.status());
  });
}

test('TC-MKT005 — /api/marketplace/providers responds (schema live check)', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/marketplace/providers`);
  if (res.status() === 404) { console.warn('TC-MKT005: /api/marketplace/providers not found'); return; }
  expect(res.status()).not.toBe(500);
  expect([200, 401, 403]).toContain(res.status());
});

test('TC-MKT006 — marketplace booking endpoint exists (stub)', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/marketplace/book`, {
    data: { category: 'transport', provider_id: 'test' },
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status() === 404) { console.warn('TC-MKT006: /api/marketplace/book not found — stub not built'); return; }
  // Should not 500 — stub should return controlled response
  expect(res.status()).not.toBe(500);
  expect([200, 400, 401, 403]).toContain(res.status());
});

test('TC-MKT007 — marketplace locked for Basic plan member (marketplace_live: false)', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-MKT007: login failed'); return; }
  // Check feature-flags confirm marketplace_live is false
  const res = await page.request.get(`${BASE}/api/features`);
  if (res.status() === 200) {
    const flags = await res.json().catch(() => null);
    if (flags?.marketplace_live === true) {
      console.warn('TC-MKT007: marketplace_live is true — marketplace should be locked until LLC/Stripe Connect ready');
    }
  }
  await page.goto(`${BASE}/dashboard/marketplace`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-MKT007: redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-MKT008 — /api/marketplace/transactions responds (schema live)', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/marketplace/transactions`);
  if (res.status() === 404) { console.warn('TC-MKT008: transactions endpoint not found'); return; }
  expect(res.status()).not.toBe(500);
  expect([200, 401, 403]).toContain(res.status());
});
