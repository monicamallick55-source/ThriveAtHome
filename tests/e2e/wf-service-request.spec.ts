/**
 * Service Request Engine — Authenticated E2E Workflows
 * WF-SRV001–005: Full flow with real DB verification via Supabase REST
 */
import { test, expect } from '@playwright/test'
import { loginAs, ACCOUNTS, BASE_URL } from './helpers'

const SUPABASE_URL = 'https://qdniskppkfqjmtpkftdt.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg'

async function getAuthToken(page: any, account: { email: string; password: string }) {
  const res = await page.request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    data: { email: account.email, password: account.password },
  })
  const json = await res.json()
  return json.access_token as string | null
}

test('WF-SRV001 — member can submit service request + row appears in DB', async ({ page }) => {
  await loginAs(page, ACCOUNTS.complete, '/dashboard')

  const token = await getAuthToken(page, ACCOUNTS.complete)
  if (!token) { test.skip(); return }

  // Submit service request via API
  const res = await page.request.post(`${BASE_URL}/api/service-requests`, {
    headers: { 'Content-Type': 'application/json', 'Cookie': await page.context().cookies().then(c => c.map(x => `${x.name}=${x.value}`).join('; ')) },
    data: { service_type: 'ride', notes: 'doctor appointment E2E test', requested_for: '2026-12-15', contact_phone: '555-0100' },
  })
  expect(res.status()).toBe(201)
  const body = await res.json()
  expect(body.request).toBeTruthy()
  expect(body.request.service_type).toBe('ride')
  expect(['pending', 'confirmed']).toContain(body.request.status)

  const requestId = body.request.id
  expect(requestId).toBeTruthy()

  // Verify row in Supabase via REST API
  const dbRes = await page.request.get(
    `${SUPABASE_URL}/rest/v1/service_requests?id=eq.${requestId}&select=id,service_type,status,dispatch_method`,
    { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` } }
  )
  expect(dbRes.status()).toBe(200)
  const rows = await dbRes.json()
  expect(rows.length).toBeGreaterThan(0)
  expect(rows[0].service_type).toBe('ride')

  // Cleanup
  await page.request.delete(
    `${SUPABASE_URL}/rest/v1/service_requests?id=eq.${requestId}`,
    { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` } }
  )
})

test('WF-SRV002 — member can list their own service requests', async ({ page }) => {
  await loginAs(page, ACCOUNTS.complete, '/dashboard')

  const res = await page.request.get(`${BASE_URL}/api/service-requests`, {
    headers: { 'Cookie': await page.context().cookies().then(c => c.map(x => `${x.name}=${x.value}`).join('; ')) },
  })
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(Array.isArray(body.requests)).toBe(true)
})

test('WF-SRV003 — member cannot see other members requests', async ({ page }) => {
  const token = await getAuthToken(page, ACCOUNTS.complete)
  if (!token) { test.skip(); return }

  // Insert a request as complete@test.com
  await loginAs(page, ACCOUNTS.complete, '/dashboard')
  const createRes = await page.request.post(`${BASE_URL}/api/service-requests`, {
    headers: { 'Content-Type': 'application/json', 'Cookie': await page.context().cookies().then(c => c.map(x => `${x.name}=${x.value}`).join('; ')) },
    data: { service_type: 'meals', notes: 'isolation test' },
  })
  const { request } = await createRes.json()
  const requestId = request?.id

  // Now try to fetch it as member@test.com
  await loginAs(page, ACCOUNTS.member, '/dashboard')
  const fetchRes = await page.request.get(`${BASE_URL}/api/service-requests/${requestId}`, {
    headers: { 'Cookie': await page.context().cookies().then(c => c.map(x => `${x.name}=${x.value}`).join('; ')) },
  })
  // Should be 404 (RLS blocks cross-member reads)
  expect([404, 403]).toContain(fetchRes.status())

  // Cleanup
  await page.request.delete(
    `${SUPABASE_URL}/rest/v1/service_requests?id=eq.${requestId}`,
    { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` } }
  )
})

test('WF-SRV004 — support ticket form submits and returns ok', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/support')
  if (page.url().includes('/login')) { test.skip(); return }

  // Submit via API directly (form is client-side)
  const res = await page.request.post(`${BASE_URL}/api/support/ticket`, {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': await page.context().cookies().then(c => c.map(x => `${x.name}=${x.value}`).join('; '))
    },
    data: {
      category: 'billing',
      subject: 'E2E test ticket - please ignore',
      description: 'Automated test run - safe to delete',
      portal_type: 'member',
    },
  })
  expect([200, 201]).toContain(res.status())
  const body = await res.json()
  expect(body.ok).toBe(true)
})

test('WF-SRV005 — /dashboard/support page UI flow works end to end', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/support')
  if (page.url().includes('/login')) { test.skip(); return }

  // Click the label (radio inputs may be visually hidden)
  await page.locator('label').filter({ hasText: /technical/i }).click()
  await page.locator('input[type="text"]').fill('E2E automated test subject')
  await page.locator('textarea').fill('This is an automated test - safe to ignore')

  // Submit
  await page.locator('button[type="submit"]').click()

  // Success state
  await expect(page.locator('text=Request received')).toBeVisible({ timeout: 15000 })
})
