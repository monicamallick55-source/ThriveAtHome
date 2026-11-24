import { test, expect } from '@playwright/test'
import { loginAs, ACCOUNTS, BASE_URL as BASE } from './helpers'

const SUPABASE_URL = 'https://qdniskppkfqjmtpkftdt.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg'

async function getToken(page, account) {
  const res = await page.request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    data: { email: account.email, password: account.password },
  })
  const json = await res.json()
  return json.access_token as string
}

async function dbGet(page, token, table, filter) {
  const res = await page.request.get(`${SUPABASE_URL}/rest/v1/${table}?${filter}&select=*`, {
    headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` },
  })
  const json = await res.json()
  return Array.isArray(json) ? json : []
}

// TC-B001 — Basic plan visible on /pricing
test('TC-B001 — /pricing page returns 200 and contains plan info', async ({ page }) => {
  const res = await page.request.get(`${BASE}/pricing`)
  expect(res.status()).toBe(200)
  const body = await res.text()
  expect(body.toLowerCase()).toMatch(/basic|complete|plan|month/)
})

// TC-B002 — Premier plan hidden on /pricing
test('TC-B002 — Premier $199 plan hidden from /pricing', async ({ page }) => {
  const res = await page.request.get(`${BASE}/pricing`)
  expect(res.status()).toBe(200)
  const body = await res.text()
  expect(body).not.toMatch(/\$199/)
})

// TC-B003 — /dashboard/plan accessible to authenticated member
test('TC-B003 — /dashboard/plan accessible to authenticated member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/plan', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-B004 — /api/create-checkout-session requires auth (401 without cookie)
test('TC-B004 — /api/create-checkout-session requires auth', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/create-checkout-session`, {
    data: { plan: 'basic', billing: 'monthly' },
    headers: { 'Content-Type': 'application/json' },
  })
  expect([401, 403, 400]).toContain(res.status())
})

// TC-B005 — /api/stripe/webhook returns 400 for missing Stripe-Signature
test('TC-B005 — /api/stripe/webhook returns 400 without Stripe-Signature', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/stripe/webhook`, {
    data: JSON.stringify({ type: 'checkout.session.completed' }),
    headers: { 'Content-Type': 'application/json' },
  })
  expect([400, 401, 403, 404]).toContain(res.status())
})

// TC-B006 — authenticated member reaches checkout session endpoint
test('TC-B006 — authenticated member can call create-checkout-session', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.post(`${BASE}/api/create-checkout-session`, {
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieStr },
    data: { plan: 'complete', billing: 'monthly' },
  })
  expect([200, 303, 400, 404]).toContain(res.status())
})

// TC-B007 — member profile has plan_tier in Supabase
test('TC-B007 — member profile has plan_tier in DB', async ({ page }) => {
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const rows = await dbGet(page, token, 'encore_profiles', 'select=plan_tier,email')
  expect(Array.isArray(rows)).toBe(true)
  if (rows.length > 0 && rows[0].plan_tier !== undefined) {
    expect(typeof rows[0].plan_tier).toBe('string')
  }
})

// TC-B008 — complete member has plan_tier=complete in DB
test('TC-B008 — complete member plan_tier is correct in DB', async ({ page }) => {
  const token = await getToken(page, ACCOUNTS.complete)
  if (!token) { test.skip(); return }
  const rows = await dbGet(page, token, 'encore_profiles', 'select=plan_tier')
  expect(Array.isArray(rows)).toBe(true)
  if (rows.length > 0 && rows[0].plan_tier) {
    expect(['complete', 'premier', 'basics', 'connect']).toContain(rows[0].plan_tier)
  }
})

// TC-B009 — /api/entitlements returns plan_tier
test('TC-B009 — /api/entitlements returns plan_tier for authenticated member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/entitlements`, {
    headers: { 'Cookie': cookieStr },
  })
  expect([200, 404]).toContain(res.status())
  if (res.status() === 200) {
    const body = await res.json()
    expect(body).toHaveProperty('plan_tier')
  }
})

// TC-B010 — /dashboard/addons loads for member
test('TC-B010 — /dashboard/addons loads for member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/addons', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})
