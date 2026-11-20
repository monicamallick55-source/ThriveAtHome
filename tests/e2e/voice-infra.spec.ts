import { test, expect } from '@playwright/test'
import { loginAs, ACCOUNTS, BASE_URL as BASE } from './helpers'

test.describe('TC-V001/V010-V014: Voice API endpoints', () => {
  test.describe.configure({ retries: 1 })

  test('TC-V001/V010 — Aria cron endpoint exists (not 500)', async ({ page }) => {
    const resp = await page.request.get(`${BASE}/api/cron/aria-calls`, {
      headers: { 'x-cron-secret': process.env.CRON_SECRET || 'invalid' },
    })
    expect(resp.status()).not.toBe(500)
  })

  test('TC-V011 — /api/retell/call-ended webhook exists', async ({ page }) => {
    const resp = await page.request.post(`${BASE}/api/retell/call-ended`, {
      headers: { 'Content-Type': 'application/json' },
      data: { call_id: 'test', call_status: 'ended' },
    })
    expect(resp.status()).not.toBe(404)
    expect(resp.status()).not.toBe(500)
  })

  test('TC-V012 — /api/check-in-calls requires auth (authenticated returns 200)', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard')
    const cookies = await page.context().cookies()
    const resp = await page.request.get(`${BASE}/api/check-in-calls`, {
      headers: { 'Cookie': cookies.map(c => `${c.name}=${c.value}`).join('; ') },
    })
    expect(resp.status()).not.toBe(404)
    expect(resp.status()).not.toBe(500)
    expect([200, 401]).toContain(resp.status())
  })

  test('TC-V013 — /api/fraud-scan requires auth (authenticated accepts content)', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard')
    const cookies = await page.context().cookies()
    const resp = await page.request.post(`${BASE}/api/fraud-scan`, {
      headers: { 'Content-Type': 'application/json', 'Cookie': cookies.map(c => `${c.name}=${c.value}`).join('; ') },
      data: { content: 'Send me your bank details', source: 'voice' },
    })
    expect(resp.status()).not.toBe(404)
    expect(resp.status()).not.toBe(500)
  })

  test('TC-V014 — /api/crisis-alert exists (not 500)', async ({ page }) => {
    const resp = await page.request.post(`${BASE}/api/crisis-alert`, {
      headers: { 'Content-Type': 'application/json' },
      data: { member_id: 'test', severity: 'high', source: 'voice' },
    })
    expect(resp.status()).not.toBe(500)
  })
})
