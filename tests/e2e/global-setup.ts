/**
 * Playwright globalSetup — warm up all Vercel serverless functions
 * before the test suite runs to avoid cold-start timeouts.
 * Runs once before all tests.
 */

import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:3000'

const WARMUP_URLS = [
  // Public pages
  '/',
  '/pricing',
  '/login',
  '/about',
  '/for-families',
  '/for-volunteers',
  '/employers',
  '/donate',
  '/privacy',
  '/terms',

  // Auth-gated pages (will redirect to /login — that's fine, just warms the function)
  '/dashboard',
  '/dashboard/health',
  '/dashboard/buddy',
  '/dashboard/communities',
  '/dashboard/skill-exchange',
  '/dashboard/trusted-advisors',
  '/dashboard/fraud-protection',
  '/dashboard/benefits-finder',
  '/dashboard/plan',
  '/dashboard/profile',
  '/dashboard/vault',
  '/dashboard/navigator',
  '/dashboard/home-safety',
  '/dashboard/encore-careers',
  '/dashboard/medicare-help',
  '/dashboard/festivals',
  '/dashboard/transition',
  '/dashboard/gift-send',
  '/dashboard/celebrations',
  '/dashboard/celebrations/plan',
  '/dashboard/addons',
  '/dashboard/family',

  // B2B portals
  '/org-admin',
  '/employer-admin',
  '/employer-admin/invite/warmup',
  '/employers',
  '/senior-center-admin',
  '/aaa-admin',
  '/network-admin',
  '/agency-admin',

  // Volunteer portals
  '/university-admin',
  '/vso-admin',
  '/school-admin',

  // Admin sub-pages
  '/admin',
  '/admin/metro-activation',
  '/admin/community-partners',
  '/admin/grief-circles',
  '/admin/devices',
  '/admin/org-imports',
  '/admin/campaigns',

  // Other
  '/navigator',
  '/onboarding',
  '/device',
  '/invite/warmup',
]

// API endpoints to warm up
const WARMUP_APIS = [
  '/api/life-transitions/retirement',
  '/api/life-transitions/widow',
  '/api/life-transitions/diagnosis',
  '/api/achievements',
  '/api/family/invite',
  '/api/volunteer/training-status',
  '/api/check-in-calls',
  '/api/crisis-alert',
  '/api/fraud-scan',
]

async function warmup() {
  console.log(`\n🔥 Warming up ${WARMUP_URLS.length} pages + ${WARMUP_APIS.length} APIs at ${BASE}...\n`)

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  // Warm pages in batches of 5
  for (let i = 0; i < WARMUP_URLS.length; i += 5) {
    const batch = WARMUP_URLS.slice(i, i + 5)
    await Promise.allSettled(
      batch.map(path =>
        page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 })
          .catch(() => {}) // redirects and 401s are fine
      )
    )
    process.stdout.write(`  warmed ${Math.min(i + 5, WARMUP_URLS.length)}/${WARMUP_URLS.length} pages\r`)
  }

  // Warm APIs
  for (const api of WARMUP_APIS) {
    await fetch(BASE + api).catch(() => {})
  }

  await browser.close()
  console.log(`\n✅ Warmup complete — all functions are hot\n`)
}

export default warmup
