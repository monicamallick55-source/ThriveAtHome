/**
 * TC-B2B — B2B Portal Tests
 * Tests employer admin, university admin, VSO admin, school admin portals.
 * These are accessed by specific org-admin roles.
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';

const B2B_PORTALS = [
  { path: '/employer-admin',    tc: 'TC-B2B001', label: 'Employer Admin' },
  { path: '/university-admin',  tc: 'TC-B2B002', label: 'University Admin' },
  { path: '/vso-admin',         tc: 'TC-B2B003', label: 'VSO Admin' },
  { path: '/school-admin',      tc: 'TC-B2B004', label: 'K-12 School Admin' },
  { path: '/org-admin',         tc: 'TC-B2B005', label: 'Org Admin' },
];

test.describe('TC-B2B001–B2B005 — B2B Portal Smoke Tests', () => {
  // These portals load for their respective admin roles.
  // We test with admin@test.com as a proxy; actual B2B admins need org-specific accounts.
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.admin);
  });

  for (const { path, tc, label } of B2B_PORTALS) {
    test(`${tc} — ${label} portal at ${path} loads without 500`, async ({ page }) => {
      await page.goto(`${BASE}${path}`);
      await page.waitForLoadState('networkidle');
      const body = await page.evaluate(() => document.body?.innerText ?? '');
      // Portal may redirect non-org-admin users — that's expected
      expect(/500|internal server error/i.test(body)).toBe(false);
      if (!page.url().includes(path)) {
        console.warn(`${tc}: Redirected from ${path} — ${label} requires org-specific account`);
      }
    });
  }
});

test.describe('TC-B2B010 — K12 Student Portal', () => {
  test('TC-B2B010 — k12student lands on /student portal', async ({ page }) => {
    await loginAs(page, ACCOUNTS.k12student);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/student');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });
});
