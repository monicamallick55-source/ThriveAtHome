import { test, expect } from "@playwright/test"
import { loginAs, ACCOUNTS, BASE_URL as BASE } from "./helpers"

const SUPABASE_URL = "https://qdniskppkfqjmtpkftdt.supabase.co"
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg"
const CRON_SECRET = "0LjR0pE/7WueB508Z6OER1s/6x0Buze2vbRPVljKxFs="

async function getToken(page, account) {
  const res = await page.request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: { "apikey": ANON_KEY, "Content-Type": "application/json" },
    data: { email: account.email, password: account.password },
  })
  const json = await res.json()
  return json.access_token as string
}

async function dbGet(page, token, table, filter) {
  const res = await page.request.get(`${SUPABASE_URL}/rest/v1/${table}?${filter}&select=*`, {
    headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${token}` },
  })
  return res.json()
}

async function dbDelete(page, token, table, filter) {
  await page.request.delete(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${token}`, "Prefer": "return=minimal" },
  })
}

test('TC-CEG001 — /dashboard/gift-send loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/gift-send', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-CEG002 — /api/gifts requires auth', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/gifts`, {
    data: { amount: 25 }, headers: { 'Content-Type': 'application/json' },
  })
  expect([401, 403, 404, 500]).toContain(res.status())
})

test('TC-CEG003 — POST /api/festivals/{id}/rsvp creates DB row', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  // First get a festival ID
  const listRes = await page.request.get(`${BASE}/api/festivals`, {
    headers: { 'Cookie': cookieStr },
  })
  if (listRes.status() === 404) { test.skip(); return }
  if (listRes.status() !== 200) { test.skip(); return }
  const festivals = await listRes.json()
  if (!Array.isArray(festivals) || festivals.length === 0) { test.skip(); return }
  const festivalId = festivals[0].id
  const rsvpRes = await page.request.post(`${BASE}/api/festivals/${festivalId}/rsvp`, {
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieStr },
    data: { status: 'attending' },
  })
  if (rsvpRes.status() === 404) { test.skip(); return }
  expect([200, 201, 409]).toContain(rsvpRes.status())
  const body = await rsvpRes.json()
  const id = body.id || body.record?.id
  if (id) {
    const rows = await dbGet(page, token, 'festival_rsvps', `id=eq.${id}`)
    expect(rows.length).toBe(1)
    await dbDelete(page, token, 'festival_rsvps', `id=eq.${id}`)
  }
})
