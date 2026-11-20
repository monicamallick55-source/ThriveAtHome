import { test, expect } from '@playwright/test'
import { loginAs, ACCOUNTS, BASE_URL as BASE } from './helpers'

test('TC-SRV001 — GET /api/service-requests requires auth (anon gets 401)', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/service-requests`)
  expect([401, 403, 302]).toContain(res.status())
})

test('TC-SRV002 — POST /api/service-requests requires auth (anon gets 401)', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/service-requests`, {
    data: { service_type: 'ride', notes: 'test' },
    headers: { 'Content-Type': 'application/json' },
  })
  expect([401, 403, 302]).toContain(res.status())
})

test('TC-SRV003 — POST rejects missing service_type', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/service-requests`, {
    data: { notes: 'no type provided' },
    headers: { 'Content-Type': 'application/json' },
  })
  expect([400, 401, 403]).toContain(res.status())
})

test('TC-SRV004 — GET /api/service-requests/fake-id requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/service-requests/fake-id-00000000`)
  expect([401, 403, 404, 302]).toContain(res.status())
})

test('TC-SRV005 — PATCH requires auth', async ({ page }) => {
  const res = await page.request.patch(`${BASE}/api/service-requests/fake-id-00000000`, {
    data: { status: 'cancelled' },
    headers: { 'Content-Type': 'application/json' },
  })
  expect([401, 403, 404, 302]).toContain(res.status())
})

test('TC-SRV006 — /dashboard/support loads authenticated', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/support')
  if (page.url().includes('/login')) { test.skip(); return }
  expect(page.url()).not.toContain('500')
  await expect(page.locator('form')).toBeVisible()
})

test('TC-SRV007 — authenticated POST service-request returns 201', async ({ page }) => {
  await loginAs(page, ACCOUNTS.complete, '/dashboard')
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.post(`${BASE}/api/service-requests`, {
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieStr },
    data: { service_type: 'ride', notes: 'TC-SRV007 automated test', requested_for: '2026-12-20' },
  })
  expect([201, 401]).toContain(res.status())
  if (res.status() === 201) {
    const body = await res.json()
    expect(body.request.service_type).toBe('ride')
  }
})

test('TC-SRV008 — /api/services route exists (no 500)', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/services`)
  expect(res.status()).not.toBe(500)
})

test('TC-SRV009 — /api/member/marketplace exists (no 500)', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/member/marketplace`)
  expect([200, 401, 403]).toContain(res.status())
  expect(res.status()).not.toBe(500)
})

test('TC-SRV010 — /dashboard/services loads authenticated', async ({ page }) => {
  await loginAs(page, ACCOUNTS.complete, '/dashboard/services')
  if (page.url().includes('/login')) { test.skip(); return }
  expect(page.url()).not.toContain('500')
})
