import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:3000'

test.describe('TC-V001/V010-V014: Voice API endpoints', () => {
  test.describe.configure({ retries: 1 })

  test('TC-V001/V010 — Aria cron endpoint exists (not 500)', async ({ request }) => {
    const resp = await request.get(BASE + '/api/cron/aria-calls', {
      headers: { 'x-cron-secret': process.env.CRON_SECRET || 'invalid' }
    })
    expect(resp.status()).not.toBe(500)
  })

  test('TC-V011 — /api/retell/call-ended exists', async ({ request }) => {
    const resp = await request.post(BASE + '/api/retell/call-ended', {
      headers: { 'Content-Type': 'application/json' },
      data: { call_id: 'test', call_status: 'ended' }
    })
    expect(resp.status()).not.toBe(404)
    expect(resp.status()).not.toBe(500)
  })

  test('TC-V012 — /api/check-in-calls exists', async ({ request }) => {
    const resp = await request.get(BASE + '/api/check-in-calls')
    expect(resp.status()).not.toBe(404)
    expect(resp.status()).not.toBe(500)
  })

  test('TC-V013 — /api/fraud-scan exists', async ({ request }) => {
    const resp = await request.post(BASE + '/api/fraud-scan', {
      headers: { 'Content-Type': 'application/json' },
      data: { content: 'Send me your bank details', source: 'voice' }
    })
    expect(resp.status()).not.toBe(404)
    expect(resp.status()).not.toBe(500)
  })

  test('TC-V014 — /api/crisis-alert exists', async ({ request }) => {
    const resp = await request.post(BASE + '/api/crisis-alert', {
      headers: { 'Content-Type': 'application/json' },
      data: { member_id: 'test', severity: 'high', source: 'voice' }
    })
    expect(resp.status()).not.toBe(500)
  })
})
