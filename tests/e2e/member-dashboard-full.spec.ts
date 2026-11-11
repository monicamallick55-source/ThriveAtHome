import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const MEMBER = { email: 'member@test.com', password: 'TestPass123!' }

async function loginAsMember(page: any) {
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
  await page.fill('input[type="email"], input[name="email"]', MEMBER.email)
  await page.fill('input[type="password"], input[name="password"]', MEMBER.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/dashboard/, { timeout: 20000 })
}

const DASHBOARD_PAGES = [
  { tc: 'TC-M001', path: '/dashboard' },
  { tc: 'TC-M002', path: '/dashboard/health' },
  { tc: 'TC-M004', path: '/dashboard/buddy' },
  { tc: 'TC-M005', path: '/dashboard/communities' },
  { tc: 'TC-M007', path: '/dashboard/skill-exchange' },
  { tc: 'TC-M011', path: '/dashboard/trusted-advisors' },
  { tc: 'TC-M012', path: '/dashboard/fraud-protection' },
  { tc: 'TC-M013', path: '/dashboard/benefits-finder' },
  { tc: 'TC-M014', path: '/dashboard/plan' },
  { tc: 'TC-M016', path: '/dashboard/profile' },
  { tc: 'TC-M017', path: '/dashboard/vault' },
  { tc: 'TC-M018', path: '/dashboard/navigator' },
  { tc: 'TC-M020', path: '/dashboard/home-safety' },
  { tc: 'TC-M022', path: '/dashboard/encore-careers' },
  { tc: 'TC-M023', path: '/dashboard/medicare-help' },
  { tc: 'TC-M026', path: '/dashboard/festivals' },
  { tc: 'TC-M029', path: '/dashboard/transition' },
  { tc: 'TC-M031', path: '/dashboard/gift-send' },
  { tc: 'TC-M033', path: '/dashboard/celebrations' },
  { tc: 'TC-M034', path: '/dashboard/celebrations/plan' },
]

test.describe('Member dashboard pages', () => {
  test.describe.configure({ retries: 2 })
  for (const { tc, path } of DASHBOARD_PAGES) {
    test(`${tc} — ${path} loads without 500`, async ({ page }) => {
      await loginAsMember(page)
      await page.goto(BASE + path, { waitUntil: 'domcontentloaded' })
      const body = await page.textContent('body')
      expect(body?.length).toBeGreaterThan(100)
      expect(body).not.toMatch(/500|internal server error/i)
    })
  }
})

test.describe('TC-A002: Family invitation', () => {
  test.describe.configure({ retries: 2 })
  test('TC-A002 — /api/family/invite endpoint exists (not 404/500)', async ({ request }) => {
    const resp = await request.post(BASE + '/api/family/invite', {
      data: { email: 'newfamily@example.com', member_id: 'test' },
      headers: { 'Content-Type': 'application/json' }
    })
    expect(resp.status()).not.toBe(404)
    expect(resp.status()).not.toBe(500)
  })
  test('TC-A002b — /invite/[token] renders without 500', async ({ page }) => {
    const resp = await page.goto(BASE + '/invite/test-token-123', { waitUntil: 'domcontentloaded' })
    expect(resp?.status()).toBeLessThan(500)
  })
})

test.describe('TC-A006: Device kiosk', () => {
  test.describe.configure({ retries: 2 })
  test('TC-A006 — /device loads or redirects (no 500)', async ({ page }) => {
    const resp = await page.goto(BASE + '/device', { waitUntil: 'domcontentloaded' })
    expect(resp?.status()).toBeLessThan(500)
  })
})
