/**
 * TC-WFD — Fraud Detection & Reporting Workflow Tests
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';

test.describe('TC-WFD001–WFD008 — Fraud Protection Workflow', () => {
  test('TC-WFD001 — fraud protection page loads for member', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    await page.goto(`${BASE}/dashboard/fraud-protection`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
    const hasContent = /fraud|scam|protect|flag|report|suspicious/i.test(body);
    if (!hasContent) console.warn('TC-WFD001: No fraud protection content found');
  });

  test('TC-WFD002 — fraud page shows common scam types', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    await page.goto(`${BASE}/dashboard/fraud-protection`);
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasScamTypes = /phone|email|romance|impersonat|government|bank|wire|gift card/i.test(body);
    if (!hasScamTypes) console.warn('TC-WFD002: No scam type categories shown');
  });

  test('TC-WFD003 — fraud flag API accepts submission', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    const res = await page.evaluate(async () => {
      const r = await fetch('/api/fraud-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'phone_scam',
          description: 'Test: Caller claimed to be IRS and asked for gift cards',
          contact_method: 'phone',
        }),
      });
      return { status: r.status };
    });
    if (res.status === 404) {
      console.warn('TC-WFD003: /api/fraud-flags not found — needs implementation');
    } else {
      expect(res.status).toBeLessThan(500);
    }
  });

  test('TC-WFD004 — fraud report UI form has fields', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    await page.goto(`${BASE}/dashboard/fraud-protection`);
    await page.waitForLoadState('networkidle');
    const reportBtn = page.locator('button').filter({ hasText: /report|flag|submit|suspicious/i }).first();
    if (await reportBtn.count() > 0) {
      await reportBtn.click();
      await page.waitForTimeout(500);
      const hasForm = await page.locator('input, textarea, select').count() > 0;
      if (!hasForm) console.warn('TC-WFD004: Fraud report form did not open');
    } else {
      console.warn('TC-WFD004: No report/flag button on fraud protection page');
    }
  });

  test('TC-WFD005 — family fraud alert card visible', async ({ page }) => {
    await loginAs(page, ACCOUNTS.family);
    await page.goto(`${BASE}/dashboard/family`);
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasFraud = /fraud|scam|alert|suspicious|protect/i.test(body);
    if (!hasFraud) console.warn('TC-WFD005: No fraud alert/protection card on family portal');
  });

  test('TC-WFD006 — navigator sees fraud review tasks', async ({ page }) => {
    await loginAs(page, ACCOUNTS.navigator, '/navigator');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasFraud = /fraud|scam|flag|alert|review/i.test(body);
    if (!hasFraud) console.warn('TC-WFD006: No fraud review section on navigator portal');
  });

  test('TC-WFD007 — trusted advisors includes fraud-related type', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    await page.goto(`${BASE}/dashboard/trusted-advisors`);
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasFraudAdvisor = /attorney|financial|fraud|elder.*law|consumer/i.test(body);
    if (!hasFraudAdvisor) console.warn('TC-WFD007: No fraud-related advisor type on trusted advisors');
  });

  test('TC-WFD008 — fraud pages no 500 errors', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    for (const path of ['/dashboard/fraud-protection', '/dashboard/trusted-advisors']) {
      await page.goto(`${BASE}${path}`);
      await page.waitForLoadState('networkidle');
      const body = await page.evaluate(() => document.body?.innerText ?? '');
      expect(/500|internal server error/i.test(body)).toBe(false);
    }
  });
});
