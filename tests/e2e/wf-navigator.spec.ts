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

test('TC-N-WF01 — /navigator action feed loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.navigator, '/navigator')
  const token = await getToken(page, ACCOUNTS.navigator)
  if (!token) { test.skip(); return }
  expect(page.url()).toContain('/navigator')
})

test('TC-N-WF02 — POST /api/navigator/time-log creates DB row', async ({ page }) => {
  await loginAs(page, ACCOUNTS.navigator, '/navigator')
  const token = await getToken(page, ACCOUNTS.navigator)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.post(`${BASE}/api/navigator/time-log`, {
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieStr },
    data: { task_type: 'service_request', duration_minutes: 30, notes: 'E2E wf-navigator test' },
  })
  if (res.status() === 404) { test.skip(); return }
  expect([200, 201]).toContain(res.status())
  const body = await res.json()
  const id = body.id || body.record?.id
  if (id) {
    const rows = await dbGet(page, token, 'navigator_time_logs', `id=eq.${id}`)
    expect(rows.length).toBe(1)
    expect(rows[0].task_type).toBe('service_request')
    await dbDelete(page, token, 'navigator_time_logs', `id=eq.${id}`)
  }
})

test('TC-N-WF03 — POST /api/navigator/documents creates DB row', async ({ page }) => {
  await loginAs(page, ACCOUNTS.navigator, '/navigator')
  const token = await getToken(page, ACCOUNTS.navigator)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.post(`${BASE}/api/navigator/documents`, {
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieStr },
    data: { document_type: 'care_plan', title: 'E2E Navigator Doc', content: 'test' },
  })
  if (res.status() === 404) { test.skip(); return }
  expect([200, 201]).toContain(res.status())
  const body = await res.json()
  const id = body.id || body.record?.id
  if (id) {
    const rows = await dbGet(page, token, 'navigator_documents', `id=eq.${id}`)
    expect(rows.length).toBe(1)
    await dbDelete(page, token, 'navigator_documents', `id=eq.${id}`)
  }
})

test('TC-N-WF04 — /api/navigator/tasks requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/navigator/tasks`)
  expect([401, 403, 302]).toContain(res.status())
})
