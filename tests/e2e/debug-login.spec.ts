import { test, expect } from '@playwright/test'
import { loginAs, ACCOUNTS, BASE_URL as BASE } from './helpers'

test('debug login flow — fast cookie injection', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard')
  expect(page.url()).toContain('/dashboard')
  const cookies = await page.context().cookies()
  console.log('COOKIES:', cookies.map(c => c.name).join(', '))
  console.log('URL AFTER:', page.url())
})

test.skip('debug home-safety after login', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/home-safety')
  console.log('Home safety URL:', page.url())
  const body = await page.locator('body').innerText()
  console.log('Body preview:', body.substring(0, 200))
  expect(body).not.toMatch(/internal server error/i)
})
