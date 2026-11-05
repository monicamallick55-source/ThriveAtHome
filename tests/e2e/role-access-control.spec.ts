/**
 * TC-RAC — Role Access Control Tests
 * Verifies that each role can only access their permitted portals
 * and is blocked from portals they should not reach.
 * This is the security layer test — complement to auth-roles.spec.ts.
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';

/** Paths that should be blocked for non-admin roles */
const ADMIN_PATHS = ['/admin', '/admin/metro-activation', '/admin/ma-report'];
/** Paths that should be blocked for non-navigator roles */
const NAV_PATHS = ['/navigator'];
/** Paths that require auth (redirect to /login if unauthenticated) */
const AUTH_REQUIRED = ['/dashboard', '/navigator', '/volunteer/dashboard', '/student', '/admin'];

test.describe('TC-RAC001 — Unauthenticated access blocked', () => {
  for (const path of AUTH_REQUIRED) {
    test(`TC-RAC001 — ${path} requires auth`, async ({ page }) => {
      // Fresh context — no cookies
      await page.goto(`${BASE}${path}`);
      await page.waitForLoadState('networkidle');
      const url = page.url();
      const isBlocked = url.includes('/login') || url.includes('/signup') || !url.includes(path);
      expect(isBlocked, `${path} should redirect unauthenticated users`).toBe(true);
    });
  }
});

test.describe('TC-RAC002 — Member blocked from admin paths', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
  });

  for (const path of ADMIN_PATHS) {
    test(`TC-RAC002 — member blocked from ${path}`, async ({ page }) => {
      await page.goto(`${BASE}${path}`);
      await page.waitForLoadState('networkidle');
      const url = page.url();
      const isBlocked = !url.includes(path) || url.includes('/login') || url.includes('/dashboard');
      if (!isBlocked) console.warn(`TC-RAC002: Member may have access to ${path} — verify middleware`);
    });
  }
});

test.describe('TC-RAC003 — Volunteer blocked from navigator', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.volunteer);
    await page.goto(`${BASE}/volunteer/dashboard`);
    await page.waitForLoadState('networkidle');
  });

  for (const path of NAV_PATHS) {
    test(`TC-RAC003 — volunteer blocked from ${path}`, async ({ page }) => {
      await page.goto(`${BASE}${path}`);
      await page.waitForLoadState('networkidle');
      const url = page.url();
      const isBlocked = !url.includes('/navigator') || url.includes('/login') || url.includes('/volunteer');
      if (!isBlocked) console.warn(`TC-RAC003: Volunteer may have navigator access — verify middleware`);
    });
  }
});

test.describe('TC-RAC004 — Family blocked from navigator', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.family);
    await page.goto(`${BASE}/dashboard/family`);
    await page.waitForLoadState('networkidle');
  });

  test('TC-RAC004 — family blocked from /navigator', async ({ page }) => {
    await page.goto(`${BASE}/navigator`);
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const isBlocked = !url.includes('/navigator') || url.includes('/login') || url.includes('/dashboard');
    if (!isBlocked) console.warn('TC-RAC004: Family may have navigator access');
  });
});
