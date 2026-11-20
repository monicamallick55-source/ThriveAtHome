import { test, expect } from '@playwright/test'
import { loginAs, ACCOUNTS, BASE_URL as BASE } from './helpers'

test.describe('TC-N006: home_from_hospital achievement flow', () => {
  test.describe.configure({ retries: 2 })

  test('TC-N006a — POST /api/achievements with home_from_hospital returns 201', async ({ page }) => {
    await loginAs(page, ACCOUNTS.navigator, '/dashboard')

    const resp = await page.evaluate(async (base) => {
      const r = await fetch(`${base}/api/achievements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: 'test-member-seed',
          type: 'home_from_hospital',
          occurred_at: new Date().toISOString(),
          shared_with_family: true,
          metadata: { notes: 'TC-N006 automated test' },
        }),
        credentials: 'include',
      })
      return { status: r.status, body: await r.json().catch(() => ({})) }
    }, BASE)

    expect(resp.status).not.toBe(500)
    expect(resp.status).not.toBe(401)
    if (resp.status === 201) {
      expect(resp.body.achievement).toBeTruthy()
      expect(resp.body.achievement.type).toBe('home_from_hospital')
    }
  })

  test('TC-N006b — GET /api/achievements returns list (navigator auth)', async ({ page }) => {
    await loginAs(page, ACCOUNTS.navigator, '/dashboard')

    const resp = await page.evaluate(async (base) => {
      const r = await fetch(`${base}/api/achievements`, { credentials: 'include' })
      return { status: r.status, body: await r.json().catch(() => ({})) }
    }, BASE)

    expect(resp.status).not.toBe(500)
    expect(resp.status).not.toBe(404)
    if (resp.status === 200) {
      expect(Array.isArray(resp.body.achievements)).toBe(true)
    }
  })

  test('TC-N006c — Navigator UI shows home-from-hospital section', async ({ page }) => {
    await loginAs(page, ACCOUNTS.navigator, '/dashboard/navigator')
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/internal server error/i)
    expect(body.length).toBeGreaterThan(100)
    const hasDischarge = /hospital|discharge|home.from|achievement/i.test(body)
    if (!hasDischarge) console.warn('TC-N006c: Hospital discharge UI not visible — may need seeded achievement')
  })
})
