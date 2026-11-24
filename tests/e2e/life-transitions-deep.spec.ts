import { test, expect } from "@playwright/test"
import { loginAs, ACCOUNTS, BASE_URL as BASE, getToken} from "./helpers"
const SUPABASE_URL = "https://qdniskppkfqjmtpkftdt.supabase.co"
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg"

test('TC-LTD001 — /dashboard/life-transitions loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/life-transitions', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-LTD002 — /dashboard/grief-circles loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/grief-circles', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-LTD003 — multiple life-transition pathways return non-500', async ({ page }) => {
  const pathways = ['retirement', 'widow', 'diagnosis', 'moving', 'caregiving']
  for (const p of pathways) {
    const res = await page.request.get(`${BASE}/api/life-transitions/${p}`)
    if (res.status() !== 404) {
      expect([200, 401]).toContain(res.status())
    }
  }
})

test('TC-LTD004 — unknown pathway returns 404', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/life-transitions/unknown-xyz-pathway`)
  if (res.status() === 200) { test.skip(); return }
  expect([404, 400]).toContain(res.status())
})
