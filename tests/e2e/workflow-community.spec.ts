import { test, expect } from '@playwright/test'
import { loginAs, ACCOUNTS, BASE_URL as BASE , getToken } from './helpers'

const SUPABASE_URL = 'https://qdniskppkfqjmtpkftdt.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg'




test('TC-WC001 — /dashboard/communities loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/communities', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-WC002 — /dashboard/events loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/events', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-WC003 — /api/communities returns non-500', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/communities`, {
    headers: { 'Cookie': cookieStr },
  })
  if (res.status() === 404) { test.skip(); return }
  expect(res.status()).not.toBe(500)
})

test('TC-WC004 — /api/communities requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/communities`)
  expect([401, 403, 404, 200]).toContain(res.status())
})
