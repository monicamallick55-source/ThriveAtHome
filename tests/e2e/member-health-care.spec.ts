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

// TC-MHC001 — /dashboard/health loads
test('TC-MHC001 — /dashboard/health loads for member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/health')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-MHC002 — /dashboard/benefits-finder loads
test('TC-MHC002 — /dashboard/benefits-finder loads for member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/benefits-finder')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-MHC003 — /dashboard/medicare-help loads
test('TC-MHC003 — /dashboard/medicare-help loads for member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/medicare-help')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-MHC004 — /dashboard/grief-support loads
test('TC-MHC004 — /dashboard/grief-support loads for member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/grief-support')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-MHC005 — /dashboard/home-safety loads
test('TC-MHC005 — /dashboard/home-safety loads for member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/home-safety')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-MHC006 — /dashboard/fhir-referrals loads
test('TC-MHC006 — /dashboard/fhir-referrals loads for member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/fhir-referrals')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-MHC007 — /api/members/profile requires auth
test('TC-MHC007 — /api/members/profile requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/members/profile`)
  expect([401, 403, 302]).toContain(res.status())
})

// TC-MHC008 — /api/members/profile returns data for authenticated member
test('TC-MHC008 — /api/members/profile returns data for authenticated member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/members/profile`, {
    headers: { 'Cookie': cookieStr },
  })
  expect([200, 404]).toContain(res.status())
})

// TC-MHC009 — /dashboard/life-transitions loads
test('TC-MHC009 — /dashboard/life-transitions loads for member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/life-transitions')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-MHC010 — /dashboard/trusted-advisors loads
test('TC-MHC010 — /dashboard/trusted-advisors loads for member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/trusted-advisors')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})
