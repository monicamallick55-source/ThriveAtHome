import { test, expect } from '@playwright/test'
import { loginAs, ACCOUNTS, BASE_URL as BASE } from './helpers'

test('debug opt-in — retell opt-in API', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard', test)
  const result = await page.evaluate(async () => {
    const r = await fetch('/api/retell/opt-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opted_in: true }),
      credentials: 'include',
    })
    return { status: r.status, body: await r.text() }
  })
  console.log('OPT-IN RESULT:', JSON.stringify(result))
  expect([200, 201, 400]).toContain(result.status)
})

test.skip('debug webhook + check-ins + buddy', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard', test)

  const r1 = await page.evaluate(async () => {
    const r = await fetch('/api/retell/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ call_id: 'test-123', mood: 'happy' }),
      credentials: 'include',
    })
    return { status: r.status, body: await r.text() }
  })
  console.log('WEBHOOK:', JSON.stringify(r1))

  const r2 = await page.evaluate(async () => {
    const r = await fetch('/api/check-ins', { credentials: 'include' })
    return { status: r.status, body: await r.text() }
  })
  console.log('CHECKINS:', JSON.stringify(r2))

  const r3 = await page.evaluate(async () => {
    const r = await fetch('/api/buddy/brief', { credentials: 'include' })
    return { status: r.status, body: await r.text() }
  })
  console.log('BUDDY:', JSON.stringify(r3))

  expect([200, 201, 400, 404]).toContain(r1.status)
  expect([200, 401]).toContain(r2.status)
  expect([200, 401, 404]).toContain(r3.status)
})
