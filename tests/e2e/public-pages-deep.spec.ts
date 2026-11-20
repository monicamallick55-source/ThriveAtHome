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

test('TC-P003 — / homepage returns 200', async ({ page }) => {
  const res = await page.request.get(`${BASE}/`)
  expect(res.status()).toBe(200)
})

test('TC-P006 — /pricing returns 200', async ({ page }) => {
  const res = await page.request.get(`${BASE}/pricing`)
  expect(res.status()).toBe(200)
})

test('TC-P007 — /about returns non-500', async ({ page }) => {
  const res = await page.request.get(`${BASE}/about`)
  expect(res.status()).not.toBe(500)
})

test('TC-P010 — /for-families returns non-500', async ({ page }) => {
  const res = await page.request.get(`${BASE}/for-families`)
  expect(res.status()).not.toBe(500)
})

test('TC-P011 — /for-volunteers returns non-500', async ({ page }) => {
  const res = await page.request.get(`${BASE}/for-volunteers`)
  expect(res.status()).not.toBe(500)
})

test('TC-P020 — /login returns 200', async ({ page }) => {
  const res = await page.request.get(`${BASE}/login`)
  expect(res.status()).toBe(200)
})

test('TC-P021 — /signup returns non-500', async ({ page }) => {
  const res = await page.request.get(`${BASE}/signup`)
  expect(res.status()).not.toBe(500)
})

test('TC-P030 — /employers page returns non-500', async ({ page }) => {
  const res = await page.request.get(`${BASE}/employers`)
  expect(res.status()).not.toBe(500)
})

test('TC-P031 — /donate returns non-500', async ({ page }) => {
  const res = await page.request.get(`${BASE}/donate`)
  expect(res.status()).not.toBe(500)
})

test('TC-P040 — /contact returns non-500', async ({ page }) => {
  const res = await page.request.get(`${BASE}/contact`)
  expect(res.status()).not.toBe(500)
})

test('TC-P052 — /privacy returns non-500', async ({ page }) => {
  const res = await page.request.get(`${BASE}/privacy`)
  expect(res.status()).not.toBe(500)
})

test('TC-P053 — /terms returns non-500', async ({ page }) => {
  const res = await page.request.get(`${BASE}/terms`)
  expect(res.status()).not.toBe(500)
})
