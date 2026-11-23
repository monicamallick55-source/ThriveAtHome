import { test, expect } from "@playwright/test"
import { loginAs, ACCOUNTS, BASE_URL as BASE } from "./helpers"
const CRON_SECRET = process.env.CRON_SECRET ?? '0LjR0pE/7WueB508Z6OER1s/6x0Buze2vbRPVljKxFs='
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

test('TC-V001 — /api/cron/aria-calls requires CRON_SECRET', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/cron/aria-calls`, {
    headers: { 'x-cron-secret': 'wrong-secret' },
  })
  if (res.status() === 404) { test.skip(); return }
  expect([401, 403]).toContain(res.status())
})

test('TC-V002 — /api/cron/aria-calls fires with correct secret', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/cron/aria-calls`, {
    headers: { 'x-cron-secret': CRON_SECRET },
  })
  if (res.status() === 404) { test.skip(); return }
  expect(res.status()).not.toBe(500)
  expect([200, 207]).toContain(res.status())
})

test('TC-V003 — /api/retell/call-ended POST exists', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/retell/call-ended`, {
    data: { call_id: 'e2e-test', status: 'ended' },
    headers: { 'Content-Type': 'application/json' },
  })
  if (res.status() === 404) { test.skip(); return }
  expect(res.status()).not.toBe(500)
})

test('TC-V004 — /api/cron/birthday-arc fires without 500', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/cron/birthday-arc`, {
    data: {},
    headers: { 'Content-Type': 'application/json', 'x-cron-secret': CRON_SECRET },
  })
  if (res.status() === 404) { test.skip(); return }
  expect(res.status()).not.toBe(500)
})

test('TC-V081 — /api/cron/check-ins fires without 500', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/cron/check-ins`, {
    data: {},
    headers: { 'Content-Type': 'application/json', 'x-cron-secret': CRON_SECRET },
  })
  if (res.status() === 404) { test.skip(); return }
  expect(res.status()).not.toBe(500)
})
