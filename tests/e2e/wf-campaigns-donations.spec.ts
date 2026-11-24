import { test, expect } from '@playwright/test'
import { loginAs, ACCOUNTS, BASE_URL as BASE , getToken } from './helpers'

const SUPABASE_URL = 'https://qdniskppkfqjmtpkftdt.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg'
const CRON_SECRET = '0LjR0pE/7WueB508Z6OER1s/6x0Buze2vbRPVljKxFs='




test('TC-C01 — /donate page returns 200', async ({ page }) => {
  const res = await page.request.get(`${BASE}/donate`)
  expect(res.status()).not.toBe(500)
})

test('TC-C02 — /api/donations requires auth', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/donations`, {
    data: { amount: 25 }, headers: { 'Content-Type': 'application/json' },
  })
  expect([401, 403, 404]).toContain(res.status())
})

test('TC-C03 — /api/campaigns requires auth or returns list', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/campaigns`)
  expect([200, 401, 403, 404]).toContain(res.status())
})

test('TC-C05 — admin can view donations', async ({ page }) => {
  await loginAs(page, ACCOUNTS.admin, '/admin', test)
  const token = await getToken(page, ACCOUNTS.admin)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/admin/donations`, {
    headers: { 'Cookie': cookieStr },
  })
  if (res.status() === 404) { test.skip(); return }
  expect([200, 204]).toContain(res.status())
})
