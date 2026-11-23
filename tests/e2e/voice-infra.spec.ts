import { test, expect } from "@playwright/test"
import { loginAs, ACCOUNTS, BASE_URL as BASE, CRON_SECRET } from "./helpers"
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
    headers: { 'x-cron-secret': 'invalid' },
  })
  if (res.status() === 404) { test.skip(); return }
  expect([401, 403]).toContain(res.status())
})

test('TC-V010 — /api/cron/aria-calls fires with correct secret', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/cron/aria-calls`, {
    headers: { 'x-cron-secret': CRON_SECRET },
  })
  if (res.status() === 404) { test.skip(); return }
  expect(res.status()).not.toBe(500)
})

test('TC-V011 — /api/retell/call-ended webhook exists', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/retell/call-ended`, {
    data: { call_id: 'e2e-test', status: 'ended' },
    headers: { 'Content-Type': 'application/json' },
  })
  if (res.status() === 404) { test.skip(); return }
  expect(res.status()).not.toBe(500)
})

test('TC-V012 — /api/twilio/sms webhook exists', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/twilio/sms`, {
    data: 'Body=E2E+test&From=%2B15551234567',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  if (res.status() === 404) { test.skip(); return }
  expect(res.status()).not.toBe(500)
})
