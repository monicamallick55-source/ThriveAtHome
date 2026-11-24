import { test, expect } from "@playwright/test"
import { loginAs, ACCOUNTS, BASE_URL as BASE } from "./helpers"

const SUPABASE_URL = "https://qdniskppkfqjmtpkftdt.supabase.co"
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg"
const CRON_SECRET = "0LjR0pE/7WueB508Z6OER1s/6x0Buze2vbRPVljKxFs="




test('TC-CCF001 — /donate page returns non-500', async ({ page }) => {
  const res = await page.request.get(`${BASE}/donate`)
  expect(res.status()).not.toBe(500)
})

test('TC-CCF002 — /community-care-fund returns non-500', async ({ page }) => {
  const res = await page.request.get(`${BASE}/community-care-fund`)
  expect(res.status()).not.toBe(500)
})

test('TC-CCF003 — /api/donations requires auth', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/donations`, {
    data: { amount: 25, fund: 'community' }, headers: { 'Content-Type': 'application/json' },
  })
  expect([401, 403, 404]).toContain(res.status())
})
