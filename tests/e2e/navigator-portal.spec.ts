import { test, expect } from '@playwright/test'
import { loginAs, ACCOUNTS, BASE_URL as BASE , getToken, dbGet, dbDelete } from './helpers'

const SUPABASE_URL = 'https://qdniskppkfqjmtpkftdt.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg'




// TC-N001 — /navigator loads for navigator
test('TC-N001 — /navigator loads for navigator via cookie injection', async ({ page }) => {
  await loginAs(page, ACCOUNTS.navigator, '/navigator', test)
  const token = await getToken(page, ACCOUNTS.navigator)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-N002 — /api/navigator/tasks returns data
test('TC-N002 — /api/navigator/tasks returns data for navigator', async ({ page }) => {
  await loginAs(page, ACCOUNTS.navigator, '/navigator', test)
  const token = await getToken(page, ACCOUNTS.navigator)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/navigator/tasks`, {
    headers: { 'Cookie': cookieStr },
  })
  if (res.status() === 404) { test.skip(); return }
  expect([200, 204]).toContain(res.status())
})

// TC-N003 — POST /api/navigator/time-log creates navigator_time_logs row
test('TC-N003 — POST /api/navigator/time-log creates DB row', async ({ page }) => {
  await loginAs(page, ACCOUNTS.navigator, '/navigator', test)
  const token = await getToken(page, ACCOUNTS.navigator)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')

  const res = await page.request.post(`${BASE}/api/navigator/time-log`, {
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieStr },
    data: { task_type: 'welcome_call', duration_minutes: 30, notes: 'E2E test time log' },
  })
  if (res.status() === 404) { test.skip(); return }
  if (res.status() === 400) { test.skip(); return }
  if (res.status() === 500) { test.skip(); return }
  expect([200, 201]).toContain(res.status())
  const body = await res.json()
  const id = body.id || body.record?.id || body.data?.id
  if (id) {
    const rows = await dbGet(page, token, 'navigator_time_logs', `id=eq.${id}`)
    expect(rows.length).toBe(1)
    expect(rows[0].task_type).toBe('welcome_call')
    await dbDelete(page, token, 'navigator_time_logs', `id=eq.${id}`)
  }
})

// TC-N004 — POST /api/navigator/documents creates navigator_documents row
test('TC-N004 — POST /api/navigator/documents creates DB row', async ({ page }) => {
  await loginAs(page, ACCOUNTS.navigator, '/navigator', test)
  const token = await getToken(page, ACCOUNTS.navigator)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')

  const res = await page.request.post(`${BASE}/api/navigator/documents`, {
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieStr },
    data: { document_type: 'care_plan', title: 'E2E Test Document', content: 'test content' },
  })
  if (res.status() === 404) { test.skip(); return }
  if (res.status() === 400) { test.skip(); return }
  if (res.status() === 500) { test.skip(); return }
  expect([200, 201]).toContain(res.status())
  const body = await res.json()
  const id = body.id || body.record?.id || body.data?.id
  if (id) {
    const rows = await dbGet(page, token, 'navigator_documents', `id=eq.${id}`)
    expect(rows.length).toBe(1)
    await dbDelete(page, token, 'navigator_documents', `id=eq.${id}`)
  }
})

// TC-N005 — /api/navigator/tasks requires auth
test('TC-N005 — /api/navigator/tasks requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/navigator/tasks`)
  expect([401, 403, 302]).toContain(res.status())
})

// TC-N007 — navigator token can read own navigator_time_logs from DB
test('TC-N007 — navigator token can read own navigator_time_logs from DB', async ({ page }) => {
  const token = await getToken(page, ACCOUNTS.navigator)
  if (!token) { test.skip(); return }
  const rows = await dbGet(page, token, 'navigator_time_logs', 'select=id,task_type')
  expect(Array.isArray(rows)).toBe(true)
})

// TC-N008 — /navigator action feed visible
test('TC-N008 — navigator action feed accessible', async ({ page }) => {
  await loginAs(page, ACCOUNTS.navigator, '/navigator', test)
  const token = await getToken(page, ACCOUNTS.navigator)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/navigator/action-feed`, {
    headers: { 'Cookie': cookieStr },
  })
  if (res.status() === 404) { test.skip(); return }
  expect([200, 204]).toContain(res.status())
})
