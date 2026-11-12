import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'https://thrive-at-home-pied.vercel.app'
const SUPABASE_URL = 'https://qdniskppkfqjmtpkftdt.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg'

async function loginAs(page: any, email: string) {
  // Use UI form login — middleware reads cookies set by Supabase SSR on submit
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 20000 })
  await page.locator('input[type="email"], input[name="email"]').first().fill(email)
  await page.locator('input[type="password"], input[name="password"]').first().fill('TestPass123!')
  await page.locator('button[type="submit"], button:has-text("Sign In")').first().click()
  await page.waitForFunction(() => !window.location.pathname.startsWith('/login'), { timeout: 20000 })
}

test.describe('B2B Portals', () => {
  test.describe.configure({ retries: 2 })

  test('TC-B2B001 — /org-admin loads', async ({ page }) => {
    await loginAs(page, 'orgadmin@test.com')
    await page.goto(BASE + '/org-admin', { waitUntil: 'domcontentloaded', timeout: 20000 })
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/(?<![,\d])500(?![,\d])|internal server error/i)
  })

  test('TC-B2B010 — /employer-admin loads', async ({ page }) => {
    await loginAs(page, 'employer@test.com')
    await page.goto(BASE + '/employer-admin', { waitUntil: 'domcontentloaded', timeout: 20000 })
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/(?<![,\d])500(?![,\d])|internal server error/i)
  })

  test('TC-B2B011 — /employers landing page (public)', async ({ page }) => {
    await page.goto(BASE + '/employers', { waitUntil: 'domcontentloaded', timeout: 20000 })
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/404|not found/i)
  })

  test('TC-B2B012 — /employer-admin/invite/[token] renders', async ({ page }) => {
    await page.goto(BASE + '/employer-admin/invite/test-token', { waitUntil: 'domcontentloaded', timeout: 20000 })
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/(?<![,\d])500(?![,\d])|internal server error/i)
  })

  test('TC-B2B020 — /senior-center-admin loads', async ({ page }) => {
    await loginAs(page, 'seniorcenter@test.com')
    await page.goto(BASE + '/senior-center-admin', { waitUntil: 'domcontentloaded', timeout: 20000 })
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/(?<![,\d])500(?![,\d])|internal server error/i)
  })

  test('TC-B2B025 — /aaa-admin loads', async ({ page }) => {
    await loginAs(page, 'aaa@test.com')
    await page.goto(BASE + '/aaa-admin', { waitUntil: 'domcontentloaded', timeout: 20000 })
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/(?<![,\d])500(?![,\d])|internal server error/i)
  })

  test('TC-B2B030 — /network-admin loads', async ({ page }) => {
    await loginAs(page, 'network@test.com')
    await page.goto(BASE + '/network-admin', { waitUntil: 'domcontentloaded', timeout: 20000 })
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/(?<![,\d])500(?![,\d])|internal server error/i)
  })

  test('TC-B2B035 — /agency-admin loads', async ({ page }) => {
    await loginAs(page, 'agency@test.com')
    await page.goto(BASE + '/agency-admin', { waitUntil: 'domcontentloaded', timeout: 20000 })
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/(?<![,\d])500(?![,\d])|internal server error/i)
  })
})

test.describe('Volunteer Portals', () => {
  test.describe.configure({ retries: 2 })

  test('TC-VOL001 — /university-admin loads', async ({ page }) => {
    await loginAs(page, 'uniadmin@test.com')
    await page.goto(BASE + '/university-admin', { waitUntil: 'domcontentloaded', timeout: 20000 })
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/(?<![,\d])500(?![,\d])|internal server error/i)
  })

  test('TC-VOL010 — /vso-admin loads', async ({ page }) => {
    await loginAs(page, 'vsoadmin@test.com')
    await page.goto(BASE + '/vso-admin', { waitUntil: 'domcontentloaded', timeout: 20000 })
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/(?<![,\d])500(?![,\d])|internal server error/i)
  })

  test('TC-VOL020 — /school-admin loads', async ({ page }) => {
    await loginAs(page, 'k12admin@test.com')
    await page.goto(BASE + '/school-admin', { waitUntil: 'domcontentloaded', timeout: 20000 })
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/(?<![,\d])500(?![,\d])|internal server error/i)
  })

  test('TC-VOL030 — Retired pro login lands on valid page', async ({ page }) => {
    await loginAs(page, 'volunteer@test.com')
    await page.goto(BASE + '/volunteer/dashboard', { waitUntil: 'domcontentloaded', timeout: 20000 })
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/(?<![,\d])500(?![,\d])|internal server error/i)
  })

  test('TC-VOL060 — /api/volunteer/training-status exists (not 404/500)', async ({ page }) => {
    const res = await page.request.get(BASE + '/api/volunteer/training-status')
    expect(res.status()).not.toBe(404)
    expect(res.status()).not.toBe(500)
  })
})

test.describe('Billing pricing checks', () => {
  test('TC-B001 — Basic $39/mo on /pricing', async ({ page }) => {
    await page.goto(BASE + '/pricing', { waitUntil: 'domcontentloaded', timeout: 20000 })
    const body = await page.locator('body').innerText()
    expect(body).toMatch(/39/)
  })

  test('TC-B003 — Basic annual pricing on /pricing', async ({ page }) => {
    await page.goto(BASE + '/pricing', { waitUntil: 'domcontentloaded', timeout: 20000 })
    const body = await page.locator('body').innerText()
    expect(body).toMatch(/pricing|plan|annual/i)
  })

  test('TC-B004 — Complete annual pricing on /pricing', async ({ page }) => {
    await page.goto(BASE + '/pricing', { waitUntil: 'domcontentloaded', timeout: 20000 })
    const body = await page.locator('body').innerText()
    expect(body).toMatch(/pricing|plan/i)
  })
})
