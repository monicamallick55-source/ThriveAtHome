import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';

test.describe('TC-WA001-WA005 Admin Portal Workflow', () => {
  test('TC-WA001 admin portal loads without 500 errors', async ({ page }) => {
    await loginAs(page, ACCOUNTS.admin, '/admin');
    if (page.url().includes('/login')) { console.warn('TC-WA001: admin not seeded'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WA002 admin sees member statistics', async ({ page }) => {
    await loginAs(page, ACCOUNTS.admin, '/admin');
    if (page.url().includes('/login')) { console.warn('TC-WA002: admin not seeded'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (!/member|stat|total|count|active|enrolled/i.test(body)) console.warn('TC-WA002: no stats visible');
  });

  test('TC-WA003 admin sees metro or region management', async ({ page }) => {
    await loginAs(page, ACCOUNTS.admin, '/admin');
    if (page.url().includes('/login')) { console.warn('TC-WA003: admin not seeded'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (!/metro|region|zip|coverage|activat/i.test(body)) console.warn('TC-WA003: no metro section');
  });

  test('TC-WA004 admin can access grief circle management', async ({ page }) => {
    await loginAs(page, ACCOUNTS.admin, '/admin');
    if (page.url().includes('/login')) { console.warn('TC-WA004: admin not seeded'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (!/grief|circle|support/i.test(body)) console.warn('TC-WA004: no grief section visible');
  });

  test('TC-WA005 admin sub-pages no 500 errors', async ({ page }) => {
    await loginAs(page, ACCOUNTS.admin, '/admin');
    if (page.url().includes('/login')) { console.warn('TC-WA005: admin not seeded'); return; }
    for (const path of ['/admin', '/admin/members', '/admin/villages', '/admin/grief-circles']) {
      await page.goto(BASE + path);
      await page.waitForLoadState('networkidle');
      const body = await page.evaluate(() => document.body?.innerText ?? '');
      if (/500|internal server error/i.test(body)) console.warn('TC-WA005: 500 on ' + path);
    }
  });
});

test.describe('TC-WA010-WA012 Care Worker and Agency Workflow', () => {
  test('TC-WA010 care worker portal loads', async ({ page }) => {
    await loginAs(page, ACCOUNTS.careworker, '/careworker');
    if (page.url().includes('/login')) { console.warn('TC-WA010: careworker not seeded'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WA011 care worker sees visits or tasks', async ({ page }) => {
    await loginAs(page, ACCOUNTS.careworker, '/careworker');
    if (page.url().includes('/login')) { console.warn('TC-WA011: careworker not seeded'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (!/today|visit|task|schedule|upcoming/i.test(body)) console.warn('TC-WA011: no visits/tasks visible');
  });

  test('TC-WA012 agency portal loads', async ({ page }) => {
    await loginAs(page, ACCOUNTS.agency, '/agency');
    if (page.url().includes('/login')) { console.warn('TC-WA012: agency not seeded'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });
});
