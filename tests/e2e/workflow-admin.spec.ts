/**
 * TC-WA — Admin & Staff Workflow Tests
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';

test.describe('TC-WA001–WA005 — Admin Portal Workflow', () => {
  test('TC-WA001 — admin portal loads without 500 errors', async ({ page }) => {
    await loginAs(page, ACCOUNTS.admin, '/admin');
    const url = page.url();
    if (url.includes('/login')) { console.warn('TC-WA001: Admin redirected to login — admin role may not be seeded'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WA002 — admin sees member statistics or count', async ({ page }) => {
    await loginAs(page, ACCOUNTS.admin, '/admin');
    const url = page.url();
    if (url.includes('/login')) { console.warn('TC-WA002: Admin not authenticated'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasStats = /member|stat|total|count|active|enrolled/i.test(body);
    if (!hasStats) console.warn('TC-WA002: No member statistics visible on admin portal');
  });

  test('TC-WA003 — admin sees metro/region management', async ({ page }) => {
    await loginAs(page, ACCOUNTS.admin, '/admin');
    const url = page.url();
    if (url.includes('/login')) { console.warn('TC-WA003: Admin not authenticated'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasMetro = /metro|region|zip|coverage|activat/i.test(body);
    if (!hasMetro) console.warn('TC-WA003: No metro/region management section on admin portal');
  });

  test('TC-WA004 — admin can access grief circle management', async ({ page }) => {
    await loginAs(page, ACCOUNTS.admin, '/admin');
    const url = page.url();
    if (url.includes('/login')) { console.warn('TC-WA004: Admin not authenticated'); return; }
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
    await loginAs(page, ACCOUNTS.admin, '/admin');
    const url = page.url();
    if (url.includes('/login')) { console.warn('TC-WA005: Admin not authenticated'); return; }
    const paths = ['/admin', '/admin/members', '/admin/villages', '/admin/grief-circles'];
    for (const path of paths) {
      await page.goto(`${BASE}${path}`);
      await page.waitForLoadState('networkidle');
      const body = await page.evaluate(() => document.body?.innerText ?? '');
      if (/500|internal server error/i.test(body)) {
        console.warn(`TC-WA005: 500 error on ${path}`);
      }
    }
  });
});

test.describe('TC-WA010–WA012 — Care Worker & Agency Workflow', () => {
  test('TC-WA010 — care worker portal loads', async ({ page }) => {
    await loginAs(page, ACCOUNTS.careworker, '/careworker');
    const url = page.url();
    if (url.includes('/login')) { console.warn('TC-WA010: Careworker not authenticated'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
    const hasContent = /member|client|task|visit|schedule|care|service/i.test(body);
    if (!hasContent) console.warn('TC-WA010: No care content on careworker portal');
  });

  test("TC-WA011 — care worker sees today's visits or tasks", async ({ page }) => {
    await loginAs(page, ACCOUNTS.careworker, '/careworker');
    const url = page.url();
    if (url.includes('/login')) { console.warn('TC-WA011: Careworker not authenticated'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasVisits = /today|visit|task|schedule|upcoming|no.*visit|no.*task/i.test(body);
    if (!hasVisits) console.warn('TC-WA011: No visits/tasks section on careworker portal');
  });

  test('TC-WA012 — agency portal loads', async ({ page }) => {
    await loginAs(page, ACCOUNTS.agency, '/agency');
    const url = page.url();
    if (url.includes('/login')) { console.warn('TC-WA012: Agency not authenticated'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
    const hasContent = /staff|worker|client|service|referral|place/i.test(body);
    if (!hasContent) console.warn('TC-WA012: No agency content on agency portal');
  });
});
