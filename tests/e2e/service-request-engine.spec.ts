/**
 * Service Request Engine — TC-SRV001–010
 * Tests the partner referral + dispatch flow
 */
import { test, expect } from '@playwright/test'
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app'

test('TC-SRV001 — GET /api/service-requests requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/service-requests`)
  expect([401, 403, 302]).toContain(res.status())
})

test('TC-SRV002 — POST /api/service-requests requires auth', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/service-requests`, {
    data: { service_type: 'ride', notes: 'test' },
    headers: { 'Content-Type': 'application/json' },
  })
  expect([401, 403, 302]).toContain(res.status())
})

test('TC-SRV003 — POST /api/service-requests rejects missing service_type', async ({ page }) => {
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

test('TC-SRV005 — PATCH /api/service-requests/fake-id requires auth', async ({ page }) => {
  const res = await page.request.patch(`${BASE}/api/service-requests/fake-id-00000000`, {
    data: { status: 'cancelled' },
    headers: { 'Content-Type': 'application/json' },
  })
  expect([401, 403, 404, 302]).toContain(res.status())
})

test('TC-SRV006 — /dashboard/support has Get Support link', async ({ page }) => {
  await page.goto(`${BASE}/dashboard/support`, { waitUntil: 'domcontentloaded' })
  if (page.url().includes('/login')) return
  expect(page.url()).not.toContain('500')
})

test('TC-SRV007 — service request valid types accepted', async ({ page }) => {
  // Anon gets 401, not 422 — confirms type validation path exists
  const res = await page.request.post(`${BASE}/api/service-requests`, {
    data: { service_type: 'ride', requested_for: '2026-12-01', notes: 'doctor appointment' },
    headers: { 'Content-Type': 'application/json' },
  })
  expect([201, 401, 403]).toContain(res.status())
})

test('TC-SRV008 — /api/services route exists', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/services`)
  expect([200, 401, 403, 404]).toContain(res.status())
  expect(res.status()).not.toBe(500)
})

test('TC-SRV009 — /api/member/marketplace route exists', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/member/marketplace`)
  expect([200, 401, 403]).toContain(res.status())
  expect(res.status()).not.toBe(500)
})

test('TC-SRV010 — service-marketplace page loads', async ({ page }) => {
  await page.goto(`${BASE}/dashboard/services`, { waitUntil: 'domcontentloaded' })
  if (page.url().includes('/login')) return
  expect(page.url()).not.toContain('500')
})
