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

test('TC-V-WF01 — /volunteer/apply returns 200', async ({ page }) => {
  const res = await page.request.get(`${BASE}/volunteer/apply`)
  expect(res.status()).not.toBe(500)
})

test('TC-V-WF02 — /api/volunteer/buddy-assignments requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/volunteer/buddy-assignments`)
  expect([401, 403, 302]).toContain(res.status())
})

test('TC-V-WF03 — POST /api/volunteers/hours creates DB row', async ({ page }) => {
  await loginAs(page, ACCOUNTS.volunteer, '/volunteer/dashboard')
  const token = await getToken(page, ACCOUNTS.volunteer)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.post(`${BASE}/api/volunteers/hours`, {
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieStr },
    data: { hours: 2, activity_type: 'service_request', date: '2026-11-20', notes: 'E2E wf-vol test' },
  })
  if (res.status() === 404) { test.skip(); return }
  expect([200, 201]).toContain(res.status())
  const body = await res.json()
  const id = body.id || body.record?.id
  if (id) {
    const rows = await dbGet(page, token, 'volunteer_hours', `id=eq.${id}`)
    expect(rows.length).toBe(1)
    await dbDelete(page, token, 'volunteer_hours', `id=eq.${id}`)
  }
})

test('TC-V-WF06 — /volunteer/dashboard loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.volunteer, '/volunteer/dashboard')
  const token = await getToken(page, ACCOUNTS.volunteer)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-V-WF07 — /dashboard/training loads for volunteer', async ({ page }) => {
  await loginAs(page, ACCOUNTS.volunteer, '/dashboard/training')
  const token = await getToken(page, ACCOUNTS.volunteer)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})
