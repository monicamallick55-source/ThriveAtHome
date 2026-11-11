import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'https://thrive-at-home-pied.vercel.app'

// Pages to warm up before tests run (hits each once to avoid cold-start timeouts)
const PUBLIC_URLS = [
  '/',
  '/pricing',
  '/login',
  '/signup',
  '/donate',
  '/partners',
  '/about',
  '/for-families',
  '/for-volunteers',
  '/employers',
  '/outcomes',
]

const AUTHED_URLS = [
  '/dashboard',
  '/dashboard/plan',
  '/dashboard/health',
  '/dashboard/family',
  '/dashboard/communities',
  '/dashboard/buddy',
  '/dashboard/celebrations',
  '/dashboard/celebrations/plan',
  '/dashboard/fraud-protection',
  '/dashboard/home-safety',
  '/dashboard/benefits-finder',
  '/dashboard/trusted-advisors',
  '/dashboard/vault',
  '/dashboard/navigator',
  '/dashboard/addons',
  '/dashboard/profile',
  '/admin',
  '/admin/metro-activation',
  '/admin/community-partners',
  '/admin/grief-circles',
  '/admin/devices',
  '/admin/org-imports',
  '/admin/campaigns',
  '/navigator',
  '/employer-admin',
  '/org-admin',
  '/school-admin',
]

async function warmUp(urls: string[], label: string) {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  console.log(`\n[global-setup] Warming ${urls.length} ${label} URLs…`)
  for (const url of urls) {
    try {
      await page.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded', timeout: 15000 })
    } catch {
      // cold-start failures are expected — just warming the lambda
    }
  }
  await browser.close()
}

export default async function globalSetup() {
  await warmUp(PUBLIC_URLS, 'public')
  await warmUp(AUTHED_URLS, 'authenticated')
  console.log('[global-setup] Warmup complete\n')
}
