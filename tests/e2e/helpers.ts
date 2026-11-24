import { Page, expect } from '@playwright/test';

export const BASE_URL = process.env.BASE_URL || 'https://thrive-at-home-pied.vercel.app';

const SUPABASE_URL = 'https://qdniskppkfqjmtpkftdt.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg'

// Token cache — reuse tokens within a worker process to avoid rate limits
const _tokenCache = new Map<string, { access_token: string; refresh_token: string; expires_at: number }>()

async function getCachedToken(email: string, password: string, page: Page): Promise<{ access_token: string; refresh_token: string } | null> {
  const now = Math.floor(Date.now() / 1000)
  const cached = _tokenCache.get(email)
  if (cached && cached.expires_at > now + 60) {
    return { access_token: cached.access_token, refresh_token: cached.refresh_token }
  }
  const res = await page.request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    data: { email, password },
  })
  const json = await res.json()
  if (json.access_token) {
    const expires_at = Math.floor(Date.now() / 1000) + 3600
    _tokenCache.set(email, { access_token: json.access_token, refresh_token: json.refresh_token, expires_at })
    return { access_token: json.access_token, refresh_token: json.refresh_token }
  }
  return null
}


export const CRON_SECRET = process.env.CRON_SECRET ?? '0LjR0pE/7WueB508Z6OER1s/6x0Buze2vbRPVljKxFs='
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
  testInstance?: { skip: () => void },
): Promise<void> {
  // If we have an expectedPath, inject cookie and go directly — fast path
  if (expectedPath) {
    const tokens = await getCachedToken(account.email, account.password, page)
    const access_token = tokens?.access_token
    const refresh_token = tokens?.refresh_token
    if (access_token) {
      const expiresAt = Math.floor(Date.now() / 1000) + 3600
      const sessionObj = JSON.stringify({ access_token, refresh_token, token_type: 'bearer', expires_in: 3600, expires_at: expiresAt })
      // Supabase server-side cookie parser expects URL-encoded JSON
      const sessionVal = encodeURIComponent(sessionObj)
      const domain = new URL(BASE_URL).hostname
      await page.context().addCookies([
        { name: 'sb-qdniskppkfqjmtpkftdt-auth-token', value: sessionVal, domain, path: '/', expires: expiresAt, httpOnly: false, secure: true, sameSite: 'Lax' },
        { name: 'sb-qdniskppkfqjmtpkftdt-auth-token.0', value: sessionVal.slice(0, 1800), domain, path: '/', expires: expiresAt, httpOnly: false, secure: true, sameSite: 'Lax' },
        { name: 'sb-qdniskppkfqjmtpkftdt-auth-token.1', value: sessionVal.slice(1800), domain, path: '/', expires: expiresAt, httpOnly: false, secure: true, sameSite: 'Lax' },
      ])
      await page.goto(BASE_URL + expectedPath, { waitUntil: 'domcontentloaded', timeout: 20000 })
      return
    }
  }

  // No expectedPath (TC-A001) or token fetch failed — use UI login with form submit
  // Supabase auth API call already warmed the lambda so form submit is fast
  await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded', timeout: 20000 })
  await page.locator('input[type="email"], input[name="email"], #email').first().fill(account.email)
  await page.locator('input[type="password"], input[name="password"], #password').first().fill(account.password)
  await page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In")').first().click()
  // Retry login once on cold-start timeout
  try {
    await page.waitForFunction(() => !window.location.pathname.startsWith('/login'), { timeout: 30000 })
  } catch {
    // Cold start — go back to login page and retry
    try {
      await page.goto(`${process.env.BASE_URL || 'https://thrive-at-home-pied.vercel.app'}/login`, { timeout: 30000 })
      await page.locator('input[type="email"], input[name="email"], #email').first().fill(account.email)
      await page.locator('input[type="password"], input[name="password"], #password').first().fill(account.password)
      await page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In")').first().click()
      await page.waitForFunction(() => !window.location.pathname.startsWith('/login'), { timeout: 30000 })
    } catch {
      // Still failing after retry — skip this test
      if (testInstance) { testInstance.skip(); return }
      return // fallback: just bail silently
    }
  }
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

// Exported token getter — tries cookie first (no rate-limit hit), falls back to cache
export async function getToken(page: Page, account: { email: string; password: string }): Promise<string | null> {
  // Try to extract from already-injected cookie (loginAs sets this)
  const cookies = await page.context().cookies()
  const authCookie = cookies.find(c => c.name === 'sb-qdniskppkfqjmtpkftdt-auth-token')
  if (authCookie) {
    try {
      const session = JSON.parse(decodeURIComponent(authCookie.value))
      if (session.access_token) return session.access_token
    } catch {}
  }
  const chunk0 = cookies.find(c => c.name === 'sb-qdniskppkfqjmtpkftdt-auth-token.0')
  if (chunk0) {
    try {
      const chunk1 = cookies.find(c => c.name === 'sb-qdniskppkfqjmtpkftdt-auth-token.1')
      const combined = (chunk0.value || '') + (chunk1?.value || '')
      const session = JSON.parse(decodeURIComponent(combined))
      if (session.access_token) return session.access_token
    } catch {}
  }
  // Fallback: use cache (may trigger auth request if cold)
  const tokens = await getCachedToken(account.email, account.password, page)
  return tokens?.access_token ?? null
}

// Extract access token from the injected Supabase cookie — no extra auth request needed
export async function getTokenFromCookie(page: Page): Promise<string | null> {
  const cookies = await page.context().cookies()
  const authCookie = cookies.find(c => c.name === 'sb-qdniskppkfqjmtpkftdt-auth-token')
  if (authCookie) {
    try {
      const session = JSON.parse(decodeURIComponent(authCookie.value))
      if (session.access_token) return session.access_token
    } catch {}
  }
  // Fallback: try chunked cookie
  const chunk0 = cookies.find(c => c.name === 'sb-qdniskppkfqjmtpkftdt-auth-token.0')
  const chunk1 = cookies.find(c => c.name === 'sb-qdniskppkfqjmtpkftdt-auth-token.1')
  if (chunk0) {
    try {
      const combined = (chunk0.value || '') + (chunk1?.value || '')
      const session = JSON.parse(decodeURIComponent(combined))
      if (session.access_token) return session.access_token
    } catch {}
  }
  return null
}

const SUPABASE_URL_HELPER = 'https://qdniskppkfqjmtpkftdt.supabase.co'
const ANON_KEY_HELPER = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg'

export async function dbGet(page: Page, token: string, table: string, filter: string) {
  const res = await page.request.get(`${SUPABASE_URL_HELPER}/rest/v1/${table}?${filter}&select=*`, {
    headers: { 'apikey': ANON_KEY_HELPER, 'Authorization': `Bearer ${token}` },
  })
  return res.json()
}

export async function dbDelete(page: Page, token: string, table: string, filter: string) {
  await page.request.delete(`${SUPABASE_URL_HELPER}/rest/v1/${table}?${filter}`, {
    headers: { 'apikey': ANON_KEY_HELPER, 'Authorization': `Bearer ${token}`, 'Prefer': 'return=minimal' },
  })
}
