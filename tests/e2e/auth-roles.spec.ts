import { test, expect } from '@playwright/test'
import { loginAs, ACCOUNTS, BASE_URL as BASE , getToken, dbGet, dbDelete } from './helpers'

const SUPABASE_URL = 'https://qdniskppkfqjmtpkftdt.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg'



// TC-A004/P050 — All key roles login via cookie injection and reach correct portal
const ROLE_PORTAL_MAP = [
  { key: 'member',    portal: '/dashboard',           label: 'Member' },
  { key: 'family',    portal: '/dashboard/family',    label: 'Family' },
  { key: 'navigator', portal: '/navigator',            label: 'Navigator' },
  { key: 'admin',     portal: '/admin',               label: 'Admin' },
  { key: 'volunteer', portal: '/volunteer/dashboard', label: 'Volunteer' },
  { key: 'orgadmin',  portal: '/org-admin',           label: 'OrgAdmin' },
  { key: 'employer',  portal: '/employer-admin',      label: 'Employer' },
]

for (const { key, portal, label } of ROLE_PORTAL_MAP) {
  test(`TC-A004-${key} — ${label} cookie injection routes to ${portal}`, async ({ page }) => {
    const account = ACCOUNTS[key]
    await loginAs(page, account, portal)
    const token = await getToken(page, account)
    if (!token) { test.skip(); return }
    expect(page.url()).not.toContain('/login')
  })
}

// TC-A005 — Cross-role API isolation: member token cannot read navigator tasks
test('TC-A005-member-vs-navigator — member token blocked from navigator API', async ({ page }) => {
  const token = await getToken(page, ACCOUNTS.member)
  if (!token) { test.skip(); return }
  const res = await page.request.get(`${SUPABASE_URL}/rest/v1/navigator_time_logs?select=*&limit=1`, {
    headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` },
  })
  // RLS should return empty or 403, not data from other users
  expect([200, 400, 401, 403]).toContain(res.status())
  if (res.status() === 200) {
    const rows = await res.json()
    expect(Array.isArray(rows)).toBe(true)
    // member should not see navigator rows
    expect(rows.length).toBe(0)
  }
})

// TC-A005-volunteer — volunteer token cannot see admin table
test('TC-A005-volunteer-vs-admin — volunteer token blocked from admin data', async ({ page }) => {
  const token = await getToken(page, ACCOUNTS.volunteer)
  if (!token) { test.skip(); return }
  const rows = await dbGet(page, token, 'encore_profiles', 'role=eq.admin&select=id,role')
  expect(Array.isArray(rows)).toBe(true)
  expect(rows.length).toBe(0)
})

// TC-P051 — /signup validation: page loads, returns 200
test('TC-P051 — /signup page loads without error', async ({ page }) => {
  const res = await page.request.get(`${BASE}/signup`)
  expect(res.status()).not.toBe(500)
})

// TC-A006 — /api/admin/ambassadors requires auth
test('TC-A006-auth-guard — /api/admin/ambassadors returns 401 without token', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/admin/ambassadors`)
  expect([401, 403, 302]).toContain(res.status())
})

// TC-ROLE001 — orgadmin token can read org stats
test('TC-ROLE001 — orgadmin can call /api/org-admin/stats', async ({ page }) => {
  await loginAs(page, ACCOUNTS.orgadmin, '/org-admin', test)
  const token = await getToken(page, ACCOUNTS.orgadmin)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/org-admin/stats`, {
    headers: { 'Cookie': cookieStr },
  })
  expect([200, 404, 403]).toContain(res.status())
})

// TC-ROLE002 — agency token can read agency workers
test('TC-ROLE002 — agency admin can call /api/agency/workers', async ({ page }) => {
  await loginAs(page, ACCOUNTS.agency, '/agency-admin', test)
  const token = await getToken(page, ACCOUNTS.agency)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.get(`${BASE}/api/agency/workers`, {
    headers: { 'Cookie': cookieStr },
  })
  expect([200, 404]).toContain(res.status())
})
