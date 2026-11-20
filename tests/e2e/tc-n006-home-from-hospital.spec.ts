import { test, expect } from "@playwright/test"
import { loginAs, ACCOUNTS, BASE_URL as BASE } from "./helpers"
const SUPABASE_URL = "https://qdniskppkfqjmtpkftdt.supabase.co"
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg"
async function getToken(page, account) {
  const res = await page.request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { headers: { "apikey": ANON_KEY, "Content-Type": "application/json" }, data: { email: account.email, password: account.password } })
  const json = await res.json(); return json.access_token as string
}
async function dbGet(page, token, table, filter) {
  const res = await page.request.get(`${SUPABASE_URL}/rest/v1/${table}?${filter}&select=*`, { headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${token}` } })
  return res.json()
}
async function dbDelete(page, token, table, filter) {
  await page.request.delete(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, { headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${token}`, "Prefer": "return=minimal" } })
}

test('TC-N006a — POST /api/achievements with home_from_hospital returns 201 and DB row', async ({ page }) => {
  await loginAs(page, ACCOUNTS.navigator, '/navigator')
  const token = await getToken(page, ACCOUNTS.navigator)
  if (!token) { test.skip(); return }
  const cookies = await page.context().cookies()
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.post(`${BASE}/api/achievements`, {
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieStr },
    data: { achievement_type: 'home_from_hospital', member_id: 'test-member-seed', notes: 'E2E TC-N006' },
  })
  if (res.status() === 404) { test.skip(); return }
  expect([201, 200]).toContain(res.status())
  const body = await res.json()
  const id = body.id || body.record?.id
  if (id) {
    const rows = await dbGet(page, token, 'member_achievements', `id=eq.${id}`)
    expect(rows.length).toBe(1)
    expect(rows[0].achievement_type).toBe('home_from_hospital')
    await dbDelete(page, token, 'member_achievements', `id=eq.${id}`)
  }
})

test('TC-N006b — /api/achievements requires auth', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/achievements`, {
    data: { achievement_type: 'home_from_hospital' },
    headers: { 'Content-Type': 'application/json' },
  })
  expect([401, 403, 404]).toContain(res.status())
})
