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

const MEMBER_DASHBOARD_PAGES = [
  { path: '/dashboard',                      tc: 'TC-M001' },
  { path: '/dashboard/health',               tc: 'TC-M002' },
  { path: '/dashboard/family',               tc: 'TC-M003' },
  { path: '/dashboard/buddy',                tc: 'TC-M004' },
  { path: '/dashboard/communities',          tc: 'TC-M005' },
  { path: '/dashboard/events',               tc: 'TC-M006' },
  { path: '/dashboard/skill-exchange',       tc: 'TC-M007' },
  { path: '/dashboard/grief-support',        tc: 'TC-M008' },
  { path: '/dashboard/grief-circles',        tc: 'TC-M009' },
  { path: '/dashboard/life-transitions',     tc: 'TC-M010' },
  { path: '/dashboard/trusted-advisors',     tc: 'TC-M011' },
  { path: '/dashboard/fraud-protection',     tc: 'TC-M012' },
  { path: '/dashboard/benefits-finder',      tc: 'TC-M013' },
  { path: '/dashboard/plan',                 tc: 'TC-M014' },
  { path: '/dashboard/addons',               tc: 'TC-M015' },
  { path: '/dashboard/profile',              tc: 'TC-M016' },
  { path: '/dashboard/vault',                tc: 'TC-M017' },
  { path: '/dashboard/navigator',            tc: 'TC-M018' },
  { path: '/dashboard/marketplace',          tc: 'TC-M019' },
  { path: '/dashboard/home-safety',          tc: 'TC-M020' },
  { path: '/dashboard/home-sharing',         tc: 'TC-M021' },
  { path: '/dashboard/encore-careers',       tc: 'TC-M022' },
  { path: '/dashboard/medicare-help',        tc: 'TC-M023' },
  { path: '/dashboard/plan-comparison',      tc: 'TC-M024' },
  { path: '/dashboard/fhir-referrals',       tc: 'TC-M025' },
  { path: '/dashboard/festivals',            tc: 'TC-M026' },
  { path: '/dashboard/training',             tc: 'TC-M027' },
  { path: '/dashboard/volunteer-opportunities', tc: 'TC-M028' },
  { path: '/dashboard/gift-send',            tc: 'TC-M029' },
  { path: '/dashboard/celebrations',         tc: 'TC-M030' },
  { path: '/dashboard/celebrations/plan',    tc: 'TC-M031' },
]

test.describe('Member Dashboard Pages — real cookie injection', () => {
  let sharedToken: string

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    const p = await ctx.newPage()
    const res = await p.request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
      data: { email: ACCOUNTS.member.email, password: ACCOUNTS.member.password },
    })
    const json = await res.json()
    sharedToken = json.access_token
    await ctx.close()
  })

  for (const { path, tc } of MEMBER_DASHBOARD_PAGES) {
    test(`${tc} — ${path} loads without login redirect`, async ({ page }) => {
      if (!sharedToken) { test.skip(); return }
      await loginAs(page, ACCOUNTS.member, path)
      expect(page.url()).not.toContain('/login')
    })
  }
})
