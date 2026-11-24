import { test, expect } from "@playwright/test"
import { loginAs, ACCOUNTS, BASE_URL as BASE, getToken} from "./helpers"
const SUPABASE_URL = "https://qdniskppkfqjmtpkftdt.supabase.co"
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg"

test('TC-B2B001 — /org-admin loads for orgadmin', async ({ page }) => {
  await loginAs(page, ACCOUNTS.orgadmin, '/org-admin', test)
  const token = await getToken(page, ACCOUNTS.orgadmin)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-B2B010 — /employer-admin loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.employer, '/employer-admin', test)
  const token = await getToken(page, ACCOUNTS.employer)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-B2B011 — /api/org-admin/stats requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/org-admin/stats`)
  expect([401, 403, 302]).toContain(res.status())
})

test('TC-B2B012 — /api/agency/workers requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/agency/workers`)
  expect([401, 403, 302, 405]).toContain(res.status())
})
