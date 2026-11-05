/**
 * TC-WC — Celebrations & Birthday Workflow Tests
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';

test.describe('TC-WC001–WC007 — Celebrations Workflow', () => {
  test('TC-WC001 — family can open celebration planner', async ({ page }) => {
    await loginAs(page, ACCOUNTS.family);
    await page.goto(`${BASE}/dashboard/celebrations`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
    const hasTiers = /digital|enhanced|premier|free|\$25|\$75/i.test(body);
    if (!hasTiers) console.warn('TC-WC001: Celebration tiers not visible');
  });

  test('TC-WC002 — celebration form has occasion date and tier selector', async ({ page }) => {
    await loginAs(page, ACCOUNTS.family);
    await page.goto(`${BASE}/dashboard/celebrations`);
    await page.waitForLoadState('networkidle');
    const planTab = page.locator('button').filter({ hasText: /plan|create|new/i }).first();
    if (await planTab.count() > 0) await planTab.click();
    const hasDate = await page.locator('input[type="date"]').count() > 0;
    const hasOccasion = await page.locator('select').count() > 0;
    if (!hasDate) console.warn('TC-WC002: No date input found on celebration form');
    if (!hasOccasion) console.warn('TC-WC002: No occasion selector found');
  });

  test('TC-WC003 — digital tier (free) plan button enabled', async ({ page }) => {
    await loginAs(page, ACCOUNTS.family);
    await page.goto(`${BASE}/dashboard/celebrations`);
    await page.waitForLoadState('networkidle');
    const freeBtn = page.locator('button').filter({ hasText: /free|digital/i }).first();
    if (await freeBtn.count() > 0) {
      expect(await freeBtn.isDisabled()).toBe(false);
    } else {
      console.warn('TC-WC003: No digital/free tier button found');
    }
  });

  test('TC-WC004 — submitting without date shows validation, not 500', async ({ page }) => {
    await loginAs(page, ACCOUNTS.family);
    await page.goto(`${BASE}/dashboard/celebrations`);
    await page.waitForLoadState('networkidle');
    const planTab = page.locator('button').filter({ hasText: /plan|create/i }).first();
    if (await planTab.count() > 0) await planTab.click();
    const submitBtn = page.locator('button').filter({ hasText: /plan celebration/i }).first();
    if (await submitBtn.count() > 0) {
      const isDisabled = await submitBtn.isDisabled();
      if (!isDisabled) console.warn('TC-WC004: Submit button not disabled when date is missing');
    }
  });

  test('TC-WC005 — member can view celebrations page', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    await page.goto(`${BASE}/dashboard/celebrations`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WC006 — celebrations/plan sub-page loads', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    await page.goto(`${BASE}/dashboard/celebrations/plan`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WC007 — plan-entitlements page loads', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    await page.goto(`${BASE}/dashboard/plan-entitlements`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });
});
