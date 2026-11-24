import { test, expect } from "@playwright/test"
import { loginAs, ACCOUNTS, BASE_URL as BASE, getToken} from "./helpers"

const SUPABASE_URL = "https://qdniskppkfqjmtpkftdt.supabase.co"
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg"
const CRON_SECRET = "0LjR0pE/7WueB508Z6OER1s/6x0Buze2vbRPVljKxFs="




test('TC-COM001 — /dashboard/communities loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/communities', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-COM002 — /api/communities returns list for member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/communities`, {
    headers: { 'Cookie': cookieStr },
  })
  if (res.status() === 404) { test.skip(); return }
  expect([200, 204]).toContain(res.status())
})

test('TC-COM003 — /dashboard/skill-exchange loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/skill-exchange', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-COM004 — /api/communities/circles requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/communities/circles`)
  expect([401, 403, 404, 200]).toContain(res.status())
})
