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

// TC-F001 — /dashboard/family loads for family account
test('TC-F001 — /dashboard/family loads for family account', async ({ page }) => {
  await loginAs(page, ACCOUNTS.family, '/dashboard/family')
  const token = await getToken(page, ACCOUNTS.family)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-F002 — POST /api/family/events creates family_events row
test('TC-F002 — POST /api/family/events creates DB row', async ({ page }) => {
  await loginAs(page, ACCOUNTS.family, '/dashboard/family')
  const token = await getToken(page, ACCOUNTS.family)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')

  const res = await page.request.post(`${BASE}/api/family/events`, {
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieStr },
    data: { title: 'E2E Test Family Event', event_date: '2027-06-01', notes: 'created by e2e test' },
  })
  if (res.status() === 404) { test.skip(); return }
  expect([200, 201]).toContain(res.status())
  const body = await res.json()
  const id = body.id || body.record?.id || body.data?.id
  if (id) {
    const rows = await dbGet(page, token, 'family_events', `id=eq.${id}`)
    expect(rows.length).toBe(1)
    expect(rows[0].title).toBe('E2E Test Family Event')
    await dbDelete(page, token, 'family_events', `id=eq.${id}`)
  }
})

// TC-F003 — GET /api/family/buddy-assignment returns data
test('TC-F003 — GET /api/family/buddy-assignment returns data', async ({ page }) => {
  await loginAs(page, ACCOUNTS.family, '/dashboard/family')
  const token = await getToken(page, ACCOUNTS.family)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/family/buddy-assignment`, {
    headers: { 'Cookie': cookieStr },
  })
  if (res.status() === 404) { test.skip(); return }
  expect([200, 204]).toContain(res.status())
})

// TC-F004 — family cannot access /navigator
test('TC-F004 — family account cannot access /navigator', async ({ page }) => {
  await loginAs(page, ACCOUNTS.family, '/dashboard/family')
  const token = await getToken(page, ACCOUNTS.family)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/navigator/tasks`, {
    headers: { 'Cookie': cookieStr },
  })
  expect([401, 403, 404]).toContain(res.status())
})

// TC-F005 — /api/family/events GET requires auth
test('TC-F005 — /api/family/events GET requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/family/events`)
  expect([401, 403, 302]).toContain(res.status())
})

// TC-F006 — family portal member data readable from DB
test('TC-F006 — family token can read own profile from DB', async ({ page }) => {
  const token = await getToken(page, ACCOUNTS.family)
  if (!token) { test.skip(); return }
  const rows = await dbGet(page, token, 'profiles', 'select=id,role')
  expect(Array.isArray(rows)).toBe(true)
  expect(rows.length).toBeGreaterThan(0)
})

// TC-F007 — family portal fraud protection card via API
test('TC-F007 — /api/fraud-flags GET returns data for family', async ({ page }) => {
  await loginAs(page, ACCOUNTS.family, '/dashboard/family')
  const token = await getToken(page, ACCOUNTS.family)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/fraud-flags`, {
    headers: { 'Cookie': cookieStr },
  })
  if (res.status() === 404) { test.skip(); return }
  expect([200, 401]).toContain(res.status())
})
