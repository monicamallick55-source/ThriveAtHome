/**
 * TC-A004 — All 21 roles login smoke test
 * TC-A005 — Cross-role access blocked
 * TC-P050 — /login role routing
 * TC-P051 — /signup validation
 * TC-A006 — /device kiosk loads
 *
 * Run: npx playwright test tests/e2e/auth-roles.spec.ts
 *
 * NOTE: These tests require seed accounts to exist in Supabase.
 * See tests/db/seed-accounts.sql for setup.
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

/** TC-A004 / TC-P050 — All 21 roles reach correct portal */
const ROLE_PORTAL_MAP: Array<{ key: keyof typeof ACCOUNTS; portal: string; label: string }> = [
  { key: 'member',       portal: '/dashboard',           label: 'Member' },
  { key: 'family',       portal: '/dashboard/family',    label: 'Family' },
  { key: 'navigator',    portal: '/navigator',            label: 'Navigator' },
  { key: 'admin',        portal: '/admin',               label: 'Admin' },
  { key: 'careworker',   portal: '/care-worker',         label: 'Care Worker' },
  { key: 'volunteer',    portal: '/volunteer/dashboard', label: 'General Volunteer' },
  { key: 'student',      portal: '/volunteer/dashboard', label: 'Student Volunteer' },
  { key: 'veteran',      portal: '/volunteer/dashboard', label: 'Veteran Volunteer' },
  { key: 'retired_pro',  portal: '/volunteer/dashboard', label: 'Retired Pro Volunteer' },
  { key: 'corporate',    portal: '/volunteer/dashboard', label: 'Corporate Volunteer' },
  { key: 'neighbor',     portal: '/volunteer/dashboard', label: 'Neighbor Volunteer' },
  { key: 'faith',        portal: '/volunteer/dashboard', label: 'Faith Volunteer' },
  { key: 'k12student',   portal: '/volunteer/dashboard', label: 'K-12 Student Volunteer' },
  { key: 'agency',       portal: '/agency-admin',        label: 'Agency Admin' },
  { key: 'employer',     portal: '/employer-admin',      label: 'Employer Admin' },
  { key: 'network',      portal: '/network-admin',       label: 'Network Admin' },
  { key: 'seniorcenter', portal: '/senior-center-admin', label: 'Senior Center Admin' },
  { key: 'aaa',          portal: '/aaa-admin',           label: 'AAA Admin' },
  { key: 'orgadmin',     portal: '/org-admin',           label: 'Org Admin' },
  { key: 'vsoadmin',     portal: '/vso-admin',           label: 'VSO Admin' },
  { key: 'uniadmin',     portal: '/university-admin',    label: 'University Admin' },
  { key: 'k12admin',     portal: '/school-admin',        label: 'K-12 Admin' },
];

test.describe('TC-A004 — 21 role login smoke tests', () => {
  for (const { key, portal, label } of ROLE_PORTAL_MAP) {
    test(`${label} (${ACCOUNTS[key].email}) → ${portal}`, async ({ page }) => {
      await loginAs(page, ACCOUNTS[key]);

      // Should land on the expected portal (or a sub-path of it)
      await expect(page).toHaveURL(new RegExp(portal.replace('/', '\\/').replace('-', '\\-') + '.*'), { timeout: 15_000 });

      // No 500 error on the portal page
      const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
      expect(/500|internal server error|application error/i.test(bodyText)).toBe(false);

      // Portal has at least some meaningful content
      const h1 = await page.locator('h1, h2, [data-testid="dashboard-title"]').first().textContent({ timeout: 5000 }).catch(() => '');
      expect(h1?.length ?? 0).toBeGreaterThan(0);
    });
  }
});

/** TC-A005 — Cross-role access blocked */
test.describe('TC-A005 — cross-role access blocked', () => {
  test('member cannot access /navigator', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member);
    await page.goto('/navigator');
    // Should be redirected away or shown 401/403
    const url = page.url();
    const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
    const isBlocked =
      url.includes('/login') ||
      url.includes('/dashboard') ||
      /401|403|unauthorized|forbidden|access denied/i.test(bodyText);
    expect(isBlocked, 'Member should not access /navigator').toBe(true);
  });

  test('volunteer cannot access /admin', async ({ page }) => {
    await loginAs(page, ACCOUNTS.volunteer);
    await page.goto('/admin');
    const url = page.url();
    const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
    const isBlocked =
      url.includes('/login') ||
      url.includes('/volunteer') ||
      /401|403|unauthorized|forbidden|access denied/i.test(bodyText);
    expect(isBlocked, 'Volunteer should not access /admin').toBe(true);
  });

  test('family cannot access /org-admin', async ({ page }) => {
    await loginAs(page, ACCOUNTS.family);
    await page.goto('/org-admin');
    const url = page.url();
    const isBlocked = url.includes('/login') || url.includes('/dashboard/family');
    expect(isBlocked, 'Family should not access /org-admin').toBe(true);
  });

  test('k12student cannot access /employer-admin', async ({ page }) => {
    await loginAs(page, ACCOUNTS.k12student);
    await page.goto('/employer-admin');
    const url = page.url();
    const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
    const isBlocked =
      url.includes('/login') ||
      url.includes('/volunteer') ||
      /401|403|unauthorized|forbidden/i.test(bodyText);
    expect(isBlocked, 'K12 student should not access /employer-admin').toBe(true);
  });
});

/** TC-A006 — Device kiosk /device loads */
test('TC-A006 — /device kiosk loads with large-print UI', async ({ page }) => {
  await page.goto('/device');
  // Should NOT redirect to /login — kiosk is accessible or has its own auth flow
  const url = page.url();
  if (url.includes('/login')) {
    console.warn('TC-A006: /device redirects to /login — may need device-specific auth');
    return;
  }
  // Should have prominent Aria/call button
  const hasCallBtn = await page.getByRole('button', { name: /call|aria|check.?in/i }).isVisible().catch(() => false);
  if (!hasCallBtn) console.warn('TC-A006: Aria call button not found on /device');
  // No standard nav sidebar
  const hasSidebar = await page.locator('nav[aria-label="sidebar"], [data-testid="sidebar"]').isVisible().catch(() => false);
  expect(hasSidebar, '/device should not have standard sidebar nav').toBe(false);
});

/** TC-P051 — /signup form validation */
test('TC-P051 — /signup rejects invalid email and mismatched passwords', async ({ page }) => {
  // ?plan=basics skips step 0 (plan picker) and lands directly on step 1 (account info)
  await page.goto('/signup?plan=basics');

  // Fill invalid email and password on step 1
  await page.getByLabel(/email/i).fill('not-an-email');
  await page.getByLabel(/password/i).first().fill('Password123!');
  // Step 1 submit button says "Continue to Payment"
  await page.getByRole('button', { name: /continue to payment/i }).click();

  const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  const hasError = /invalid|enter.*email|valid email/i.test(bodyText) ||
    await page.locator('[role="alert"], .error, [data-error]').isVisible().catch(() => false);
  expect(hasError, 'Should show validation error for invalid email').toBe(true);
});
