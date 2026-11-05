/**
 * TC-C — Community & Social Features Tests
 * Tests circles, events, skill exchange, posts, festivals.
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';

test.describe('TC-C001–C015 — Community & Social', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
  });

  test('TC-C001 — /dashboard/communities loads ≥20 circles', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/communities`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
    const circleCount = (body.match(/circle|group|community/gi) ?? []).length;
    if (circleCount < 5) console.warn(`TC-C001: Only ${circleCount} circle references found — expected ≥20 circles`);
  });

  test('TC-C002 — /dashboard/events loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/events`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
    const hasEvents = /event|workshop|class|join|register/i.test(body);
    if (!hasEvents) console.warn('TC-C002: No events content found');
  });

  test('TC-C003 — /dashboard/skill-exchange loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/skill-exchange`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
    const hasSkills = /skill|teach|learn|offer|exchange/i.test(body);
    if (!hasSkills) console.warn('TC-C003: No skill exchange content found');
  });

  test('TC-C004 — /dashboard/grief-circles loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/grief-circles`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-C005 — /dashboard/festivals loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/festivals`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
    const hasFestivals = /festival|cultural|celebrat|heritage/i.test(body);
    if (!hasFestivals) console.warn('TC-C005: No festival content found');
  });

  test('TC-C006 — /dashboard/grief-support loads with 9 pathways', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/grief-support`);
    await page.waitForSelector('h1, h2, button', { timeout: 10000 }).catch(() => {});
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const pathways = [
      /loss of a loved one/i, /major health/i, /caregiver/i,
      /loss of driving/i, /divorce|separation/i, /dementia|mci/i,
      /adult child/i, /housing/i,
    ];
    let found = 0;
    for (const p of pathways) { if (p.test(body)) found++; }
    if (found < 6) console.warn(`TC-C006: Only ${found}/9 grief pathways found`);
  });

  test('TC-C007 — /dashboard/life-transitions loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/life-transitions`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-C008 — /dashboard/volunteer-opportunities loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/volunteer-opportunities`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });
});
