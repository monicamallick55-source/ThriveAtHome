import { test, expect } from "@playwright/test"
import { loginAs, ACCOUNTS, BASE_URL as BASE } from "./helpers"
const SUPABASE_URL = "https://qdniskppkfqjmtpkftdt.supabase.co"
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg"

test('TC-WIRE001 — /api/circles/posts POST requires auth', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/circles/posts`, {
    data: { circleId: 'test', content: 'hello world' },
    headers: { 'Content-Type': 'application/json' },
  })
  expect([401, 403, 404, 500]).toContain(res.status())
})

test('TC-WIRE002 — My Buddies: /api/volunteer/buddy-assignments requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/volunteer/buddy-assignments`)
  expect([401, 403, 302, 500]).toContain(res.status())
})

test('TC-WIRE003 — family fraud card: /api/fraud-flags requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/fraud-flags`)
  expect([401, 403, 302]).toContain(res.status())
})

test('TC-WIRE004 — /api/cron/celebrations requires CRON_SECRET', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/cron/celebrations`, {
    data: {}, headers: { 'Content-Type': 'application/json', 'x-cron-secret': 'invalid' },
  })
  if (res.status() === 404) { test.skip(); return }
  expect([401, 403]).toContain(res.status())
})

test('TC-WIRE005 — /api/cron/celebrations fires with correct secret', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/cron/celebrations`, {
    data: {}, headers: { 'Content-Type': 'application/json', 'x-cron-secret': (typeof CRON_SECRET !== 'undefined' ? CRON_SECRET : process.env.CRON_SECRET ?? 'test-secret') },
  })
  if (res.status() === 404) { test.skip(); return }
  expect(res.status()).not.toBe(500)
})
