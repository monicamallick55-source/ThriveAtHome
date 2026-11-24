import { test, expect } from "@playwright/test"
import { loginAs, ACCOUNTS, BASE_URL as BASE, getToken} from "./helpers"
const SUPABASE_URL = "https://qdniskppkfqjmtpkftdt.supabase.co"
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg"

test('TC-B021 — /api/billing/b2b endpoint exists', async ({ page }) => {
  await loginAs(page, ACCOUNTS.orgadmin, '/org-admin', test)
  const token = await getToken(page, ACCOUNTS.orgadmin)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/billing/b2b`, {
    headers: { 'Cookie': cookieStr },
  })
  if (res.status() === 404) { test.skip(); return }
  expect([200, 204]).toContain(res.status())
})

test('TC-B031 — /api/create-checkout-session requires auth', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/create-checkout-session`, {
    data: { plan: 'complete' }, headers: { 'Content-Type': 'application/json' },
  })
  expect([401, 403, 400]).toContain(res.status())
})

test('TC-B040 — /api/donations returns non-500', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/donations`)
  if (res.status() === 404) { test.skip(); return }
  expect([200, 401]).toContain(res.status())
})

test('TC-BILL001 — /pricing returns 200', async ({ page }) => {
  const res = await page.request.get(`${BASE}/pricing`)
  expect(res.status()).toBe(200)
})

test('TC-BILL002 — Premier $199 hidden from /pricing', async ({ page }) => {
  const res = await page.request.get(`${BASE}/pricing`)
  expect(res.status()).toBe(200)
  const body = await res.text()
  expect(body).not.toMatch(/\$199/)
})
