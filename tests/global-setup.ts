import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'https://thrive-at-home-pied.vercel.app'

const PUBLIC_URLS = [
  '/', '/pricing', '/login', '/signup', '/donate', '/partners', '/about',
  '/for-families', '/for-volunteers', '/employers', '/outcomes',
  '/api/life-transitions/retirement', '/api/life-transitions/widow',
  '/api/life-transitions/diagnosis', '/api/life-transitions/caregiving',
  '/api/life-transitions/financial', '/api/life-transitions/moving',
  '/api/life-transitions/divorce', '/api/life-transitions/loss',
  '/api/life-transitions/independence',
]

const AUTHED_PAGES = [
  '/dashboard', '/dashboard/plan', '/dashboard/health', '/dashboard/family',
  '/dashboard/communities', '/dashboard/buddy', '/dashboard/celebrations',
  '/dashboard/celebrations/plan', '/dashboard/fraud-protection',
  '/dashboard/home-safety', '/dashboard/benefits-finder',
  '/dashboard/trusted-advisors', '/dashboard/vault', '/dashboard/navigator',
  '/dashboard/addons', '/dashboard/profile',
]

const ADMIN_PAGES = [
  '/admin', '/admin/metro-activation', '/admin/community-partners',
  '/admin/grief-circles', '/admin/devices', '/admin/org-imports', '/admin/campaigns',
]

const B2B_PAGES = [
  '/navigator', '/employer-admin', '/org-admin', '/school-admin',
  '/senior-center-admin', '/aaa-admin', '/network-admin', '/agency-admin',
  '/university-admin', '/vso-admin',
]

async function loginAndWarm(email: string, password: string, pages: string[]) {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.fill('input[type="email"], input[name="email"]', email)
    await page.fill('input[type="password"], input[name="password"]', password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/dashboard|admin|org|employer|navigator/, { timeout: 20000 })
    for (const path of pages) {
      try {
        await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 10000 })
      } catch { /* warming only */ }
    }
  } catch { /* login may fail on cold start — that's ok */ }
  await browser.close()
}

export default async function globalSetup() {
  // Warm public URLs first (no auth needed)
  const browser = await chromium.launch()
  const page = await browser.newPage()
  console.log(`\n[global-setup] Warming ${PUBLIC_URLS.length} public URLs…`)
  for (const url of PUBLIC_URLS) {
    try {
      await page.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded', timeout: 15000 })
    } catch { /* cold start */ }
  }
  await browser.close()

  // Warm authenticated pages with real logins
  console.log('[global-setup] Warming authenticated pages…')
  await loginAndWarm('member@test.com', 'TestPass123!', AUTHED_PAGES)
  await loginAndWarm('admin@test.com', 'TestPass123!', ADMIN_PAGES)
  await loginAndWarm('employer@test.com', 'TestPass123!', B2B_PAGES)

  console.log('[global-setup] Warmup complete\n')
}
