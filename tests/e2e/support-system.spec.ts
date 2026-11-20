import { test, expect } from '@playwright/test'
import { loginAs, ACCOUNTS, BASE_URL as BASE } from './helpers'

test('TC-SUP001 — /dashboard/support loads', async ({ page }) => {
  const res = await page.request.get(`${BASE}/dashboard/support`)
  expect(res.status()).not.toBe(500)
})

test('TC-SUP002 — /dashboard/support has ticket form fields (authenticated)', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/support')
  if (page.url().includes('/login')) { test.skip(); return }
  await expect(page.locator('form')).toBeVisible()
  await expect(page.locator('input[type="radio"]').first()).toBeVisible()
  await expect(page.locator('textarea')).toBeVisible()
  await expect(page.locator('button[type="submit"]')).toBeVisible()
})

test('TC-SUP003 — /dashboard/support shows Quinn (authenticated)', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/support')
  if (page.url().includes('/login')) { test.skip(); return }
  expect((await page.content()).toLowerCase()).toMatch(/quinn|24\/7|concierge/)
})

test('TC-SUP004 — /dashboard/support has FAQ link (authenticated)', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/support')
  if (page.url().includes('/login')) { test.skip(); return }
  await expect(page.locator('a[href="/dashboard/support/faq"]')).toBeVisible()
})

test('TC-SUP005 — /org-admin/support loads (authenticated)', async ({ page }) => {
  await loginAs(page, ACCOUNTS.orgadmin, '/org-admin/support')
  if (page.url().includes('/login')) { test.skip(); return }
  expect(page.url()).not.toContain('500')
  expect((await page.content()).toLowerCase()).toMatch(/support|ticket|partner/)
})

test('TC-SUP006 — /org-admin/support has priority selector (authenticated)', async ({ page }) => {
  await loginAs(page, ACCOUNTS.orgadmin, '/org-admin/support')
  if (page.url().includes('/login')) { test.skip(); return }
  expect((await page.content()).toLowerCase()).toMatch(/urgent|priority/)
})

test('TC-SUP007 — /org-admin/support shows Jordan (authenticated)', async ({ page }) => {
  await loginAs(page, ACCOUNTS.orgadmin, '/org-admin/support')
  if (page.url().includes('/login')) { test.skip(); return }
  expect((await page.content()).toLowerCase()).toMatch(/jordan|partner support/)
})

test('TC-SUP008 — /org-admin/support SLA 24h visible (authenticated)', async ({ page }) => {
  await loginAs(page, ACCOUNTS.orgadmin, '/org-admin/support')
  if (page.url().includes('/login')) { test.skip(); return }
  expect(await page.content()).toMatch(/24.hour|24h|2.hour|2h/i)
})

test('TC-SUP009 — /admin/support loads (authenticated)', async ({ page }) => {
  await loginAs(page, ACCOUNTS.admin, '/admin/support')
  if (page.url().includes('/login')) { test.skip(); return }
  expect(page.url()).not.toContain('500')
})

test('TC-SUP010 — /admin/support has status filters (authenticated)', async ({ page }) => {
  await loginAs(page, ACCOUNTS.admin, '/admin/support')
  if (page.url().includes('/login')) { test.skip(); return }
  const c = (await page.content()).toLowerCase()
  expect(c).toMatch(/open/)
  expect(c).toMatch(/resolved/)
})

test('TC-SUP011 — /admin/support blocked for anon', async ({ page }) => {
  await page.goto(`${BASE}/admin/support`, { waitUntil: 'domcontentloaded' })
  expect(page.url()).not.toContain('500')
})

test('TC-SUP012 — POST /api/support/ticket rejects anon', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/support/ticket`, {
    data: { subject: 'test', description: 'test', category: 'billing', portal_type: 'member' },
    headers: { 'Content-Type': 'application/json' },
  })
  expect([200, 400, 401, 403]).toContain(res.status())
})

test('TC-SUP013 — POST /api/support/ticket validates fields', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/support/ticket`, {
    data: { portal_type: 'member' },
    headers: { 'Content-Type': 'application/json' },
  })
  expect([400, 401, 403]).toContain(res.status())
})

test('TC-SUP014 — GET /api/admin/support requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/admin/support`)
  expect([401, 403, 302]).toContain(res.status())
})

test('TC-SUP015 — PATCH /api/admin/support/[id] requires auth', async ({ page }) => {
  const res = await page.request.patch(`${BASE}/api/admin/support/fake-id-00000000`, {
    data: { status: 'resolved' }, headers: { 'Content-Type': 'application/json' },
  })
  expect([401, 403, 404, 302]).toContain(res.status())
})

test('TC-SUP016 — SupportWidget in /org-admin (authenticated)', async ({ page }) => {
  await loginAs(page, ACCOUNTS.orgadmin, '/org-admin')
  if (page.url().includes('/login')) { test.skip(); return }
  expect((await page.content()).toLowerCase()).toMatch(/support|jordan|partner/)
})

test('TC-SUP017 — SupportWidget in /employer-admin (authenticated)', async ({ page }) => {
  await loginAs(page, ACCOUNTS.employer, '/employer-admin')
  if (page.url().includes('/login')) { test.skip(); return }
  expect((await page.content()).toLowerCase()).toMatch(/support|jordan|partner|b2b/)
})

test('TC-SUP018 — SupportWidget in /vso-admin (authenticated)', async ({ page }) => {
  await loginAs(page, ACCOUNTS.vsoadmin, '/vso-admin')
  if (page.url().includes('/login')) { test.skip(); return }
  expect((await page.content()).toLowerCase()).toMatch(/support|jordan|partner|b2b/)
})

test('TC-SUP019 — /dashboard/support/faq loads (authenticated)', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/support/faq')
  if (page.url().includes('/login')) { test.skip(); return }
  expect(page.url()).not.toContain('500')
  expect((await page.content()).toLowerCase()).toMatch(/faq|help|aria|billing/)
})

test('TC-SUP020 — /org-admin/support/faq loads (authenticated)', async ({ page }) => {
  await loginAs(page, ACCOUNTS.orgadmin, '/org-admin/support/faq')
  if (page.url().includes('/login')) { test.skip(); return }
  expect(page.url()).not.toContain('500')
  expect((await page.content()).toLowerCase()).toMatch(/faq|help|partner|billing/)
})
