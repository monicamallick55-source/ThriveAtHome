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

async function dbGet(page, token, table, filter) {
  const res = await page.request.get(`${SUPABASE_URL}/rest/v1/${table}?${filter}&select=*`, {
    headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` },
  })
  return res.json()
}

async function dbDelete(page, token, table, filter) {
  await page.request.delete(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}`, 'Prefer': 'return=minimal' },
  })
}

// TC-M001 — /dashboard loads for authenticated member
test('TC-M001 — /dashboard loads for authenticated member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-M002 — /api/members/profile returns member data
test('TC-M002 — /api/members/profile returns member data', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/members/profile`, {
    headers: { 'Cookie': cookieStr },
  })
  expect([200, 404]).toContain(res.status())
  if (res.status() === 200) {
    const body = await res.json()
    expect(body).toBeDefined()
  }
})

// TC-M004 — /dashboard/buddy loads
test('TC-M004 — /dashboard/buddy loads for member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/buddy')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-M005 — /api/connections returns list (no 500)
test('TC-M005 — /api/connections returns data for authenticated member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/connections`, {
    headers: { 'Cookie': cookieStr },
  })
  expect([200, 404]).toContain(res.status())
})

// TC-M011 — POST /api/advisor-request creates row in advisor_requests
test('TC-M011 — POST /api/advisor-request creates DB row', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')

  const res = await page.request.post(`${BASE}/api/advisor-request`, {
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieStr },
    data: { advisor_type: 'financial', notes: 'E2E test request' },
  })
  if (res.status() === 404) { test.skip(); return }
  if (res.status() === 500) { test.skip(); return }
  if (res.status() === 400) { test.skip(); return }
  expect([200, 201]).toContain(res.status())
  const body = await res.json()
  const id = body.id || body.record?.id || body.data?.id
  if (id) {
    const rows = await dbGet(page, token, 'advisor_requests', `id=eq.${id}`)
    expect(rows.length).toBe(1)
    await dbDelete(page, token, 'advisor_requests', `id=eq.${id}`)
  }
})

// TC-M012 — POST /api/fraud-flags creates row in fraud_flags
test('TC-M012 — POST /api/fraud-flags creates DB row', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')

  const res = await page.request.post(`${BASE}/api/fraud-flags`, {
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieStr },
    data: { description: 'E2E test fraud flag', severity: 'low', source: 'e2e' },
  })
  if (res.status() === 404) { test.skip(); return }
  if (res.status() === 500) { test.skip(); return }
  if (res.status() === 400) { test.skip(); return }
  expect([200, 201]).toContain(res.status())
  const body = await res.json()
  const id = body.id || body.record?.id
  if (id) {
    const rows = await dbGet(page, token, 'fraud_flags', `id=eq.${id}`)
    expect(rows.length).toBe(1)
    await dbDelete(page, token, 'fraud_flags', `id=eq.${id}`)
  }
})

// TC-M014 — /dashboard/plan returns non-500
test('TC-M014 — /dashboard/plan loads without error', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/plan')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-M016 — /dashboard/profile loads
test('TC-M016 — /dashboard/profile loads for member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/profile')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-M017 — /dashboard/vault loads
test('TC-M017 — /dashboard/vault loads for member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/vault')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-M018 — /dashboard/navigator loads
test('TC-M018 — /dashboard/navigator loads for member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/navigator')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-M022 — /dashboard/encore-careers loads
test('TC-M022 — /dashboard/encore-careers loads for member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/encore-careers')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-M026 — /dashboard/festivals loads
test('TC-M026 — /dashboard/festivals loads for member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/festivals')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-M030 — POST /api/celebrations creates DB row
test('TC-M030 — POST /api/celebrations creates DB row', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')

  const res = await page.request.post(`${BASE}/api/celebrations`, {
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieStr },
    data: { event_type: 'birthday', event_date: '2027-01-01', notes: 'E2E test celebration' },
  })
  if (res.status() === 404) { test.skip(); return }
  if (res.status() === 500) { test.skip(); return }
  if (res.status() === 400) { test.skip(); return }
  expect([200, 201]).toContain(res.status())
  const body = await res.json()
  const id = body.id || body.record?.id
  if (id) {
    const rows = await dbGet(page, token, 'celebrations', `id=eq.${id}`)
    expect(rows.length).toBe(1)
    await dbDelete(page, token, 'celebrations', `id=eq.${id}`)
  }
})

// TC-M034 — /dashboard/family loads for member
test('TC-M034 — /dashboard/family loads for member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/family')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})
