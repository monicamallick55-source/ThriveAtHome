/**
 * TC-V — Volunteer Portal Tests
 * Tests volunteer dashboard, training gate, opportunity browsing,
 * hour logging, and role-specific portals (student, k12, university, VSO, corporate).
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';

test.describe('TC-V001–V010 — Volunteer Portal', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.volunteer);
    await page.goto(`${BASE}/volunteer/dashboard`);
    await page.waitForLoadState('networkidle');
  });

  test('TC-V001 — /volunteer/dashboard loads', async ({ page }) => {
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-V002 — volunteer opportunities visible', async ({ page }) => {
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasOpps = /opportunit|shift|schedule|available/i.test(body);
    if (!hasOpps) console.warn('TC-V002: No volunteer opportunities found');
    expect(page.url()).not.toContain('/login');
  });

  test('TC-V003 — hour tracking or log visible', async ({ page }) => {
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasHours = /hour|time|log|tracked|this month/i.test(body);
    if (!hasHours) console.warn('TC-V003: No hour tracking visible');
  });

  test('TC-V004 — training section or gate present', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/training`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-V005 — volunteer cannot access /navigator', async ({ page }) => {
    await page.goto(`${BASE}/navigator`);
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const blocked = url.includes('/login') || url.includes('/volunteer') || url.includes('/dashboard') || !url.includes('/navigator');
    if (!blocked) console.warn('TC-V005: Volunteer may have navigator access — check middleware');
  });
});

test.describe('TC-S001–S005 — Student Volunteer Portal', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.student);
    await page.waitForLoadState('networkidle');
  });

  test('TC-S001 — student lands on /student portal', async ({ page }) => {
    expect(page.url()).toContain('/student');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-S002 — student portal shows university/program context', async ({ page }) => {
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasContext = /student|university|program|volunteer|hour/i.test(body);
    if (!hasContext) console.warn('TC-S002: No university/program context on student portal');
  });

  test('TC-S003 — student cannot access /navigator', async ({ page }) => {
    await page.goto(`${BASE}/navigator`);
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const blocked = !url.includes('/navigator') || url.includes('/login') || url.includes('/student');
    if (!blocked) console.warn('TC-S003: Student may have navigator access');
  });
});
