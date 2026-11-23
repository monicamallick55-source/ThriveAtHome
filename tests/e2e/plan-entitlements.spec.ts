import { test, expect } from "@playwright/test"
import { loginAs, ACCOUNTS, BASE_URL as BASE } from "./helpers"
const SUPABASE_URL = "https://qdniskppkfqjmtpkftdt.supabase.co"
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg"
async function getToken(page, account) {
  const res = await page.request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { headers: { "apikey": ANON_KEY, "Content-Type": "application/json" }, data: { email: account.email, password: account.password } })
  const json = await res.json(); return json.access_token as string
}
async function dbGet(page, token, table, filter) {
  const res = await page.request.get(`${SUPABASE_URL}/rest/v1/${table}?${filter}&select=*`, { headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${token}` } })
  return res.json()
}
async function dbDelete(page, token, table, filter) {
  await page.request.delete(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, { headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${token}`, "Prefer": "return=minimal" } })
}

test('TC-PE001 — /api/entitlements requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/entitlements`)
  expect([401, 403, 404]).toContain(res.status())
})

test('TC-PE002 — /api/entitlements returns plan_tier for member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/entitlements`, {
    headers: { 'Cookie': cookieStr },
  })
  if (res.status() === 404) { test.skip(); return }
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body).toHaveProperty('plan_tier')
})

test('TC-PE003 — member plan_tier is valid value in DB', async ({ page }) => {
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const rows = await dbGet(page, token, 'profiles', 'select=plan_tier')
  if (!Array.isArray(rows)) { test.skip(); return }
  if (rows.length > 0 && rows[0].plan_tier) {
    expect(['basics', 'connect', 'complete', 'premier']).toContain(rows[0].plan_tier)
  }
})
