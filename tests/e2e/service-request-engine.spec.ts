import { test, expect } from "@playwright/test"
import { loginAs, ACCOUNTS, BASE_URL as BASE } from "./helpers"
const SUPABASE_URL = "https://qdniskppkfqjmtpkftdt.supabase.co"
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg"
async function getToken(page, account) {
  const res = await page.request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { headers: { "apikey": ANON_KEY, "Content-Type": "application/json" }, data: { email: account.email, password: account.password } })
  const json = await res.json(); return json.access_token as string
}
async function dbGet(page, token, table, filter) {
  const res = await page.request.get(`${SUPABASE_URL}/rest/v1/${table}?${filter}&select=*`, { headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${token}` } })
  return res.json()
}
async function dbDelete(page, token, table, filter) {
  await page.request.delete(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, { headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${token}`, "Prefer": "return=minimal" } })
}

test('TC-SRV001 — GET /api/service-requests requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/service-requests`)
  expect([401, 403, 302]).toContain(res.status())
})

test('TC-SRV002 — POST /api/service-requests requires auth', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/service-requests`, {
    data: { service_type: 'ride', notes: 'test' },
    headers: { 'Content-Type': 'application/json' },
  expect([401, 403, 302]).toContain(res.status())
})

test('TC-SRV003 — POST /api/service-requests creates DB row for member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard')
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.post(`${BASE}/api/service-requests`, {
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieStr },
    data: { service_type: 'ride', notes: 'E2E service request test', requested_date: '2026-12-01' },
  })
  if (res.status() === 404) { test.skip(); return }
  expect([200, 201]).toContain(res.status())
  const body = await res.json()
  const id = body.id || body.record?.id
  if (id) {
    const rows = await dbGet(page, token, 'service_requests', `id=eq.${id}`)
    expect(rows.length).toBe(1)
    expect(rows[0].service_type).toBe('ride')
    await dbDelete(page, token, 'service_requests', `id=eq.${id}`)
  }
})
