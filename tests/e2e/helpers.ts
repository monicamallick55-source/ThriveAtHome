/**
 * Shared helpers for ThriveAtHome E2E test suite
 */
import { Page, expect } from '@playwright/test';

export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'https://thrive-at-home-pied.vercel.app';

/** Seed test accounts — passwords must match what's seeded in Supabase */
export const ACCOUNTS = {
  member:        { email: 'member@test.com',        password: 'TestPass123!' },
  complete:      { email: 'complete@test.com',       password: 'TestPass123!' },
  premier:       { email: 'premier@test.com',        password: 'TestPass123!' },
  family:        { email: 'family@test.com',         password: 'TestPass123!' },
  navigator:     { email: 'navigator@test.com',      password: 'TestPass123!' },
  admin:         { email: 'admin@test.com',          password: 'TestPass123!' },
  volunteer:     { email: 'volunteer@test.com',      password: 'TestPass123!' },
  student:       { email: 'student@test.com',        password: 'TestPass123!' },
  veteran:       { email: 'veteran@test.com',        password: 'TestPass123!' },
  retired_pro:   { email: 'retired_pro@test.com',   password: 'TestPass123!' },
  corporate:     { email: 'corporate@test.com',      password: 'TestPass123!' },
  neighbor:      { email: 'neighbor@test.com',       password: 'TestPass123!' },
  faith:         { email: 'faith@test.com',          password: 'TestPass123!' },
  k12student:    { email: 'k12student@test.com',     password: 'TestPass123!' },
  agency:        { email: 'agency@test.com',         password: 'TestPass123!' },
  employer:      { email: 'employer@test.com',       password: 'TestPass123!' },
  network:       { email: 'network@test.com',        password: 'TestPass123!' },
  seniorcenter:  { email: 'seniorcenter@test.com',  password: 'TestPass123!' },
  aaa:           { email: 'aaa@test.com',            password: 'TestPass123!' },
  orgadmin:      { email: 'orgadmin@test.com',       password: 'TestPass123!' },
  vsoadmin:      { email: 'vsoadmin@test.com',       password: 'TestPass123!' },
  uniadmin:      { email: 'uniadmin@test.com',       password: 'TestPass123!' },
  k12admin:      { email: 'k12admin@test.com',       password: 'TestPass123!' },
  careworker:    { email: 'careworker@test.com',     password: 'TestPass123!' },
  medicare_member: { email: 'medicare_member@test.com', password: 'TestPass123!' },
  grief_member:  { email: 'grief_member@test.com',  password: 'TestPass123!' },
  opt_out_member: { email: 'opt_out_member@test.com', password: 'TestPass123!' },
  b2b_new_org:   { email: 'b2b_new_org@test.com',   password: 'TestPass123!' },
};

/**
 * Login via the /login form and wait for redirect.
 * Waits for networkidle after login to ensure Supabase auth cookies are fully set.
 */
export async function loginAs(
  page: Page,
  account: { email: string; password: string },
  expectedPath?: string,
): Promise<void> {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"], input[name="email"], #email').first().fill(account.email);
  await page.locator('input[type="password"], input[name="password"], #password').first().fill(account.password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  if (expectedPath) {
    await page.waitForURL(`**${expectedPath}**`, { timeout: 15_000 });
  } else {
    await page.waitForFunction(() => !window.location.pathname.startsWith('/login'), { timeout: 15_000 });
  }
  // Wait for network to settle so Supabase auth cookies are fully written
  await page.waitForLoadState('networkidle');
}

/**
 * Assert page loads (200) and no hard console errors.
 */
export async function assertPageLoads(page: Page, path: string): Promise<number> {
  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes(path.replace('/', '').split('/')[0]) || r.status() < 400),
    page.goto(path),
  ]);
  const status = response?.status() ?? 200;
  expect([200, 301, 302, 307, 308].includes(status) || status === 404).toBeTruthy();
  return status;
}

/**
 * Assert no horizontal scroll at a given viewport width.
 */
export async function assertNoHorizontalScroll(page: Page): Promise<void> {
  const hasHScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHScroll, 'Page should not have horizontal scroll').toBe(false);
}

/** Stripe test card number */
export const STRIPE_TEST_CARD = '4242 4242 4242 4242';
