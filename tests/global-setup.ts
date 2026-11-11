import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'https://thrive-at-home-pied.vercel.app'

const ALL_URLS = [
  '/', '/pricing', '/login', '/signup', '/donate', '/partners', '/about',
  '/for-families', '/for-volunteers', '/employers', '/outcomes',
  '/dashboard', '/dashboard/plan', '/dashboard/health', '/dashboard/family',
  '/dashboard/communities', '/dashboard/buddy', '/dashboard/celebrations',
  '/dashboard/celebrations/plan', '/dashboard/fraud-protection',
  '/dashboard/home-safety', '/dashboard/benefits-finder',
  '/dashboard/trusted-advisors', '/dashboard/vault', '/dashboard/navigator',
  '/dashboard/addons', '/dashboard/profile', '/dashboard/marketplace',
  '/dashboard/encore-careers', '/dashboard/festivals', '/dashboard/gift-send',
  '/dashboard/grief-support', '/dashboard/life-transitions', '/dashboard/transition',
  '/admin', '/admin/metro-activation', '/admin/community-partners',
  '/admin/grief-circles', '/admin/devices', '/admin/org-imports',
  '/admin/campaigns',
  '/navigator', '/employer-admin', '/org-admin', '/school-admin',
  '/senior-center-admin', '/aaa-admin', '/network-admin', '/agency-admin',
  '/university-admin', '/vso-admin',
  '/api/life-transitions/retirement', '/api/life-transitions/widow',
  '/api/life-transitions/diagnosis', '/api/life-transitions/caregiving',
  '/api/life-transitions/financial', '/api/life-transitions/moving',
  '/api/life-transitions/divorce', '/api/life-transitions/loss',
  '/api/life-transitions/independence',
]

export default async function globalSetup() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  console.log(`\n[global-setup] Warming ${ALL_URLS.length} URLs…`)
  for (const url of ALL_URLS) {
    try {
      await page.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded', timeout: 15000 })
    } catch {
      // expected — just warming the lambda
    }
  }
  await browser.close()
  console.log('[global-setup] Warmup complete\n')
}
