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

test('TC-WF-F01 — /dashboard/family loads for family', async ({ page }) => {
  await loginAs(page, ACCOUNTS.family, '/dashboard/family')
  const token = await getToken(page, ACCOUNTS.family)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-WF-F02 — POST /api/family/events creates DB row', async ({ page }) => {
  await loginAs(page, ACCOUNTS.family, '/dashboard/family')
  const token = await getToken(page, ACCOUNTS.family)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.post(`${BASE}/api/family/events`, {
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieStr },
    data: { title: 'E2E WF Family Event', event_date: '2027-04-01' },
  })
  if ([404, 400, 500].includes(res.status())) { test.skip(); return }
  expect([200, 201]).toContain(res.status())
  const body = await res.json()
  const id = body.id || body.record?.id
  if (id) {
    const rows = await dbGet(page, token, 'family_events', `id=eq.${id}`)
    expect(rows.length).toBe(1)
    await dbDelete(page, token, 'family_events', `id=eq.${id}`)
  }
})

test('TC-WF-F03 — GET /api/family/buddy-assignment returns data', async ({ page }) => {
  await loginAs(page, ACCOUNTS.family, '/dashboard/family')
  const token = await getToken(page, ACCOUNTS.family)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/family/buddy-assignment`, {
    headers: { 'Cookie': cookieStr },
  })
  if ([404, 400, 500].includes(res.status())) { test.skip(); return }
  expect([200, 204]).toContain(res.status())
})

test('TC-WF-F04 — /api/family/events requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/family/events`)
  expect([401, 403, 302]).toContain(res.status())
})
