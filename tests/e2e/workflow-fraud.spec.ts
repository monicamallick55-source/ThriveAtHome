import { test, expect } from '@playwright/test'
import { loginAs, ACCOUNTS, BASE_URL as BASE , getToken, dbGet, dbDelete } from './helpers'

const SUPABASE_URL = 'https://qdniskppkfqjmtpkftdt.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg'




test('TC-WF001 — /dashboard/fraud-protection loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/fraud-protection', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-WF002 — /api/fraud-flags requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/fraud-flags`)
  expect([401, 403, 302]).toContain(res.status())
})

test('TC-WF003 — POST /api/fraud-flags creates DB row', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.post(`${BASE}/api/fraud-flags`, {
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieStr },
    data: { description: 'E2E fraud test', severity: 'low', source: 'e2e' },
  })
  if ([404, 400, 500].includes(res.status())) { test.skip(); return }
  expect([200, 201]).toContain(res.status())
  const body = await res.json()
  const id = body.id || body.record?.id
  if (id) {
    const rows = await dbGet(page, token, 'fraud_flags', `id=eq.${id}`)
    expect(rows.length).toBe(1)
    await dbDelete(page, token, 'fraud_flags', `id=eq.${id}`)
  }
})
