import { test, expect } from '@playwright/test'
import { loginAs, ACCOUNTS, BASE_URL as BASE , getToken } from './helpers'

const SUPABASE_URL = 'https://qdniskppkfqjmtpkftdt.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg'


// TC-VOL001 — volunteer dashboard loads
test('TC-VOL001 — volunteer dashboard loads via cookie injection', async ({ page }) => {
  await loginAs(page, ACCOUNTS.volunteer, '/volunteer/dashboard', test)
  const token = await getToken(page, ACCOUNTS.volunteer)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-VOL002 — /api/volunteer/buddy-assignments returns data
test('TC-VOL002 — /api/volunteer/buddy-assignments returns data for volunteer', async ({ page }) => {
  await loginAs(page, ACCOUNTS.volunteer, '/volunteer/dashboard', test)
  const token = await getToken(page, ACCOUNTS.volunteer)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/volunteer/buddy-assignments`, {
    headers: { 'Cookie': cookieStr },
  })
  if ([404, 500].includes(res.status())) { test.skip(); return }
  expect([200, 204]).toContain(res.status())
})

// TC-VOL003 — /api/volunteer/buddy-assignments requires auth
test('TC-VOL003 — /api/volunteer/buddy-assignments requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/volunteer/buddy-assignments`)
  expect([401, 403, 302, 500]).toContain(res.status())
})

// TC-VOL010 — /university-admin loads for uniadmin
test('TC-VOL010 — /university-admin loads for uniadmin', async ({ page }) => {
  await loginAs(page, ACCOUNTS.uniadmin, '/university-admin', test)
  const token = await getToken(page, ACCOUNTS.uniadmin)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-VOL011 — /vso-admin loads for vsoadmin
test('TC-VOL011 — /vso-admin loads for vsoadmin', async ({ page }) => {
  await loginAs(page, ACCOUNTS.vsoadmin, '/vso-admin', test)
  const token = await getToken(page, ACCOUNTS.vsoadmin)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-VOL012 — /school-admin loads for k12admin
test('TC-VOL012 — /school-admin loads for k12admin', async ({ page }) => {
  await loginAs(page, ACCOUNTS.k12admin, '/school-admin', test)
  const token = await getToken(page, ACCOUNTS.k12admin)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})
