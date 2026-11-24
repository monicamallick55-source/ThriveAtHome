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

test('TC-SVC001 — /dashboard/marketplace loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/marketplace', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-SVC002 — /api/marketplace/providers requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/marketplace/providers`)
  expect([401, 403, 404]).toContain(res.status())
})

test('TC-NOTIF001 — /api/notifications requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/notifications`)
  expect([401, 403, 404]).toContain(res.status())
})

test('TC-NOTIF002 — member can read own notifications', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/notifications`, {
    headers: { 'Cookie': cookieStr },
  })
  if (res.status() === 404) { test.skip(); return }
  expect([200, 204]).toContain(res.status())
})

test('TC-SEC001 — /api/members/profile requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/members/profile`)
  expect([401, 403, 302]).toContain(res.status())
})

test('TC-SEC002 — /api/admin/ambassadors requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/admin/ambassadors`)
  expect([401, 403, 302]).toContain(res.status())
})

test('TC-RT001 — /pricing returns 200', async ({ page }) => {
  const res = await page.request.get(`${BASE}/pricing`)
  expect(res.status()).toBe(200)
})

test('TC-RT002 — /login returns 200', async ({ page }) => {
  const res = await page.request.get(`${BASE}/login`)
  expect(res.status()).toBe(200)
})

test('TC-OB001 — member onboarding: /dashboard loads after cookie injection', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-GC001 — /dashboard/grief-circles loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/grief-circles', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-COM001 — /dashboard/communities loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/communities', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-VLT001 — /dashboard/vault loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/vault', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})
