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

test('TC-P002 — / homepage returns 200', async ({ page }) => {
  const res = await page.request.get(`${BASE}/`)
  expect(res.status()).toBe(200)
})

test('TC-P004 — /pricing shows plan pricing info', async ({ page }) => {
  const res = await page.request.get(`${BASE}/pricing`)
  expect(res.status()).toBe(200)
  const body = await res.text()
  expect(body.toLowerCase()).toMatch(/basic|complete|plan|month|\$/)
})

test('TC-P005 — /pricing does not show $199 premier price', async ({ page }) => {
  const res = await page.request.get(`${BASE}/pricing`)
  expect(res.status()).toBe(200)
  const body = await res.text()
  expect(body).not.toMatch(/\$199/)
})

test('TC-P008 — /resources returns non-500', async ({ page }) => {
  const res = await page.request.get(`${BASE}/resources`)
  expect(res.status()).not.toBe(500)
})

test('TC-P009 — /blog returns non-500', async ({ page }) => {
  const res = await page.request.get(`${BASE}/blog`)
  expect(res.status()).not.toBe(500)
})

test('TC-P050 — authenticated member can reach /dashboard', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

test('TC-P070 — /join returns non-500', async ({ page }) => {
  const res = await page.request.get(`${BASE}/join`)
  expect(res.status()).not.toBe(500)
})
