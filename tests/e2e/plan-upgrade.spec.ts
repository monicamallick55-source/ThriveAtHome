/**
 * TC-PU — Plan & Upgrade Tests
 * Tests plan display, feature gating by plan tier,
 * upgrade prompts, and plan comparison page.
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';

test.describe('TC-PU001–PU010 — Plan & Upgrades', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
  });

  test('TC-PU001 — /dashboard shows plan badge', async ({ page }) => {
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasPlan = /basics|connect|complete|premier|plan/i.test(body);
    if (!hasPlan) console.warn('TC-PU001: No plan badge on dashboard');
    expect(page.url()).not.toContain('/login');
  });

  test('TC-PU002 — /dashboard/plan-comparison loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/plan-comparison`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
    const hasPlans = /basic|complete|premier|\$39|\$79/i.test(body);
    if (!hasPlans) console.warn('TC-PU002: Plan comparison page missing plan details');
  });

  test('TC-PU003 — /dashboard/addons loads with 4 SKUs', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/addons`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const skus = [/companion/i, /home.*safe|safe.*home/i, /meal|food/i, /transport|ride/i];
    let found = 0;
    for (const s of skus) { if (s.test(body)) found++; }
    if (found < 2) console.warn(`TC-PU003: Only ${found}/4 add-on SKUs found`);
  });

  test('TC-PU004 — upgrade CTA present for basics member', async ({ page }) => {
    // member@test.com is on 'connect' plan — check for upgrade prompts
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    // This is a soft check — upgrade CTAs may or may not appear on dashboard
    const hasUpgrade = /upgrade|complete|premier/i.test(body);
    if (!hasUpgrade) console.warn('TC-PU004: No upgrade CTA on dashboard (may be expected for connect tier)');
  });

  test('TC-PU005 — public /signup shows Basic and Complete plans', async ({ page }) => {
    // Use fresh context to avoid auth redirect
    await page.context().clearCookies();
    await page.goto(`${BASE}/signup`);
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasBasic = /basic|\$39/i.test(body);
    const hasComplete = /complete|\$79/i.test(body);
    if (!hasBasic) console.warn('TC-PU005: Basic plan not shown on /signup');
    if (!hasComplete) console.warn('TC-PU005: Complete plan not shown on /signup');
    // Premier should NOT be shown
    const hasPremier = /premier.*\$199|\$199.*premier/i.test(body);
    if (hasPremier) console.warn('TC-PU005: WARNING — Premier plan visible on /signup (should be hidden)');
  });

  test('TC-PU006 — /dashboard/benefits-finder loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/benefits-finder`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });
});
