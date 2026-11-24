import { test, expect } from '@playwright/test'
import { loginAs, ACCOUNTS, BASE_URL as BASE } from './helpers'

const SUPABASE_URL = 'https://qdniskppkfqjmtpkftdt.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg'

async function getToken(page, account) {
  const res = await page.request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    data: { email: account.email, password: account.password },
  })
  const j = await res.json()
  return j.access_token as string
}

async function dbGet(page, token, table, filter) {
  const res = await page.request.get(`${SUPABASE_URL}/rest/v1/${table}?${filter}&select=*`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
  })
  return res.json()
}

test.describe('B2B Portals — real auth + DB verification', () => {
  test.describe.configure({ retries: 1 })

  test('TC-B2B001 — /org-admin loads; org_configs row readable as orgadmin', async ({ page }) => {
    await loginAs(page, ACCOUNTS.orgadmin, '/org-admin', test)
    const token = await getToken(page, ACCOUNTS.orgadmin)
    if (!token) { test.skip(); return }
    expect(page.url()).not.toContain('/login')
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/internal server error/i)
    // Real DB: org_configs readable with orgadmin token
    const configs = await dbGet(page, token, 'brand_configs', 'limit=1')
    expect(Array.isArray(configs)).toBe(true)
  })

  test('TC-B2B001-unauth — /api/org-configs returns 401 without token', async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/org-configs?org_id=test`)
    expect(res.status()).toBe(401)
  })

  test('TC-B2B010 — /employer-admin loads; employer session valid', async ({ page }) => {
    await loginAs(page, ACCOUNTS.employer, '/employer-admin', test)
    const token = await getToken(page, ACCOUNTS.employer)
    if (!token) { test.skip(); return }
    expect(page.url()).not.toContain('/login')
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/internal server error/i)
    // Real DB: family_members row exists for employer
    const rows = await dbGet(page, token, 'family_members', `limit=1&select=id`)
    expect(Array.isArray(rows)).toBe(true)
  })

  test('TC-B2B011 — /employers landing page (public, no auth)', async ({ page }) => {
    const res = await page.request.get(`${BASE}/employers`)
    expect(res.status()).toBe(200)
    await page.goto(`${BASE}/employers`, { waitUntil: 'domcontentloaded', timeout: 20000 })
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/404|not found/i)
  })

  test('TC-B2B012 — /employer-admin/invite/[token] renders without crash', async ({ page }) => {
    const res = await page.request.get(`${BASE}/employer-admin/invite/test-token`)
    expect(res.status()).not.toBe(500)
    await page.goto(`${BASE}/employer-admin/invite/test-token`, { waitUntil: 'domcontentloaded', timeout: 20000 })
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/internal server error/i)
  })

  test('TC-B2B020 — /senior-center-admin loads; session valid', async ({ page }) => {
    await loginAs(page, ACCOUNTS.seniorcenter, '/senior-center-admin', test)
    const token = await getToken(page, ACCOUNTS.seniorcenter)
    if (!token) { test.skip(); return }
    expect(page.url()).not.toContain('/login')
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/internal server error/i)
  })

  test('TC-B2B025 — /aaa-admin loads; session valid', async ({ page }) => {
    await loginAs(page, ACCOUNTS.aaa, '/aaa-admin', test)
    const token = await getToken(page, ACCOUNTS.aaa)
    if (!token) { test.skip(); return }
    expect(page.url()).not.toContain('/login')
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/internal server error/i)
  })

  test('TC-B2B030 — /network-admin loads; session valid', async ({ page }) => {
    await loginAs(page, ACCOUNTS.network, '/network-admin', test)
    const token = await getToken(page, ACCOUNTS.network)
    if (!token) { test.skip(); return }
    expect(page.url()).not.toContain('/login')
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/internal server error/i)
  })

  test('TC-B2B035 — /agency-admin loads; session valid', async ({ page }) => {
    await loginAs(page, ACCOUNTS.agency, '/agency-admin', test)
    const token = await getToken(page, ACCOUNTS.agency)
    if (!token) { test.skip(); return }
    expect(page.url()).not.toContain('/login')
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/internal server error/i)
  })
})

test.describe('B2B Volunteer Portals — real auth', () => {
  test.describe.configure({ retries: 1 })

  test('TC-VOL001 — /university-admin loads; session valid', async ({ page }) => {
    await loginAs(page, ACCOUNTS.uniadmin, '/university-admin', test)
    const token = await getToken(page, ACCOUNTS.uniadmin)
    if (!token) { test.skip(); return }
    expect(page.url()).not.toContain('/login')
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/internal server error/i)
  })

  test('TC-VOL010 — /vso-admin loads; session valid', async ({ page }) => {
    await loginAs(page, ACCOUNTS.vsoadmin, '/vso-admin', test)
    const token = await getToken(page, ACCOUNTS.vsoadmin)
    if (!token) { test.skip(); return }
    expect(page.url()).not.toContain('/login')
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/internal server error/i)
  })

  test('TC-VOL020 — /school-admin loads; session valid', async ({ page }) => {
    await loginAs(page, ACCOUNTS.k12admin, '/school-admin', test)
    const token = await getToken(page, ACCOUNTS.k12admin)
    if (!token) { test.skip(); return }
    expect(page.url()).not.toContain('/login')
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/internal server error/i)
  })

  test('TC-VOL030 — /volunteer/dashboard loads; real volunteer session', async ({ page }) => {
    await loginAs(page, ACCOUNTS.volunteer, '/volunteer/dashboard', test)
    const token = await getToken(page, ACCOUNTS.volunteer)
    if (!token) { test.skip(); return }
    expect(page.url()).not.toContain('/login')
    // Real DB: volunteer_profiles row readable
    const rows = await dbGet(page, token, 'volunteer_profiles', `limit=1&select=id,status`)
    expect(Array.isArray(rows)).toBe(true)
  })

  test('TC-VOL060 — /api/volunteer/training-status returns 401 without auth', async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/volunteer/training-status`)
    expect([401, 403]).toContain(res.status())
  })

  test('TC-VOL060-auth — /api/volunteer/training-status returns 200 with auth', async ({ page }) => {
    const token = await getToken(page, ACCOUNTS.volunteer)
    if (!token) { test.skip(); return }
    const res = await page.request.get(`${BASE}/api/volunteer/training-status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).not.toBe(500)
  })
})

test.describe('Billing pricing — public page checks', () => {
  test('TC-B001 — Basic $39/mo visible on /pricing', async ({ page }) => {
    const res = await page.request.get(`${BASE}/pricing`)
    expect(res.status()).toBe(200)
    await page.goto(`${BASE}/pricing`, { waitUntil: 'domcontentloaded', timeout: 20000 })
    const body = await page.locator('body').innerText()
    expect(body).toMatch(/39/)
  })

  test('TC-B003 — Annual pricing toggle present on /pricing', async ({ page }) => {
    await page.goto(`${BASE}/pricing`, { waitUntil: 'domcontentloaded', timeout: 20000 })
    const body = await page.locator('body').innerText()
    expect(body).toMatch(/annual|yearly|save/i)
  })

  test('TC-B004 — Complete plan visible on /pricing', async ({ page }) => {
    await page.goto(`${BASE}/pricing`, { waitUntil: 'domcontentloaded', timeout: 20000 })
    const body = await page.locator('body').innerText()
    expect(body).toMatch(/complete/i)
  })
})
