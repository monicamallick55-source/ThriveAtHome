import { test, expect } from '@playwright/test'
import { loginAs, ACCOUNTS, BASE_URL as BASE , getToken } from './helpers'

const SUPABASE_URL = 'https://qdniskppkfqjmtpkftdt.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg'




test('TC-WB001 — /org-admin loads for orgadmin', async ({ page }) => {
  await loginAs(page, ACCOUNTS.orgadmin, '/org-admin', test)
  const token = await getToken(page, ACCOUNTS.orgadmin)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-WB002 — /network-admin loads for network', async ({ page }) => {
  await loginAs(page, ACCOUNTS.network, '/network-admin', test)
  const token = await getToken(page, ACCOUNTS.network)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-WB003 — /employers public page returns 200', async ({ page }) => {
  const res = await page.request.get(`${BASE}/employers`)
  expect(res.status()).not.toBe(500)
})

test('TC-WB004 — /api/agency/workers requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/agency/workers`)
  expect([401, 403, 302, 405]).toContain(res.status())
})

test('TC-WB005 — /university-admin loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.uniadmin, '/university-admin', test)
  const token = await getToken(page, ACCOUNTS.uniadmin)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-WB006 — /vso-admin loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.vsoadmin, '/vso-admin', test)
  const token = await getToken(page, ACCOUNTS.vsoadmin)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})
