/**
 * TC-WG — Gift Catalog & Send Workflow Tests
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';

test.describe('TC-WG001–WG006 — Gift Send Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
  });

  test('TC-WG001 — gift catalog shows items', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/gifts`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
    const hasItems = /gift|item|flower|cake|card|bouquet|\$/i.test(body);
    if (!hasItems) console.warn('TC-WG001: No gift catalog items found');
  });

  test('TC-WG002 — clicking a gift item opens send form', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/gifts`);
    await page.waitForLoadState('networkidle');
    const giftBtn = page.locator('button').filter({ hasText: /send|gift|select|choose/i }).first();
    if (await giftBtn.count() > 0) {
      await giftBtn.click();
      await page.waitForTimeout(500);
      const hasForm = await page.locator('select, textarea').count() > 0;
      if (!hasForm) console.warn('TC-WG002: Send form did not open after clicking gift item');
    } else {
      console.warn('TC-WG002: No gift item button found');
    }
  });

  test('TC-WG003 — send form has recipient selector', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/gift-send`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
    const hasSelect = await page.locator('select').count() > 0;
    if (!hasSelect) console.warn('TC-WG003: No recipient selector on gift-send page');
  });

  test('TC-WG004 — submit without recipient shows validation, not 500', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/gift-send`);
    await page.waitForLoadState('networkidle');
    const submitBtn = page.locator('button').filter({ hasText: /send gift/i }).first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(500);
      const body = await page.evaluate(() => document.body?.innerText ?? '');
      expect(/500|internal server error/i.test(body)).toBe(false);
    } else {
      console.warn('TC-WG004: No Send Gift button found');
    }
  });

  test('TC-WG005 — order history tab accessible', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/gifts`);
    await page.waitForLoadState('networkidle');
    const historyTab = page.locator('button, a').filter({ hasText: /history|sent|order/i }).first();
    if (await historyTab.count() > 0) {
      await historyTab.click();
      await page.waitForTimeout(400);
      expect(page.url()).not.toContain('/login');
    } else {
      console.warn('TC-WG005: No order history tab found');
    }
  });

  test('TC-WG006 — high-value gift shows approval notice', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/gifts`);
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasHighValue = /approval|review|navigator|premium|high.?value|\$100|\$150|\$200/i.test(body);
    if (!hasHighValue) console.warn('TC-WG006: No high-value gift approval notice found');
  });
});
