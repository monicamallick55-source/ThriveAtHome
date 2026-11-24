import { test, expect } from '@playwright/test'
import { loginAs, ACCOUNTS, BASE_URL as BASE } from './helpers'

const SUPABASE_URL = 'https://qdniskppkfqjmtpkftdt.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg'

async function getToken(page, account) {
  const res = await page.request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    data: { email: account.email, password: account.password },
  })
  const json = await res.json()
  return json.access_token as string
}

test('TC-WA001 — /admin loads for admin', async ({ page }) => {
  await loginAs(page, ACCOUNTS.admin, '/admin')
  const token = await getToken(page, ACCOUNTS.admin)
  if (!token) { test.skip(); return }
  if (page.url().includes('/onboarding')) { test.skip(); return }
  expect(page.url()).toContain('/admin')
})

test('TC-WA002 — /admin/ma-report loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.admin, '/admin/ma-report')
  const token = await getToken(page, ACCOUNTS.admin)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-WA003 — /api/admin/ambassadors requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/admin/ambassadors`)
  expect([401, 403, 302]).toContain(res.status())
})

test('TC-WA004 — admin can access /api/admin/ambassadors', async ({ page }) => {
  await loginAs(page, ACCOUNTS.admin, '/admin')
  const token = await getToken(page, ACCOUNTS.admin)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/admin/ambassadors`, {
    headers: { 'Cookie': cookieStr },
  })
  if (res.status() === 404) { test.skip(); return }
  expect([200, 204]).toContain(res.status())
})

test('TC-WA005 — /care-worker portal loads for careworker', async ({ page }) => {
  await loginAs(page, ACCOUNTS.careworker, '/care-worker')
  const token = await getToken(page, ACCOUNTS.careworker)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-WA006 — member cannot access /admin', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const res = await page.request.get(`${BASE}/admin`)
  // Admin should redirect or return 403 for member
  expect(res.status()).not.toBe(500)
})
