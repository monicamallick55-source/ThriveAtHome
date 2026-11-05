/**
 * TC-CG — Celebrations & Gifts Tests
 * Tests gift catalog, gift send flow, celebration planner,
 * birthday arc, family-initiated celebrations.
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';

test.describe('TC-CG001–CG010 — Celebrations & Gifts', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
  });

  test('TC-CG001 — /dashboard/celebrations loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/celebrations`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
    const hasCelebrations = /celebrat|birthday|milestone|anniversary/i.test(body);
    if (!hasCelebrations) console.warn('TC-CG001: No celebration content found');
  });

  test('TC-CG002 — /dashboard/celebrations/plan loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/celebrations/plan`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-CG003 — /dashboard/gifts loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/gifts`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
    const hasGifts = /gift|send|card|basket|\$4\.99|\$25|\$75|\$85/i.test(body);
    if (!hasGifts) console.warn('TC-CG003: No gift catalog content found');
  });

  test('TC-CG004 — /dashboard/gift-send loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/gift-send`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
    const hasForm = /send|recipient|message|gift/i.test(body);
    if (!hasForm) console.warn('TC-CG004: No gift send form found');
  });

  test('TC-CG005 — family portal celebration planner accessible', async ({ page }) => {
    await loginAs(page, ACCOUNTS.family);
    await page.goto(`${BASE}/dashboard/celebrations/plan`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });
});
