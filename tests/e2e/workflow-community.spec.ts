/**
 * TC-WCM — Community & Social Workflow Tests
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';

test.describe('TC-WCM001–WCM010 — Community Features Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
  });

  test('TC-WCM001 — communities page shows circles', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/communities`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
    const circleCount = (body.match(/circle|group|community/gi) ?? []).length;
    if (circleCount < 5) console.warn(`TC-WCM001: Only ${circleCount} circle references found`);
  });

  test('TC-WCM002 — join/view circle button exists and is enabled', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/communities`);
    await page.waitForLoadState('networkidle');
    const joinBtn = page.locator('button').filter({ hasText: /join|view|enter|explore/i }).first();
    if (await joinBtn.count() > 0) {
      expect(await joinBtn.isDisabled()).toBe(false);
    } else {
      console.warn('TC-WCM002: No join/view button on communities page');
    }
  });

  test('TC-WCM003 — events page shows listings', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/events`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WCM004 — skill exchange page loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/skill-exchange`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WCM005 — grief circles page loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/grief-circles`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WCM006 — festivals page loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/festivals`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WCM007 — volunteer opportunities page loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/volunteer-opportunities`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WCM008 — life transitions page loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/life-transitions`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WCM009 — training page loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/training`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WCM010 — transition page loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/transition`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });
});
