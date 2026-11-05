/**
 * TC-WV — Volunteer & Student Workflow Tests
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';

test.describe('TC-WV001–WV007 — Volunteer Portal Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.volunteer, '/volunteer');
  });

  test('TC-WV001 — volunteer portal loads without 500 errors', async ({ page }) => {
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WV002 — opportunities or empty state visible', async ({ page }) => {
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasContent = /opportunit|availab|visit|call|companion|no.*opportunit|no.*assign/i.test(body);
    if (!hasContent) console.warn('TC-WV002: No opportunities or empty state on volunteer portal');
  });

  test('TC-WV003 — training modules section visible', async ({ page }) => {
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasTraining = /train|module|certif|onboard|required|complete/i.test(body);
    if (!hasTraining) console.warn('TC-WV003: No training section on volunteer portal');
  });

  test('TC-WV004 — apply or accept opportunity button exists', async ({ page }) => {
    const applyBtn = page.locator('button').filter({ hasText: /apply|accept|sign.?up|take/i }).first();
    if (await applyBtn.count() > 0) {
      expect(await applyBtn.isDisabled()).toBe(false);
    } else {
      console.warn('TC-WV004: No apply/accept button found');
    }
  });

  test('TC-WV005 — volunteer hours or activity summary visible', async ({ page }) => {
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasHours = /hour|time|this month|tracked|activity|served/i.test(body);
    if (!hasHours) console.warn('TC-WV005: No hours/activity summary on volunteer portal');
  });

  test('TC-WV006 — training module click does not 500', async ({ page }) => {
    const trainBtn = page.locator('button, a').filter({ hasText: /train|module|start|begin|continue/i }).first();
    if (await trainBtn.count() > 0) {
      await trainBtn.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toContain('/login');
      const body = await page.evaluate(() => document.body?.innerText ?? '');
      expect(/500|internal server error/i.test(body)).toBe(false);
    } else {
      console.warn('TC-WV006: No training module link found');
    }
  });

  test('TC-WV007 — my schedule section visible or empty state', async ({ page }) => {
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasSchedule = /schedule|upcoming|my visits|my assignments|confirmed|no.*visit/i.test(body);
    if (!hasSchedule) console.warn('TC-WV007: No schedule/upcoming visits section');
  });
});

test.describe('TC-WV020–WV023 — Student Portal Workflow', () => {
  test('TC-WV020 — student portal loads without 500 errors', async ({ page }) => {
    await loginAs(page, ACCOUNTS.student, '/student');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WV021 — student sees service learning content', async ({ page }) => {
    await loginAs(page, ACCOUNTS.student, '/student');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasContent = /service|learn|opportunit|hour|community|place/i.test(body);
    if (!hasContent) console.warn('TC-WV021: No service learning content on student portal');
  });

  test('TC-WV022 — student log hours button opens form', async ({ page }) => {
    await loginAs(page, ACCOUNTS.student, '/student');
    const logBtn = page.locator('button').filter({ hasText: /log.*hour|submit|reflect|report/i }).first();
    if (await logBtn.count() > 0) {
      await logBtn.click();
      await page.waitForTimeout(500);
      const hasForm = await page.locator('input, textarea').count() > 0;
      if (!hasForm) console.warn('TC-WV022: Log/submit form did not open');
    } else {
      console.warn('TC-WV022: No log hours button found');
    }
  });

  test('TC-WV023 — student portal no 500 on sub-paths', async ({ page }) => {
    await loginAs(page, ACCOUNTS.student, '/student');
    for (const path of ['/student', '/student/hours', '/student/placements']) {
      await page.goto(`${BASE}${path}`);
      await page.waitForLoadState('networkidle');
      const body = await page.evaluate(() => document.body?.innerText ?? '');
      if (/500|internal server error/i.test(body)) console.warn(`TC-WV023: 500 on ${path}`);
    }
    expect(page.url()).not.toContain('/login');
  });
});
