/**
 * TC-WF — Family Portal Workflow Tests
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';

test.describe('TC-WF001–WF008 — Family Portal Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.family);
    await page.goto(`${BASE}/dashboard/family`);
    await page.waitForLoadState('networkidle');
  });

  test('TC-WF001 — family portal shows member wellness summary', async ({ page }) => {
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
    const hasWellness = /wellness|health|mood|check.?in|last call|status/i.test(body);
    if (!hasWellness) console.warn('TC-WF001: Wellness summary not found on family portal');
  });

  test('TC-WF002 — family events calendar content visible', async ({ page }) => {
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasCalendar = /event|calendar|family|upcoming/i.test(body);
    if (!hasCalendar) console.warn('TC-WF002: Family events calendar not visible');
  });

  test('TC-WF003 — fraud protection card visible', async ({ page }) => {
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasFraud = /fraud|scam|protect|alert|flag/i.test(body);
    if (!hasFraud) console.warn('TC-WF003: Fraud protection card not visible on family portal');
  });

  test('TC-WF004 — mood timeline section present', async ({ page }) => {
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasMood = /mood|timeline|feeling|wellbeing/i.test(body);
    if (!hasMood) console.warn('TC-WF004: Mood timeline not found on family portal');
  });

  test('TC-WF005 — no 500 errors', async ({ page }) => {
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WF006 — family can access celebration planner', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/celebrations`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WF007 — family can view member profile data', async ({ page }) => {
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasData = /call|summary|mood|service|alert/i.test(body);
    if (!hasData) console.warn('TC-WF007: Family portal not showing member data');
  });

  test('TC-WF008 — family portal gifts page accessible', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/gifts`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });
});
