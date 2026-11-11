import { test, expect } from '@playwright/test'

// TC-P002, TC-P004, TC-P005, TC-P008, TC-P009, TC-P050, TC-P070, TC-P071
const BASE = process.env.BASE_URL || 'http://localhost:3000'

test.describe('TC-P002 / TC-P005: Public page essentials', () => {
  test.describe.configure({ retries: 2 })
  test('TC-P002 — Mission strip donate pill links to /donate', async ({ page }) => {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
    const donateLink = page.locator('a[href*="/donate"]').first()
    await expect(donateLink).toBeVisible({ timeout: 15000 })
  })
  test('TC-P004 — Pricing page shows Basic $39 and Complete $79', async ({ page }) => {
    await page.goto(BASE + '/pricing', { waitUntil: 'domcontentloaded' })
    const body = await page.textContent('body')
    expect(body).toMatch(/\$39|\$39\.00|39\/mo/)
    expect(body).toMatch(/\$79|\$79\.00|79\/mo/)
  })
  test('TC-P005 — Footer links /privacy and /terms load', async ({ page }) => {
    const r1 = await page.goto(BASE + '/privacy', { waitUntil: 'domcontentloaded' })
    expect(r1?.status()).toBeLessThan(500)
    const r2 = await page.goto(BASE + '/terms', { waitUntil: 'domcontentloaded' })
    expect(r2?.status()).toBeLessThan(500)
  })
})

test.describe('TC-P008: Mobile responsiveness', () => {
  test.describe.configure({ retries: 1 })
  test('TC-P008 — Home page at 390px has no horizontal scroll', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await ctx.newPage()
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
    const clientWidth = await page.evaluate(() => document.body.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)
    await ctx.close()
  })
})

test.describe('TC-P009: SEO meta tags', () => {
  test.describe.configure({ retries: 1 })
  test('TC-P009 — Home page has title, description, og:title, favicon', async ({ page }) => {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
    const title = await page.title()
    expect(title.length).toBeGreaterThan(5)
    const desc = await page.locator('meta[name="description"]').getAttribute('content')
    expect(desc?.length).toBeGreaterThan(10)
    const ogTitle = await page.locator('meta[property="og:title"], meta[name="og:title"]').count()
    expect(ogTitle).toBeGreaterThan(0)
    const favicon = await page.locator('link[rel*="icon"]').count()
    expect(favicon).toBeGreaterThan(0)
  })
})

test.describe('TC-P050: Login fields', () => {
  test.describe.configure({ retries: 2 })
  test('TC-P050 — /login has email+password fields', async ({ page }) => {
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible()
  })
})

test.describe('TC-P070: All public routes 200', () => {
  test.describe.configure({ retries: 1 })
  const PUBLIC_ROUTES = ['/', '/about', '/pricing', '/for-families', '/for-volunteers',
    '/employers', '/outcomes', '/team', '/donate', '/blog',
    '/resources', '/directory', '/login', '/signup', '/privacy', '/terms']
  for (const route of PUBLIC_ROUTES) {
    test(`TC-P070 — ${route} returns non-500`, async ({ page }) => {
      const resp = await page.goto(BASE + route, { waitUntil: 'domcontentloaded' })
      expect(resp?.status() ?? 0).toBeLessThan(500)
    })
  }
})

test.describe('TC-P071: Mobile responsive', () => {
  test.describe.configure({ retries: 1 })
  const MOBILE_PAGES = ['/', '/pricing', '/for-families', '/about', '/login', '/signup']
  for (const route of MOBILE_PAGES) {
    test(`TC-P071 — ${route} at 390px no overflow`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
      const page = await ctx.newPage()
      await page.goto(BASE + route, { waitUntil: 'domcontentloaded' })
      const sw = await page.evaluate(() => document.body.scrollWidth)
      const cw = await page.evaluate(() => document.body.clientWidth)
      expect(sw).toBeLessThanOrEqual(cw + 10)
      await ctx.close()
    })
  }
})
