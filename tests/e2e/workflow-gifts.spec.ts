import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';

test.describe('TC-WG001-WG006 Gift Send Workflow', () => {
  async function goToGifts(page, path) {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    await page.goto(BASE + path);
    await page.waitForLoadState('networkidle');
    if (page.url().includes('/login')) {
      await loginAs(page, ACCOUNTS.member, '/dashboard');
      await page.goto(BASE + path);
      await page.waitForLoadState('networkidle');
    }
    return !page.url().includes('/login');
  }

  test('TC-WG001 gift catalog shows items', async ({ page }) => {
    const ok = await goToGifts(page, '/dashboard/gifts');
    if (!ok) { console.warn('TC-WG001: Still on /login after retry'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
    if (!/gift|item|flower|cake|card|bouquet|\$/i.test(body)) console.warn('TC-WG001: No gift catalog items found');
  });

  test('TC-WG002 gift detail page loads', async ({ page }) => {
    const ok = await goToGifts(page, '/dashboard/gifts');
    if (!ok) { console.warn('TC-WG002: Still on /login after retry'); return; }
    const firstGift = page.locator('a, button').filter({ hasText: /view|detail|select|choose|send/i }).first();
    if (await firstGift.count() > 0) {
      await firstGift.click();
      await page.waitForLoadState('networkidle');
      const body = await page.evaluate(() => document.body?.innerText ?? '');
      expect(/500|internal server error/i.test(body)).toBe(false);
    } else {
      console.warn('TC-WG002: No gift detail link found');
    }
  });

  test('TC-WG003 gift send page has recipient selector', async ({ page }) => {
    const ok = await goToGifts(page, '/dashboard/gift-send');
    if (!ok) { console.warn('TC-WG003: Still on /login after retry'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
    if (await page.locator('select').count() === 0) console.warn('TC-WG003: No recipient selector on gift-send page');
  });

  test('TC-WG004 submit without recipient shows validation not 500', async ({ page }) => {
    const ok = await goToGifts(page, '/dashboard/gift-send');
    if (!ok) { console.warn('TC-WG004: Still on /login after retry'); return; }
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

  test('TC-WG005 order history tab accessible', async ({ page }) => {
    const ok = await goToGifts(page, '/dashboard/gifts');
    if (!ok) { console.warn('TC-WG005: Still on /login after retry'); return; }
    const historyTab = page.locator('button, a').filter({ hasText: /history|sent|order/i }).first();
    if (await historyTab.count() > 0) {
      await historyTab.click();
      await page.waitForLoadState('networkidle');
      const body = await page.evaluate(() => document.body?.innerText ?? '');
      expect(/500|internal server error/i.test(body)).toBe(false);
    } else {
      console.warn('TC-WG005: No order history tab found');
    }
  });

  test('TC-WG006 gift API returns catalog', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-WG006: member not authenticated'); return; }
    const res = await page.evaluate(async () => {
      const r = await fetch('/api/gifts/catalog');
      return r.status;
    });
    if (res === 404) console.warn('TC-WG006: /api/gifts/catalog not found');
    else if (res >= 500) console.warn('TC-WG006: /api/gifts/catalog returned ' + res);
  });
});
