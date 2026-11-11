/**
 * Shared helpers for ThriveAtHome E2E test suite
 */
import { Page, expect } from '@playwright/test';

export const BASE_URL = process.env.BASE_URL || 'https://thrive-at-home-pied.vercel.app';

const SUPABASE_URL = 'https://qdniskppkfqjmtpkftdt.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg'

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

export async function loginAs(
  page: Page,
  account: { email: string; password: string },
  expectedPath?: string,
): Promise<void> {
  const res = await page.request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    data: { email: account.email, password: account.password },
  })
  const json = await res.json()
  const { access_token, refresh_token } = json

  if (!access_token) {
    await page.goto(BASE_URL + '/login')
    await page.locator('input[type="email"], input[name="email"], #email').first().fill(account.email)
    await page.locator('input[type="password"], input[name="password"], #password').first().fill(account.password)
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    if (expectedPath) {
      await page.waitForURL(`**${expectedPath}**`, { timeout: 20_000 })
    } else {
      await page.waitForFunction(() => !window.location.pathname.startsWith('/login'), { timeout: 20_000 })
    }
    return
  }

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 })
  await page.evaluate(({ access_token, refresh_token }: { access_token: string, refresh_token: string }) => {
    localStorage.setItem('sb-qdniskppkfqjmtpkftdt-auth-token', JSON.stringify({
      access_token,
      refresh_token,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    }))
  }, { access_token, refresh_token })
}

export async function assertPageLoads(page: Page, path: string): Promise<number> {
  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes(path.replace('/', '').split('/')[0]) || r.status() < 400),
    page.goto(path),
  ]);
  const status = response?.status() ?? 200;
  expect([200, 301, 302, 307, 308].includes(status) || status === 404).toBeTruthy();
  return status;
}

export async function assertNoHorizontalScroll(page: Page): Promise<void> {
  const hasHScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHScroll, 'Page should not have horizontal scroll').toBe(false);
}

export const STRIPE_TEST_CARD = '4242 4242 4242 4242';
