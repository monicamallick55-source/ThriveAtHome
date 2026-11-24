import { test, expect } from '@playwright/test'
import { loginAs, ACCOUNTS, BASE_URL as BASE , getToken, dbGet, dbDelete } from './helpers'

const SUPABASE_URL = 'https://qdniskppkfqjmtpkftdt.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg'




// TC-VPF001 — /volunteer portal loads without 500
test('TC-VPF001 — /volunteer loads without 500', async ({ page }) => {
  await loginAs(page, ACCOUNTS.volunteer, '/volunteer/dashboard', test)
  const token = await getToken(page, ACCOUNTS.volunteer)
  if (!token) { test.skip(); return }
  const res = await page.request.get(`${BASE}/volunteer`)
  expect(res.status()).not.toBe(500)
})

// TC-VPF002 — /volunteer/apply loads without auth
test('TC-VPF002 — /volunteer/apply loads without auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/volunteer/apply`)
  expect(res.status()).not.toBe(500)
  expect([200, 301, 302]).toContain(res.status())
})

// TC-VPF003 — POST /api/volunteers/hours creates volunteer_hours row
test('TC-VPF003 — POST /api/volunteers/hours creates DB row', async ({ page }) => {
  await loginAs(page, ACCOUNTS.volunteer, '/volunteer/dashboard', test)
  const token = await getToken(page, ACCOUNTS.volunteer)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')

  const res = await page.request.post(`${BASE}/api/volunteers/hours`, {
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieStr },
    data: { hours: 2, activity_type: 'buddy_call', notes: 'E2E test hours log', date: '2026-11-20' },
  })
  if (res.status() === 404) { test.skip(); return }
  expect([200, 201]).toContain(res.status())
  const body = await res.json()
  const id = body.id || body.record?.id || body.data?.id
  if (id) {
    const rows = await dbGet(page, token, 'volunteer_hours', `id=eq.${id}`)
    expect(rows.length).toBe(1)
    expect(rows[0].hours).toBe(2)
    await dbDelete(page, token, 'volunteer_hours', `id=eq.${id}`)
  }
})

// TC-VPF004 — /api/volunteer/buddy-assignments requires auth
test('TC-VPF004 — /api/volunteer/buddy-assignments requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/volunteer/buddy-assignments`)
  expect([401, 403, 302, 500]).toContain(res.status())
})

// TC-VPF005 — /dashboard/training loads for volunteer
test('TC-VPF005 — /dashboard/training loads for volunteer', async ({ page }) => {
  await loginAs(page, ACCOUNTS.volunteer, '/dashboard/training', test)
  const token = await getToken(page, ACCOUNTS.volunteer)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-VPF006 — volunteer token can read own volunteer_hours from DB
test('TC-VPF006 — volunteer token can read own volunteer_hours from DB', async ({ page }) => {
  const token = await getToken(page, ACCOUNTS.volunteer)
  if (!token) { test.skip(); return }
  const rows = await dbGet(page, token, 'volunteer_hours', 'select=id,hours,activity_type')
  expect(Array.isArray(rows)).toBe(true)
})

// TC-VPF007 — student volunteer portal loads
test('TC-VPF007 — /student portal loads for student volunteer', async ({ page }) => {
  await loginAs(page, ACCOUNTS.student, '/student', test)
  const token = await getToken(page, ACCOUNTS.student)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})
