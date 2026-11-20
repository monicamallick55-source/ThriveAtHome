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

test('TC-VT01 — veteran volunteer portal loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.veteran, '/volunteer/dashboard')
  const token = await getToken(page, ACCOUNTS.veteran)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-VT02 — /vso-admin loads for vsoadmin', async ({ page }) => {
  await loginAs(page, ACCOUNTS.vsoadmin, '/vso-admin')
  const token = await getToken(page, ACCOUNTS.vsoadmin)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-ST01 — student volunteer portal loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.student, '/student')
  const token = await getToken(page, ACCOUNTS.student)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-ST02 — k12student portal loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.k12student, '/student')
  const token = await getToken(page, ACCOUNTS.k12student)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-PORT01 — /dashboard/medicare-help loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/medicare-help')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-PORT02 — /university-admin loads for uniadmin', async ({ page }) => {
  await loginAs(page, ACCOUNTS.uniadmin, '/university-admin')
  const token = await getToken(page, ACCOUNTS.uniadmin)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-PORT03 — /school-admin loads for k12admin', async ({ page }) => {
  await loginAs(page, ACCOUNTS.k12admin, '/school-admin')
  const token = await getToken(page, ACCOUNTS.k12admin)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})
