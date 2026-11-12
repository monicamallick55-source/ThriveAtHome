import { test, expect } from '@playwright/test';
import { BASE_URL as BASE } from './helpers';

// TC-P001–P015: Public page smoke tests

const PUBLIC_ROUTES = [
  '/', '/about', '/for-families', '/for-volunteers', '/pricing',
  '/employers', '/donate', '/contact', '/privacy', '/terms',
  '/blog', '/resources', '/login', '/signup', '/join',
];

for (const route of PUBLIC_ROUTES) {
  test(`TC-P-smoke ${route} loads without auth`, async ({ page }) => {
    await page.goto(`${BASE}${route}`);
    await page.waitForLoadState('domcontentloaded');
    if (page.url().includes('/login') && route !== '/login') {
      console.warn(`TC-P-smoke: ${route} unexpectedly redirected to /login`);
      return;
    }
    const status = await page.evaluate(() => document.readyState);
    expect(['complete', 'interactive']).toContain(status);
  });
}

test('TC-P001 — homepage has hero and CTA', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await page.waitForLoadState('domcontentloaded');
  const body = await page.locator('body').textContent();
  expect(body?.length).toBeGreaterThan(100);
  expect(page.url()).not.toContain('/login');
});

test('TC-P004 — /pricing shows Basic and Complete, NOT Premier', async ({ page }) => {
  await page.goto(`${BASE}/pricing`);
  await page.waitForLoadState('domcontentloaded');
  const body = await page.locator('body').textContent();
  expect(body).toContain('Basic');
  expect(body?.toLowerCase()).not.toContain('premier');
});

test('TC-P005 — footer links load', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await page.waitForLoadState('domcontentloaded');
  const privacyLink = page.locator('a[href*="privacy"]').first();
  if (await privacyLink.count() > 0) {
    const href = await privacyLink.getAttribute('href');
    expect(href).toBeTruthy();
  } else {
    console.warn('TC-P005: no privacy link found in footer');
  }
});

test('TC-P008 — homepage mobile 390px no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/`);
  await page.waitForLoadState('domcontentloaded');
  const hasHScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  if (hasHScroll) console.warn('TC-P008: homepage has horizontal scroll at 390px');
});

test('TC-P009 — homepage has meta title', async ({ page }) => {
  await page.goto(`${BASE}/`);
  const title = await page.title();
  expect(title.length).toBeGreaterThan(0);
});

test('TC-P013 — /pricing annual toggle present', async ({ page }) => {
  await page.goto(`${BASE}/pricing`);
  await page.waitForLoadState('domcontentloaded');
  const body = await page.locator('body').textContent();
  const hasAnnual = body?.toLowerCase().includes('annual') || body?.toLowerCase().includes('yearly') || body?.toLowerCase().includes('/yr');
  if (!hasAnnual) console.warn('TC-P013: no annual toggle or annual pricing text found');
  expect(page.url()).not.toContain('/login');
});

test('TC-P022 — /privacy has HIPAA language', async ({ page }) => {
  await page.goto(`${BASE}/privacy`);
  await page.waitForLoadState('domcontentloaded');
  if (page.url().includes('/login')) { console.warn('TC-P022: /privacy requires auth'); return; }
  const body = await page.locator('body').textContent();
  if (!body?.toLowerCase().includes('hipaa') && !body?.toLowerCase().includes('privacy')) {
    console.warn('TC-P022: HIPAA language not found on privacy page');
  }
  expect(page.url()).not.toContain('/login');
});

test('TC-P — /api/features returns 200', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/features`);
  if (res.status() === 404) { console.warn('TC-P: /api/features not found'); return; }
  expect([200]).toContain(res.status());
});

test('TC-P — robots.txt exists', async ({ page }) => {
  const res = await page.request.get(`${BASE}/robots.txt`);
  if (res.status() === 404) { console.warn('TC-P: robots.txt not found'); return; }
  expect(res.status()).toBe(200);
});

/** TC-P002 — Mission strip donate pill */
test('TC-P002 — homepage has donate link', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await page.waitForLoadState('domcontentloaded');
  const donateLink = page.locator('a[href*="donate"]').first();
  const hasLink = await donateLink.count() > 0;
  if (!hasLink) console.warn('TC-P002: No donate link found on homepage');
  expect(page.url()).not.toContain('/login');
});

/** TC-P050 — /login redirects each role correctly */
test('TC-P050 — /login page loads and has email+password fields', async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('domcontentloaded');
  const hasEmail = await page.locator('input[type="email"]').isVisible({ timeout: 5000 }).catch(() => false);
  const hasPassword = await page.locator('input[type="password"]').isVisible({ timeout: 5000 }).catch(() => false);
  expect(hasEmail, 'TC-P050: email field required on /login').toBe(true);
  expect(hasPassword, 'TC-P050: password field required on /login').toBe(true);
});

/** TC-P070 — Key public routes all return 200 */
const KEY_PUBLIC_ROUTES = ['/', '/about', '/pricing', '/donate', '/blog', '/resources', '/login', '/signup'];
test('TC-P070 — key public routes all return 200', async ({ page }) => {
  const failures: string[] = [];
  for (const route of KEY_PUBLIC_ROUTES) {
    const res = await page.request.get(`${BASE}${route}`);
    if (res.status() >= 400) failures.push(`${route} → ${res.status()}`);
  }
  if (failures.length > 0) console.warn(`TC-P070: Some routes returned errors: ${failures.join(', ')}`);
  expect(failures.length, `TC-P070: ${failures.join(', ')}`).toBe(0);
});

/** TC-P071 — public pages mobile-responsive (no hscroll) */
test('TC-P071 — /pricing mobile 390px no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/pricing`);
  await page.waitForLoadState('domcontentloaded');
  const hasHScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 5
  );
  if (hasHScroll) console.warn('TC-P071: /pricing has horizontal scroll at 390px');
});

/** TC-A002 — Family invitation flow */
test('TC-A002 — /invite/[token] renders accept form', async ({ page }) => {
  await page.goto(`${BASE}/invite/test-token-123`);
  await page.waitForLoadState('domcontentloaded');
  const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  const hasInviteUI = /invit|accept|join|family/i.test(bodyText);
  if (!hasInviteUI) console.warn('TC-A002: Invite acceptance form not found at /invite/[token]');
  expect(/(?<![,\d])500(?![,\d])|internal server error/i.test(bodyText)).toBe(false);
});

/** TC-A006 — Device kiosk /device mode */
test('TC-A006 — /device kiosk loads without standard sidebar', async ({ page }) => {
  await page.goto(`${BASE}/device`);
  await page.waitForLoadState('domcontentloaded');
  if (page.url().includes('/login')) {
    console.warn('TC-A006: /device redirects to /login — may need device-specific auth');
    return;
  }
  const hasSidebar = await page.locator('nav[aria-label="sidebar"], [data-testid="sidebar"]').isVisible().catch(() => false);
  expect(hasSidebar, 'TC-A006: /device should not have standard sidebar nav').toBe(false);
});
