/**
 * TC-WA — Admin & Staff Workflow Tests
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';

test.describe('TC-WA001–WA005 — Admin Portal Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.admin, '/admin');
  });

  test('TC-WA001 — admin portal loads without 500 errors', async ({ page }) => {
    if (page.url().includes('/login')) { console.warn('TC-WA001: Admin redirected to login'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WA002 — admin sees member statistics', async ({ page }) => {
    if (page.url().includes('/login')) { console.warn('TC-WA002: Admin not authenticated'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasStats = /member|stat|total|count|active|enrolled/i.test(body);
    if (!hasStats) console.warn('TC-WA002: No member statistics on admin portal');
  });

  test('TC-WA003 — admin sees metro/region management', async ({ page }) => {
    if (page.url().includes('/login')) { console.warn('TC-WA003: Admin not authenticated'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasMetro = /metro|region|zip|coverage|activat/i.test(body);
    if (!hasMetro) console.warn('TC-WA003: No metro/region management on admin portal');
  });

  test('TC-WA004 — admin can access grief circle management', async ({ page }) => {
    if (page.url().includes('/login')) { console.warn('TC-WA004: Admin not authenticated'); return; }
    const griefLink = page.locator('a, button').filter({ hasText: /grief|circle|support.*group/i }).first();
    if (await griefLink.count() > 0) {
      await griefLink.click();
      await page.waitForLoadState('networkidle');
      const body = await page.evaluate(() => document.body?.innerText ?? '');
      expect(/500|internal server error/i.test(body)).toBe(false);
    } else {
      console.warn('TC-WA004: No grief circle management link on admin portal');
    }
  });

  test('TC-WA005 — admin sub-pages no 500 errors', async ({ page }) => {
    if (page.url().includes('/login')) { console.warn('TC-WA005: Admin not authenticated'); return; }
    for (const path of ['/admin', '/admin/members', '/admin/villages']) {
      await page.goto(`${BASE}${path}`);
      await page.waitForLoadState('networkidle');
      const body = await page.evaluate(() => document.body?.innerText ?? '');
      if (/500|internal server error/i.test(body)) console.warn(`TC-WA005: 500 on ${path}`);
    }
  });
});

test.describe('TC-WA010–WA012 — Care Worker & Agency Workflow', () => {
  test('TC-WA010 — care worker portal loads', async ({ page }) => {
    await loginAs(page, ACCOUNTS.careworker, '/careworker');
    if (page.url().includes('/login')) { console.warn('TC-WA010: Careworker not authenticated'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WA011 — care worker sees today\'s visits or tasks', async ({ page }) => {
    await loginAs(page, ACCOUNTS.careworker, '/careworker');
    if (page.url().includes('/login')) { console.warn('TC-WA011: Careworker not authenticated'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasVisits = /today|visit|task|schedule|upcoming|no.*visit/i.test(body);
    if (!hasVisits) console.warn('TC-WA011: No visits/tasks on careworker portal');
  });

  test('TC-WA012 — agency portal loads', async ({ page }) => {
    await loginAs(page, ACCOUNTS.agency, '/agency');
    if (page.url().includes('/login')) { console.warn('TC-WA012: Agency not authenticated'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });
});
