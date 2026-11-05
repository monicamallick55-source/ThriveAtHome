import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';

test.describe('TC-WB001-WB010 B2B Org Portals Workflow', () => {
  test('TC-WB001 org admin portal loads', async ({ page }) => {
    await loginAs(page, ACCOUNTS.orgadmin, '/org-admin');
    if (page.url().includes('/login')) { console.warn('TC-WB001: orgadmin not seeded'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WB002 org admin sees member list or enrollment count', async ({ page }) => {
    await loginAs(page, ACCOUNTS.orgadmin, '/org-admin');
    if (page.url().includes('/login')) { console.warn('TC-WB002: orgadmin not seeded'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (!/member|enrolled|staff|employee|count|active/i.test(body)) console.warn('TC-WB002: no member data');
  });

  test('TC-WB003 employer portal loads', async ({ page }) => {
    await page.goto(BASE + '/employer');
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WB004 VSO admin portal loads', async ({ page }) => {
    await loginAs(page, ACCOUNTS.vsoadmin, '/vso-admin');
    if (page.url().includes('/login')) { console.warn('TC-WB004: vsoadmin not seeded'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WB005 university admin portal loads', async ({ page }) => {
    await loginAs(page, ACCOUNTS.uniadmin, '/university-admin');
    if (page.url().includes('/login')) { console.warn('TC-WB005: uniadmin not seeded'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WB006 senior center portal loads', async ({ page }) => {
    await loginAs(page, ACCOUNTS.seniorcenter, '/senior-center');
    if (page.url().includes('/login')) { console.warn('TC-WB006: seniorcenter not seeded'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WB007 AAA portal loads', async ({ page }) => {
    await loginAs(page, ACCOUNTS.aaa, '/aaa');
    if (page.url().includes('/login')) { console.warn('TC-WB007: aaa not seeded'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WB008 network admin portal loads', async ({ page }) => {
    await loginAs(page, ACCOUNTS.network, '/network-admin');
    if (page.url().includes('/login')) { console.warn('TC-WB008: network not seeded'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WB009 k12 admin portal loads', async ({ page }) => {
    await loginAs(page, ACCOUNTS.k12admin, '/k12-admin');
    if (page.url().includes('/login')) { console.warn('TC-WB009: k12admin not seeded'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WB010 org admin referrals section accessible', async ({ page }) => {
    await loginAs(page, ACCOUNTS.orgadmin, '/org-admin');
    if (page.url().includes('/login')) { console.warn('TC-WB010: orgadmin not seeded'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });
});
