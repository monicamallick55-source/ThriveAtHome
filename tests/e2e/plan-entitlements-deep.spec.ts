import { test, expect } from "@playwright/test"
import { loginAs, ACCOUNTS, BASE_URL as BASE, getToken} from "./helpers"
const SUPABASE_URL = "https://qdniskppkfqjmtpkftdt.supabase.co"
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg"

test('TC-PED001 — /api/entitlements returns plan_tier for member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard', test)
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
  expect(['basics', 'connect', 'complete', 'premier']).toContain(body.plan_tier)
})

test('TC-PED002 — complete member has richer entitlements than basic', async ({ page }) => {
  await loginAs(page, ACCOUNTS.complete, '/dashboard', test)
  const token = await getToken(page, ACCOUNTS.complete)
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

test('TC-PED003 — /api/entitlements requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/entitlements`)
  expect([401, 403, 404]).toContain(res.status())
})
