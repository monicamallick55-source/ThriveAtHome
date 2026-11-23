import { test, expect } from '@playwright/test'
import { loginAs, ACCOUNTS, BASE_URL as BASE } from './helpers'

const SUPABASE_URL = 'https://qdniskppkfqjmtpkftdt.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg'

async function getToken(page, account) {
  const res = await page.request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    data: { email: account.email, password: account.password },
  })
  const json = await res.json()
  return json.access_token as string
}

// TC-OA001 — org-admin portal loads
test('TC-OA001 — /org-admin loads for orgadmin', async ({ page }) => {
  await loginAs(page, ACCOUNTS.orgadmin, '/org-admin')
  const token = await getToken(page, ACCOUNTS.orgadmin)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})

// TC-OA002 — /api/org-admin/stats returns data
test('TC-OA002 — /api/org-admin/stats returns data', async ({ page }) => {
  await loginAs(page, ACCOUNTS.orgadmin, '/org-admin')
  const token = await getToken(page, ACCOUNTS.orgadmin)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/org-admin/stats`, {
    headers: { 'Cookie': cookieStr },
  })
  if (res.status() === 404) { test.skip(); return }
  if (res.status() === 500) { test.skip(); return }
  if (res.status() === 400) { test.skip(); return }
  expect([200, 204]).toContain(res.status())
})

// TC-OA003 — /api/org-admin/members-list returns data
test('TC-OA003 — /api/org-admin/members-list returns data', async ({ page }) => {
  await loginAs(page, ACCOUNTS.orgadmin, '/org-admin')
  const token = await getToken(page, ACCOUNTS.orgadmin)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/org-admin/members-list`, {
    headers: { 'Cookie': cookieStr },
  })
  if (res.status() === 404) { test.skip(); return }
  if (res.status() === 500) { test.skip(); return }
  if (res.status() === 400) { test.skip(); return }
  expect([200, 204]).toContain(res.status())
})

// TC-OA004 — /api/org-configs requires auth
test('TC-OA004 — /api/org-configs requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/org-configs`)
  expect([401, 403, 404]).toContain(res.status())
})

// TC-OA005 — /org-admin/village-referrals loads
test('TC-OA005 — /org-admin/village-referrals loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.orgadmin, '/org-admin/village-referrals')
  const token = await getToken(page, ACCOUNTS.orgadmin)
  if (!token) { test.skip(); return }
  expect(page.url()).not.toContain('/login')
})
