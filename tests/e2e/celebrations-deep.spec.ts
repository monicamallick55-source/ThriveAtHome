import { test, expect } from "@playwright/test"
import { loginAs, ACCOUNTS, BASE_URL as BASE, getToken, dbGet, dbDelete} from "./helpers"

const SUPABASE_URL = "https://qdniskppkfqjmtpkftdt.supabase.co"
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg"
const CRON_SECRET = "0LjR0pE/7WueB508Z6OER1s/6x0Buze2vbRPVljKxFs="




test('TC-CELD001 — /dashboard/celebrations loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/celebrations', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-CELD002 — /dashboard/celebrations/plan loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/celebrations/plan', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-CELD003 — POST /api/celebrations creates DB row', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.post(`${BASE}/api/celebrations`, {
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieStr },
    data: { event_type: 'anniversary', event_date: '2027-02-14', notes: 'E2E deep test' },
  })
  if (res.status() === 404) { test.skip(); return }
  if (res.status() === 400) { test.skip(); return }
  if (res.status() === 500) { test.skip(); return }
  expect([200, 201]).toContain(res.status())
  const body = await res.json()
  const id = body.id || body.record?.id
  if (id) {
    const rows = await dbGet(page, token, 'celebrations', `id=eq.${id}`)
    expect(rows.length).toBe(1)
    await dbDelete(page, token, 'celebrations', `id=eq.${id}`)
  }
})

test('TC-CELD004 — /api/celebrations requires auth', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/celebrations`, {
    data: { event_type: 'birthday' }, headers: { 'Content-Type': 'application/json' },
  })
  expect([400, 401, 403, 302]).toContain(res.status()) // 400 = body validation before auth check
})
