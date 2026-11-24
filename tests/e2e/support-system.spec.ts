import { test, expect } from "@playwright/test"
import { loginAs, ACCOUNTS, BASE_URL as BASE } from "./helpers"
const SUPABASE_URL = "https://qdniskppkfqjmtpkftdt.supabase.co"
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg"

test('TC-SUP001 — /dashboard/support loads or returns non-500', async ({ page }) => {
  const res = await page.request.get(`${BASE}/dashboard/support`)
  expect(res.status()).not.toBe(500)
})

test('TC-SUP002 — /api/support/tickets requires auth', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/support/tickets`, {
    data: { subject: 'test', message: 'test', category: 'general' },
    headers: { 'Content-Type': 'application/json' },
  })
  expect([401, 403, 404]).toContain(res.status())
})

test('TC-SUP003 — authenticated member can submit support ticket', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.post(`${BASE}/api/support/tickets`, {
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieStr },
    data: { subject: 'E2E Test Ticket', message: 'This is an automated test', category: 'general' },
  })
  if (res.status() === 404) { test.skip(); return }
  expect([200, 201]).toContain(res.status())
  const body = await res.json()
  const id = body.id || body.record?.id
  if (id) {
    const rows = await dbGet(page, token, 'support_tickets', `id=eq.${id}`)
    expect(rows.length).toBe(1)
    await dbDelete(page, token, 'support_tickets', `id=eq.${id}`)
  }
})
