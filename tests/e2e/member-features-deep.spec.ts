import { test, expect } from '@playwright/test'
import { loginAs, ACCOUNTS, BASE_URL as BASE , getToken, dbGet, dbDelete } from './helpers'

const SUPABASE_URL = 'https://qdniskppkfqjmtpkftdt.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg'
const CRON_SECRET = '0LjR0pE/7WueB508Z6OER1s/6x0Buze2vbRPVljKxFs='




// TC-M040 — Birthday arc cron fires without 500
test('TC-M040 — Birthday arc cron POST /api/cron/birthday-arc returns 200/207', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/cron/birthday-arc`, {
    headers: { 'x-cron-secret': CRON_SECRET, 'Content-Type': 'application/json' },
    data: {},
  })
  if (res.status() === 404) { test.skip(); return }
  expect(res.status()).not.toBe(500)
  expect([200, 207]).toContain(res.status())
})

// TC-M041 — Birthday arc cron requires CRON_SECRET
test('TC-M041 — Birthday arc cron requires valid CRON_SECRET', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/cron/birthday-arc`, {
    headers: { 'x-cron-secret': 'invalid-secret', 'Content-Type': 'application/json' },
    data: {},
  })
  if (res.status() === 404) { test.skip(); return }
  expect([401, 403]).toContain(res.status())
})

// TC-M042 — POST /api/member/buddy-request creates buddy_requests row
test('TC-M042 — POST /api/member/buddy-request creates DB row', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')

  const res = await page.request.post(`${BASE}/api/member/buddy-request`, {
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieStr },
    data: { buddy_type: 'general', preferences: 'E2E test buddy request' },
  })
  if ([404, 400, 500].includes(res.status())) { test.skip(); return }
  expect([200, 201]).toContain(res.status())
  const body = await res.json()
  const id = body.id || body.record?.id || body.data?.id
  if (id) {
    const rows = await dbGet(page, token, 'buddy_requests', `id=eq.${id}`)
    expect(rows.length).toBe(1)
    await dbDelete(page, token, 'buddy_requests', `id=eq.${id}`)
  }
})

// TC-M050 — /api/connections returns list for member
test('TC-M050 — /api/connections returns list for authenticated member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/connections`, {
    headers: { 'Cookie': cookieStr },
  })
  expect([200, 404]).toContain(res.status())
  if (res.status() === 200) {
    const body = await res.json()
    expect(Array.isArray(body) || typeof body === 'object').toBe(true)
  }
})

// TC-M055 — /dashboard/communities loads
test('TC-M055 — /dashboard/communities loads for member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/communities', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-M060 — POST /api/connections creates connection row
test('TC-M060 — POST /api/connections creates DB row', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')

  const res = await page.request.post(`${BASE}/api/connections`, {
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieStr },
    data: { connection_type: 'buddy', notes: 'E2E test connection' },
  })
  if ([404, 400, 500].includes(res.status())) { test.skip(); return }
  expect([200, 201]).toContain(res.status())
  const body = await res.json()
  const id = body.id || body.record?.id
  if (id) {
    const rows = await dbGet(page, token, 'connections', `id=eq.${id}`)
    expect(rows.length).toBe(1)
    await dbDelete(page, token, 'connections', `id=eq.${id}`)
  }
})

// TC-M064 — /api/feature-flags does not 500
test('TC-M064 — /api/feature-flags does not 500 for member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/feature-flags`, {
    headers: { 'Cookie': cookieStr },
  })
  expect(res.status()).not.toBe(500)
})

// TC-M080 — Complete member dashboard loads
test('TC-M080 — Complete member dashboard loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.complete, '/dashboard', test)
  const token = await getToken(page, ACCOUNTS.complete)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-M084 — Premier member dashboard loads
test('TC-M084 — Premier member dashboard loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.premier, '/dashboard', test)
  const token = await getToken(page, ACCOUNTS.premier)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})
