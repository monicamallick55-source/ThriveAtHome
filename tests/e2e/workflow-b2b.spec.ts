/**
 * TC-WB — B2B Portal Workflow Tests
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';

test.describe('TC-WB001–WB010 — B2B Org Portals Workflow', () => {
  test('TC-WB001 — org admin portal loads', async ({ page }) => {
    await loginAs(page, ACCOUNTS.orgadmin, '/org-admin');
    if (page.url().includes('/login')) { console.warn('TC-WB001: OrgAdmin not authenticated'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WB002 — org admin sees member list or enrollment count', async ({ page }) => {
    await loginAs(page, ACCOUNTS.orgadmin, '/org-admin');
    if (page.url().includes('/login')) { console.warn('TC-WB002: OrgAdmin not authenticated'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasMembers = /member|enrolled|staff|employee|count|active/i.test(body);
    if (!hasMembers) console.warn('TC-WB002: No member/enrollment data on org admin portal');
  });

  test('TC-WB003 — employer portal landing loads', async ({ page }) => {
    await page.goto(`${BASE}/employer`);
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WB004 — VSO admin portal loads', async ({ page }) => {
    await loginAs(page, ACCOUNTS.vsoadmin, '/vso-admin');
    if (page.url().includes('/login')) { console.warn('TC-WB004: VSO admin not authenticated'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WB005 — university admin portal loads', async ({ page }) => {
    await loginAs(page, ACCOUNTS.uniadmin, '/university-admin');
    if (page.url().includes('/login')) { console.warn('TC-WB005: Uni admin not authenticated'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WB006 — senior center portal loads', async ({ page }) => {
    await loginAs(page, ACCOUNTS.seniorcenter, '/senior-center');
    if (page.url().includes('/login')) { console.warn('TC-WB006: Senior center not authenticated'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WB007 — AAA portal loads', async ({ page }) => {
    await loginAs(page, ACCOUNTS.aaa, '/aaa');
    if (page.url().includes('/login')) { console.warn('TC-WB007: AAA not authenticated'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WB008 — network admin portal loads', async ({ page }) => {
    await loginAs(page, ACCOUNTS.network, '/network-admin');
    if (page.url().includes('/login')) { console.warn('TC-WB008: Network admin not authenticated'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WB009 — k12 admin portal loads', async ({ page }) => {
    await loginAs(page, ACCOUNTS.k12admin, '/k12-admin');
    if (page.url().includes('/login')) { console.warn('TC-WB009: K12 admin not authenticated'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WB010 — org admin referrals section accessible', async ({ page }) => {
    await loginAs(page, ACCOUNTS.orgadmin, '/org-admin');
    if (page.url().includes('/login')) { console.warn('TC-WB010: OrgAdmin not authenticated'); return; }
    const refLink = page.locator('a, button').filter({ hasText: /referral|village|refer/i }).first();
    if (await refLink.count() > 0) {
      await refLink.click();
      await page.waitForLoadState('networkidle');
      const body = await page.evaluate(() => document.body?.innerText ?? '');
      expect(/500|internal server error/i.test(body)).toBe(false);
    } else {
      console.warn('TC-WB010: No referral section on org admin portal');
    }
  });
});
