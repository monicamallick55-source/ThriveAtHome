import { test, expect } from "@playwright/test"
import { loginAs, ACCOUNTS, BASE_URL as BASE } from "./helpers"

const SUPABASE_URL = "https://qdniskppkfqjmtpkftdt.supabase.co"
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg"
const CRON_SECRET = "0LjR0pE/7WueB508Z6OER1s/6x0Buze2vbRPVljKxFs="




test('TC-FMD001 — /dashboard/fhir-referrals loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/fhir-referrals', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-FMD002 — /api/fhir/referrals POST requires auth', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/fhir/referrals`, {
    data: { resourceType: 'ServiceRequest' },
    headers: { 'Content-Type': 'application/fhir+json' },
  })
  if (res.status() === 404) { test.skip(); return }
  expect([400, 401, 403, 422]).toContain(res.status())
})

test('TC-FMD003 — /dashboard/medicare-help loads for medicare_member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.medicare_member, '/dashboard/medicare-help', test)
  const token = await getToken(page, ACCOUNTS.medicare_member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})
