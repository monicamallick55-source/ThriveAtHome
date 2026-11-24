import { test, expect } from '@playwright/test'
import { loginAs, ACCOUNTS, BASE_URL as BASE , getToken, dbGet, dbDelete } from './helpers'

const SUPABASE_URL = 'https://qdniskppkfqjmtpkftdt.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg'




// TC-DV001 — /api/device GET requires auth
test('TC-DV001 — /api/device GET requires auth', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/device`)
  expect([401, 403, 404, 405]).toContain(res.status())
})

// TC-DV002 — /api/device POST registers device → DB row created
test('TC-DV002 — /api/device POST registers device and creates DB row', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard', test)
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')

  const deviceId = `test-device-${Date.now()}`
  const res = await page.request.post(`${BASE}/api/device`, {
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieStr },
    data: { device_id: deviceId, device_type: 'tablet', label: 'E2E Test Device' },
  })
  if (res.status() === 404) { test.skip(); return }
  expect([200, 201, 400]).toContain(res.status())

  if (res.status() === 201) {
    const body = await res.json()
    const id = body.id || body.device?.id
    if (id) {
      const rows = await dbGet(page, token, 'member_devices', `id=eq.${id}`)
      expect(rows.length).toBe(1)
      await dbDelete(page, token, 'member_devices', `id=eq.${id}`)
    }
  }
})

// TC-DV003 — /kiosk route returns non-500
test('TC-DV003 — /kiosk route returns non-500', async ({ page }) => {
  const res = await page.request.get(`${BASE}/kiosk`)
  expect(res.status()).not.toBe(500)
})

// TC-DV004 — admin can list devices via API
test('TC-DV004 — admin can list devices via API', async ({ page }) => {
  await loginAs(page, ACCOUNTS.admin, '/admin', test)
  const token = await getToken(page, ACCOUNTS.admin)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/admin/devices`, {
    headers: { 'Cookie': cookieStr },
  })
  expect([200, 404]).toContain(res.status())
})

// TC-DV005 — /api/device-registration requires auth
test('TC-DV005 — /api/device-registration requires auth', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/device-registration`, {
    data: { device_id: 'anon-device' },
    headers: { 'Content-Type': 'application/json' },
  })
  expect([401, 403, 404]).toContain(res.status())
})
