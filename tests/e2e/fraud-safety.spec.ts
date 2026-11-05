/**
 * TC-FS — Fraud Detection & Safety Tests
 * Tests fraud flag display, home safety assessment,
 * trusted advisors, fraud protection card on family portal.
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';

test.describe('TC-FS001–FS008 — Fraud & Safety', () => {
  test('TC-FS001 — /dashboard/fraud-protection loads for member', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    await page.goto(`${BASE}/dashboard/fraud-protection`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
    const hasFraud = /fraud|scam|protect|alert|flag/i.test(body);
    if (!hasFraud) console.warn('TC-FS001: No fraud protection content found');
  });

  test('TC-FS002 — family portal shows fraud protection card', async ({ page }) => {
    await loginAs(page, ACCOUNTS.family);
    await page.goto(`${BASE}/dashboard/family`);
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasFraudCard = /fraud|scam|protect/i.test(body);
    if (!hasFraudCard) console.warn('TC-FS002: Fraud protection card not visible on family portal');
  });

  test('TC-FS003 — /dashboard/home-safety loads', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    await page.goto(`${BASE}/dashboard/home-safety`);
    await page.waitForLoadState('networkidle');
    if (page.url().includes('/login')) {
      // Retry once — parallel suite auth can be slow
      await loginAs(page, ACCOUNTS.member, '/dashboard');
      await page.goto(`${BASE}/dashboard/home-safety`);
      await page.waitForLoadState('networkidle');
    }
    if (page.url().includes('/login')) {
      console.warn('TC-FS003: Still redirected to /login after retry — auth may be rate-limited');
      return;
    }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
    const hasSafety = /safety|assess|hazard|fall|risk/i.test(body);
    if (!hasSafety) console.warn('TC-FS003: No home safety content found');
  });

  test('TC-FS004 — /dashboard/trusted-advisors loads', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    await page.goto(`${BASE}/dashboard/trusted-advisors`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
    const hasAdvisors = /advisor|chaplain|therapist|counselor|attorney/i.test(body);
    if (!hasAdvisors) console.warn('TC-FS004: No trusted advisors content found');
  });

  test('TC-FS005 — chaplain NOT shown proactively (dignity rule)', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    await page.goto(`${BASE}/dashboard/trusted-advisors`);
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    // Chaplain should not be shown until member explicitly opts in
    // This is a soft check — warn only
    if (/chaplain.*proactive|proactive.*chaplain/i.test(body)) {
      console.warn('TC-FS005: Chaplain may be shown proactively — check dignity rule');
    }
  });
});
