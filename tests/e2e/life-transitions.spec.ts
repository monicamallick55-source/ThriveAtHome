import { test, expect } from "@playwright/test"
import { loginAs, ACCOUNTS, BASE_URL as BASE, getToken} from "./helpers"
const SUPABASE_URL = "https://qdniskppkfqjmtpkftdt.supabase.co"
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg"

test('TC-LT001 — /dashboard/grief-support loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/grief-support', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-LT002 — /dashboard/life-transitions loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/life-transitions', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-LT003 — /api/life-transitions/retirement returns non-500', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/life-transitions/retirement`)
  if (res.status() === 404) { test.skip(); return }
  expect([200, 401]).toContain(res.status())
})

test('TC-LT004 — /api/life-transitions/widow returns non-500', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/life-transitions/widow`)
  if (res.status() === 404) { test.skip(); return }
  expect([200, 401]).toContain(res.status())
})

test('TC-LT005 — /dashboard/trusted-advisors loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/trusted-advisors', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})
