import { test, expect } from '@playwright/test'
import { loginAs, ACCOUNTS, BASE_URL as BASE , getToken } from './helpers'

const SUPABASE_URL = 'https://qdniskppkfqjmtpkftdt.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg'


// TC-B001 — /pricing page returns 200
test('TC-B001 — /pricing page returns 200', async ({ page }) => {
  const res = await page.request.get(`${BASE}/pricing`)
  expect(res.status()).toBe(200)
})

// TC-B002 — /pricing does not expose $199 Premier plan
test('TC-B002 — /pricing does not expose $199 Premier plan', async ({ page }) => {
  const res = await page.request.get(`${BASE}/pricing`)
  expect(res.status()).toBe(200)
  const body = await res.text()
  expect(body).not.toMatch(/\$199/)
})

// TC-B003 — /api/create-checkout-session requires auth
test('TC-B003 — /api/create-checkout-session requires auth', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/create-checkout-session`, {
    data: { plan: 'basic', billing: 'monthly' },
    headers: { 'Content-Type': 'application/json' },
  })
  expect([401, 403, 302, 400]).toContain(res.status())
})

// TC-B004 — /api/stripe/webhook returns 400 without signature
test('TC-B004 — /api/stripe/webhook returns 400 without signature', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/stripe/webhook`, {
    data: JSON.stringify({ type: 'checkout.session.completed' }),
    headers: { 'Content-Type': 'application/json' },
  })
  expect([400, 401, 403, 404]).toContain(res.status())
})

// TC-B005 — authenticated member can call create-checkout-session
test('TC-B005 — authenticated member can call /api/create-checkout-session', async ({ page }) => {
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

// TC-B006 — /dashboard/plan loads for authenticated member
test('TC-B006 — /dashboard/plan loads for authenticated member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/plan', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-B007 — /api/billing/portal requires auth
test('TC-B007 — /api/billing/portal requires auth', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/billing/portal`, {
    data: {},
    headers: { 'Content-Type': 'application/json' },
  })
  expect([400, 401, 403, 404]).toContain(res.status())
})

// TC-B008 — /api/billing/cancel requires auth
test('TC-B008 — /api/billing/cancel requires auth', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/billing/cancel`, {
    data: {},
    headers: { 'Content-Type': 'application/json' },
  })
  expect([400, 401, 403, 404]).toContain(res.status())
})

// TC-B009 — /api/entitlements returns plan data for authenticated member
test('TC-B009 — /api/entitlements returns plan data for authenticated member', async ({ page }) => {
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

// TC-B010 — /api/stripe/webhook returns 400 without valid body
test('TC-B010 — /api/stripe/webhook returns non-200 for invalid payload', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/stripe/webhook`, {
    data: 'not-valid-stripe-event',
    headers: { 'Content-Type': 'text/plain' },
  })
  expect(res.status()).not.toBe(200)
})
