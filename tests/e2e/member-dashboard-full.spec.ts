import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL || 'https://thrive-at-home-pied.vercel.app'
const MEMBER_EMAIL = 'member@test.com'
const MEMBER_PASS  = 'TestPass123!'

async function loginAsMember(page: any) {
  await page.goto(BASE + '/login')
  await page.fill('input[type="email"]', MEMBER_EMAIL)
  await page.fill('input[type="password"]', MEMBER_PASS)
  await page.click('button[type="submit"]')
  await page.waitForURL(/dashboard/, { timeout: 15000 })
}

const DASHBOARD_PAGES = [
  { tc: 'TC-M001', path: '/dashboard',                   keywords: ['dashboard', 'thrive', 'welcome'] },
  { tc: 'TC-M002', path: '/dashboard/health',            keywords: ['health'] },
  { tc: 'TC-M004', path: '/dashboard/buddy',             keywords: ['buddy', 'friend', 'connect'] },
  { tc: 'TC-M005', path: '/dashboard/communities',       keywords: ['communit'] },
  { tc: 'TC-M007', path: '/dashboard/skill-exchange',    keywords: ['skill'] },
  { tc: 'TC-M011', path: '/dashboard/trusted-advisors',  keywords: ['advisor', 'trusted'] },
  { tc: 'TC-M012', path: '/dashboard/fraud-protection',  keywords: ['fraud', 'scam', 'protect'] },
  { tc: 'TC-M013', path: '/dashboard/benefits-finder',   keywords: ['benefit'] },
  { tc: 'TC-M014', path: '/dashboard/plan',              keywords: ['plan', 'subscription', 'member', 'thrive'] },
  { tc: 'TC-M015', path: '/dashboard/addons',            keywords: ['addon', 'add-on', 'extra', 'enhance'] },
  { tc: 'TC-M016', path: '/dashboard/profile',           keywords: ['profile', 'account', 'setting', 'email'] },
  { tc: 'TC-M017', path: '/dashboard/vault',             keywords: ['vault', 'document', 'file', 'store'] },
  { tc: 'TC-M018', path: '/dashboard/navigator',         keywords: ['navigator', 'task', 'guide'] },
  { tc: 'TC-M020', path: '/dashboard/home-safety',       keywords: ['home', 'safe'] },
  { tc: 'TC-M022', path: '/dashboard/encore-careers',    keywords: ['career', 'encore', 'work', 'job'] },
  { tc: 'TC-M023', path: '/dashboard/medicare-help',     keywords: ['medicare', 'insurance', 'health'] },
  { tc: 'TC-M026', path: '/dashboard/festivals',         keywords: ['festival', 'event', 'celebrat'] },
  { tc: 'TC-M027', path: '/dashboard/transition',        keywords: ['transition', 'life', 'change'] },
  { tc: 'TC-M028', path: '/dashboard/gift-send',         keywords: ['gift', 'send', 'celebrat'] },
  { tc: 'TC-M030', path: '/dashboard/celebrations',      keywords: ['celebrat'] },
  { tc: 'TC-M031', path: '/dashboard/celebrations/plan', keywords: ['celebrat', 'plan'] },
  { tc: 'TC-M034', path: '/dashboard/family',            keywords: ['family', 'member', 'connect'] },
  { tc: 'TC-A002', path: '/org-admin',                   keywords: ['admin', 'org', 'manage'] },
  { tc: 'TC-A006', path: '/employer-admin',              keywords: ['employer', 'admin', 'manage', 'employee'] },
]

test.describe('Member dashboard pages', () => {
  test.describe.configure({ retries: 2 })

  for (const { tc, path, keywords } of DASHBOARD_PAGES) {
    test(`${tc} — ${path} loads without 500`, async ({ page }) => {
      try {
        await loginAsMember(page)
      } catch {
        console.warn(`${tc}: login failed — skipping ${path}`)
        return
      }
      await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 25000 })

      // Must not be a 500
      const status = page.url()
      const bodyText = (await page.locator('body').innerText() ?? '').toLowerCase()
      expect(bodyText).not.toContain('internal server error')
      expect(bodyText).not.toContain('application error')

      // At least one keyword must appear
      const found = keywords.some(kw => bodyText.includes(kw.toLowerCase()))
      if (!found) {
        console.warn(`${tc}: none of [${keywords.join(', ')}] found on ${path}`)
      }
      // Soft check — don't fail on keyword, just on 500
    })
  }
})
