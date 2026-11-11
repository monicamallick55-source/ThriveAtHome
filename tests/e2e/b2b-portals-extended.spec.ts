import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:3000'

async function loginAs(page: any, email: string) {
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
  await page.fill('input[type="email"], input[name="email"]', email)
  await page.fill('input[type="password"], input[name="password"]', 'TestPass123!')
  await page.click('button[type="submit"]')
  await page.waitForURL(/dashboard|admin|org|employer|university|vso|school|senior|aaa|network|agency/, { timeout: 20000 })
}

test.describe('B2B Portals', () => {
  test.describe.configure({ retries: 2 })

  test('TC-B2B001 — /org-admin loads', async ({ page }) => {
    await loginAs(page, 'orgadmin@test.com')
    await page.goto(BASE + '/org-admin', { waitUntil: 'domcontentloaded' })
    const body = await page.textContent('body')
    expect(body).not.toMatch(/500|internal server error/i)
    expect(body?.length).toBeGreaterThan(100)
  })

  test('TC-B2B010 — /employer-admin loads', async ({ page }) => {
    await loginAs(page, 'employer@test.com')
    await page.goto(BASE + '/employer-admin', { waitUntil: 'domcontentloaded' })
    const body = await page.textContent('body')
    expect(body).not.toMatch(/500|internal server error/i)
    expect(body?.length).toBeGreaterThan(100)
  })

  test('TC-B2B011 — /employers landing page (public)', async ({ page }) => {
    const resp = await page.goto(BASE + '/employers', { waitUntil: 'domcontentloaded' })
    expect(resp?.status()).toBeLessThan(500)
  })

  test('TC-B2B012 — /employer-admin/invite/[token] renders', async ({ page }) => {
    const resp = await page.goto(BASE + '/employer-admin/invite/test-token', { waitUntil: 'domcontentloaded' })
    expect(resp?.status()).toBeLessThan(500)
  })

  test('TC-B2B020 — /senior-center-admin loads', async ({ page }) => {
    await loginAs(page, 'seniorcenter@test.com')
    await page.goto(BASE + '/senior-center-admin', { waitUntil: 'domcontentloaded' })
    const body = await page.textContent('body')
    expect(body).not.toMatch(/500|internal server error/i)
    expect(body?.length).toBeGreaterThan(100)
  })

  test('TC-B2B025 — /aaa-admin loads', async ({ page }) => {
    await loginAs(page, 'aaa@test.com')
    await page.goto(BASE + '/aaa-admin', { waitUntil: 'domcontentloaded' })
    const body = await page.textContent('body')
    expect(body).not.toMatch(/500|internal server error/i)
    expect(body?.length).toBeGreaterThan(100)
  })

  test('TC-B2B030 — /network-admin loads', async ({ page }) => {
    await loginAs(page, 'network@test.com')
    await page.goto(BASE + '/network-admin', { waitUntil: 'domcontentloaded' })
    const body = await page.textContent('body')
    expect(body).not.toMatch(/500|internal server error/i)
    expect(body?.length).toBeGreaterThan(100)
  })

  test('TC-B2B035 — /agency-admin loads', async ({ page }) => {
    await loginAs(page, 'agency@test.com')
    await page.goto(BASE + '/agency-admin', { waitUntil: 'domcontentloaded' })
    const body = await page.textContent('body')
    expect(body).not.toMatch(/500|internal server error/i)
    expect(body?.length).toBeGreaterThan(100)
  })
})

test.describe('Volunteer Portals', () => {
  test.describe.configure({ retries: 2 })

  test('TC-VOL001 — /university-admin loads', async ({ page }) => {
    await loginAs(page, 'uniadmin@test.com')
    await page.goto(BASE + '/university-admin', { waitUntil: 'domcontentloaded' })
    const body = await page.textContent('body')
    expect(body).not.toMatch(/500|internal server error/i)
    expect(body?.length).toBeGreaterThan(100)
  })

  test('TC-VOL010 — /vso-admin loads', async ({ page }) => {
    await loginAs(page, 'vsoadmin@test.com')
    await page.goto(BASE + '/vso-admin', { waitUntil: 'domcontentloaded' })
    const body = await page.textContent('body')
    expect(body).not.toMatch(/500|internal server error/i)
    expect(body?.length).toBeGreaterThan(100)
  })

  test('TC-VOL020 — /school-admin loads', async ({ page }) => {
    await loginAs(page, 'k12student@test.com')
    await page.goto(BASE + '/school-admin', { waitUntil: 'domcontentloaded' })
    const body = await page.textContent('body')
    expect(body).not.toMatch(/500|internal server error/i)
    expect(body?.length).toBeGreaterThan(100)
  })

  test('TC-VOL030 — Retired pro login lands on valid page', async ({ page }) => {
    await loginAs(page, 'retired_pro@test.com')
    const body = await page.textContent('body')
    expect(body?.length).toBeGreaterThan(100)
    expect(body).not.toMatch(/500|internal server error/i)
  })

  test('TC-VOL060 — /api/volunteer/training-status exists (not 404/500)', async ({ request }) => {
    const resp = await request.get(BASE + '/api/volunteer/training-status')
    expect(resp.status()).not.toBe(404)
    expect(resp.status()).not.toBe(500)
  })
})

test.describe('Billing pricing checks', () => {
  test.describe.configure({ retries: 2 })

  test('TC-B001 — Basic $39/mo on /pricing', async ({ page }) => {
    await page.goto(BASE + '/pricing', { waitUntil: 'domcontentloaded' })
    const body = await page.textContent('body')
    expect(body).toMatch(/\$39|\$39\.00|39\/mo/)
  })

  test('TC-B003 — Basic annual pricing on /pricing', async ({ page }) => {
    await page.goto(BASE + '/pricing', { waitUntil: 'domcontentloaded' })
    const body = await page.textContent('body')
    expect(body).toMatch(/annual|yearly|\$421|\$35\/mo/i)
  })

  test('TC-B004 — Complete annual pricing on /pricing', async ({ page }) => {
    await page.goto(BASE + '/pricing', { waitUntil: 'domcontentloaded' })
    const body = await page.textContent('body')
    expect(body).toMatch(/annual|yearly|\$853|\$71\/mo/i)
  })
})
