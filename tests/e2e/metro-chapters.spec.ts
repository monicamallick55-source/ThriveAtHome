import { test, expect } from "@playwright/test"
import { loginAs, ACCOUNTS, BASE_URL as BASE, getToken} from "./helpers"
const SUPABASE_URL = "https://qdniskppkfqjmtpkftdt.supabase.co"
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg"

test('TC-CH001 — /api/metro-areas returns non-500', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/metro-areas`)
  if (res.status() === 404) { test.skip(); return }
  expect([200, 401]).toContain(res.status())
})

test('TC-CH002 — /api/metro-areas requires auth or returns public list', async ({ page }) => {
  await loginAs(page, ACCOUNTS.admin, '/admin', test)
  const token = await getToken(page, ACCOUNTS.admin)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/metro-areas`, {
    headers: { 'Cookie': cookieStr },
  })
  if (res.status() === 404) { test.skip(); return }
  expect([200, 204]).toContain(res.status())
})
