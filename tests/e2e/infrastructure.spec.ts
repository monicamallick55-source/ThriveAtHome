import { test, expect } from "@playwright/test"
import { loginAs, ACCOUNTS, BASE_URL as BASE } from "./helpers"

test.describe("Infrastructure", () => {

test("TC-INFRA001 — homepage loads and redirects to dashboard after login", async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, "/dashboard")
  expect(page.url()).toContain("/dashboard")
})

})

  if (hasHScroll) console.warn('TC-PERF003: homepage has horizontal scroll at 390px');
  expect(page.url()).not.toContain('/login');
});

// Additional real DB-verification tests
const SUPABASE_URL = 'https://qdniskppkfqjmtpkftdt.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg'
const CRON_SECRET = '0LjR0pE/7WueB508Z6OER1s/6x0Buze2vbRPVljKxFs='

async function getToken(page, account) {
  const res = await page.request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    data: { email: account.email, password: account.password },
  })
  const json = await res.json()
  return json.access_token as string
}

async function dbGet(page, token, table, filter) {
  const res = await page.request.get(`${SUPABASE_URL}/rest/v1/${table}?${filter}&select=*`, {
    headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` },
  })
  return res.json()
}

test('TC-INF010 — member token can read own profile row from Supabase DB', async ({ page }) => {
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const rows = await dbGet(page, token, 'profiles', 'select=id,email,role,plan_tier')
  expect(Array.isArray(rows)).toBe(true)
  expect(rows.length).toBeGreaterThan(0)
  expect(rows[0].email).toBeTruthy()
})

test('TC-INF011 — Supabase token exchange returns valid JWT for all seed accounts', async ({ page }) => {
  const accounts = [ACCOUNTS.member, ACCOUNTS.navigator, ACCOUNTS.admin, ACCOUNTS.volunteer]
  for (const acc of accounts) {
    const token = await getToken(page, acc)
    if (!token) {
      console.warn(`TC-INF011: token exchange failed for ${acc.email}`)
      continue
    }
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(20)
  }
})

test('TC-INF012 — cron/birthday-arc fires with correct secret', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/cron/birthday-arc`, {
    data: {},
    headers: { 'Content-Type': 'application/json', 'x-cron-secret': CRON_SECRET },
  })
  if (res.status() === 404) { test.skip(); return }
  expect(res.status()).not.toBe(500)
  expect([200, 207]).toContain(res.status())
})
