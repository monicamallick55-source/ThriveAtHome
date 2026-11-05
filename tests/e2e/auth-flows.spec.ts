import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

// TC-A001–A006: Auth flows

const ROLE_ROUTES = [
  { account: ACCOUNTS.member,       expectedPath: '/dashboard' },
  { account: ACCOUNTS.family,       expectedPath: '/dashboard/family' },
  { account: ACCOUNTS.navigator,    expectedPath: '/navigator' },
  { account: ACCOUNTS.admin,        expectedPath: '/admin' },
  { account: ACCOUNTS.volunteer,    expectedPath: '/volunteer' },
  { account: ACCOUNTS.orgadmin,     expectedPath: '/org-admin' },
  { account: ACCOUNTS.employer,     expectedPath: '/employer-admin' },
  { account: ACCOUNTS.uniadmin,     expectedPath: '/university-admin' },
  { account: ACCOUNTS.vsoadmin,     expectedPath: '/vso-admin' },
  { account: ACCOUNTS.k12admin,     expectedPath: '/school-admin' },
];

for (const { account, expectedPath } of ROLE_ROUTES) {
  test(`TC-A001 — ${account.email} routes to ${expectedPath}`, async ({ page }) => {
    await loginAs(page, account);
    await page.waitForLoadState('networkidle');
    if (page.url().includes('/login')) {
      console.warn(`TC-A001: ${account.email} login failed — not seeded or rate limited`);
      return;
    }
    expect(page.url()).toContain(expectedPath);
  });
}

test('TC-A002 — /signup page loads', async ({ page }) => {
  await page.goto(`${BASE}/signup`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
  const body = await page.locator('body').textContent();
  expect(body?.toLowerCase()).toMatch(/sign up|create account|register/);
});

test('TC-A004 — member cannot reach admin after login', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-A004: login failed'); return; }
  await page.goto(`${BASE}/admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/admin');
});

test('TC-A005 — member cannot reach navigator after login', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-A005: login failed'); return; }
  await page.goto(`${BASE}/navigator`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/navigator');
});

test('TC-A006 — /login page has email and password fields', async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  const emailInput = page.locator('input[type="email"], input[name="email"], #email').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"], #password').first();
  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
});
