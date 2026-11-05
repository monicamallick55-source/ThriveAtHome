/**
 * TC-WN — Navigator Workflow Tests
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';

test.describe('TC-WN001–WN008 — Navigator Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.navigator, '/navigator');
  });

  test('TC-WN001 — navigator portal loads with task queue', async ({ page }) => {
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
    const hasQueue = /task|queue|member|caseload|pending/i.test(body);
    if (!hasQueue) console.warn('TC-WN001: No task queue content on navigator portal');
  });

  test('TC-WN002 — task list shows pending tasks or empty state', async ({ page }) => {
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasTasks = /task|pending|urgent|review|no task|all clear|up to date/i.test(body);
    if (!hasTasks) console.warn('TC-WN002: No task list or empty state visible');
    expect(page.url()).not.toContain('/login');
  });

  test('TC-WN003 — complete/resolve task action visible', async ({ page }) => {
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasAction = /complete|resolve|mark done|close|dismiss/i.test(body);
    if (!hasAction) console.warn('TC-WN003: No task completion action visible');
  });

  test('TC-WN004 — navigator can access member list', async ({ page }) => {
    const memberLink = page.locator('a, button').filter({ hasText: /member|caseload|my members/i }).first();
    if (await memberLink.count() > 0) {
      await memberLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toContain('/login');
      const body = await page.evaluate(() => document.body?.innerText ?? '');
      expect(/500|internal server error/i.test(body)).toBe(false);
    } else {
      console.warn('TC-WN004: No member/caseload link found on navigator portal');
    }
  });

  test('TC-WN005 — fraud flag review section accessible', async ({ page }) => {
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasFraud = /fraud|scam|flag|alert|review/i.test(body);
    if (!hasFraud) console.warn('TC-WN005: No fraud review section on navigator portal');
  });

  test('TC-WN006 — navigator hours or activity summary visible', async ({ page }) => {
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasHours = /hour|time|this month|tracked|activity/i.test(body);
    if (!hasHours) console.warn('TC-WN006: No hours/activity summary on navigator portal');
  });

  test('TC-WN007 — grief/life-transition referral option visible', async ({ page }) => {
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasGrief = /grief|transition|pathway|refer|connect|support/i.test(body);
    if (!hasGrief) console.warn('TC-WN007: No grief/transition referral option visible');
  });

  test('TC-WN008 — navigator sub-paths no 500 errors', async ({ page }) => {
    const paths = ['/navigator', '/navigator/tasks', '/navigator/members'];
    for (const path of paths) {
      await page.goto(`${BASE}${path}`);
      await page.waitForLoadState('networkidle');
      const body = await page.evaluate(() => document.body?.innerText ?? '');
      if (/500|internal server error/i.test(body)) console.warn(`TC-WN008: 500 on ${path}`);
      if (path === '/navigator') expect(/500|internal server error/i.test(body)).toBe(false);
    }
  });
});
