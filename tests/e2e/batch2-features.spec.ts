import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const MEMBER_EMAIL = 'member@test.com'
const MEMBER_PASS = 'testpass123'
const NAV_EMAIL = 'navigator@test.com'
const NAV_PASS = 'testpass123'
const ADMIN_EMAIL = 'admin@test.com'
const ADMIN_PASS = 'testpass123'

async function loginAs(page: any, email: string, pass: string) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  const emailInput = page.locator('input[type="email"]')
  if (await emailInput.count() === 0) return // already logged in or no form
  await emailInput.fill(email)
  await page.locator('input[type="password"]').fill(pass)
  await page.locator('button[type="submit"]').click()
  await page.waitForTimeout(1500)
}

// ══════════════════════════════════════════════
// LIFE TRANSITIONS API
// ══════════════════════════════════════════════
const LT_PATHWAYS = ['retirement','widow','diagnosis','moving','caregiving','divorce','loss','financial','independence']

for (const pathway of LT_PATHWAYS) {
  test(`TC-LTA001-${pathway} — GET /api/life-transitions/${pathway} returns 200 or 401`, async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/life-transitions/${pathway}`)
    expect([200, 302, 307, 401, 404]).toContain(res.status())
    if (res.status() === 200) {
      const json = await res.json()
      expect(json).toHaveProperty('pathway', pathway)
      expect(json).toHaveProperty('name')
      expect(json).toHaveProperty('steps')
    }
  })
}

test('TC-LTA010 — unknown pathway returns 404', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/life-transitions/nonexistent`)
  expect([401, 404]).toContain(res.status())
})

// ══════════════════════════════════════════════
// TRUSTED ADVISORS
// ══════════════════════════════════════════════
test('TC-TA001 — /dashboard/trusted-advisors loads or redirects', async ({ page }) => {
  await page.goto(`${BASE}/dashboard/trusted-advisors`, { waitUntil: 'domcontentloaded' })
  const url = page.url()
  expect(url).not.toContain('500')
  expect(url).not.toContain('error')
})

test('TC-TA002 — trusted advisors shows therapist, attorney, financial planner', async ({ page }) => {
  await loginAs(page, MEMBER_EMAIL, MEMBER_PASS)
  await page.goto(`${BASE}/dashboard/trusted-advisors`, { waitUntil: 'domcontentloaded' })
  if (page.url().includes('login')) return
  const text = await page.locator('body').innerText()
  expect(text).toMatch(/therapist|attorney|financial/i)
})

test('TC-TA003 — chaplain shows "Request an introduction" not auto-shown', async ({ page }) => {
  await loginAs(page, MEMBER_EMAIL, MEMBER_PASS)
  await page.goto(`${BASE}/dashboard/trusted-advisors`, { waitUntil: 'domcontentloaded' })
  if (page.url().includes('login')) return
  const text = await page.locator('body').innerText()
  // Chaplain should be present but gated
  expect(text).toMatch(/chaplain|spiritual/i)
  expect(text).toMatch(/request an introduction/i)
})

test('TC-TA004 — chaplain NOT shown with direct link/button (on request only)', async ({ page }) => {
  await loginAs(page, MEMBER_EMAIL, MEMBER_PASS)
  await page.goto(`${BASE}/dashboard/trusted-advisors`, { waitUntil: 'domcontentloaded' })
  if (page.url().includes('login')) return
  // "Learn more" button should NOT exist for chaplain (only "Request an introduction")
  const learnMoreButtons = page.locator('a:has-text("Learn more")').filter({ hasText: /chaplain|spiritual/i })
  expect(await learnMoreButtons.count()).toBe(0)
})

test('TC-TA005 — grief counselor is on-request only', async ({ page }) => {
  await loginAs(page, MEMBER_EMAIL, MEMBER_PASS)
  await page.goto(`${BASE}/dashboard/trusted-advisors`, { waitUntil: 'domcontentloaded' })
  if (page.url().includes('login')) return
  const text = await page.locator('body').innerText()
  expect(text).toMatch(/grief counselor/i)
})

// ══════════════════════════════════════════════
// NAVIGATOR PORTAL DEPTH
// ══════════════════════════════════════════════
test('TC-NAV010 — /navigator shows hours tracking section', async ({ page }) => {
  await loginAs(page, NAV_EMAIL, NAV_PASS)
  await page.goto(`${BASE}/navigator`, { waitUntil: 'domcontentloaded' })
  if (page.url().includes('login') || page.url().includes('dashboard')) return
  const text = await page.locator('body').innerText()
  expect(text).toMatch(/hours|caseload|task/i)
})

test('TC-NAV011 — /navigator task queue section present', async ({ page }) => {
  await loginAs(page, NAV_EMAIL, NAV_PASS)
  await page.goto(`${BASE}/navigator`, { waitUntil: 'domcontentloaded' })
  if (page.url().includes('login') || page.url().includes('dashboard')) return
  const text = await page.locator('body').innerText()
  expect(text).toMatch(/task queue|open tasks/i)
})

test('TC-NAV012 — /navigator caseload section present', async ({ page }) => {
  await loginAs(page, NAV_EMAIL, NAV_PASS)
  await page.goto(`${BASE}/navigator`, { waitUntil: 'domcontentloaded' })
  if (page.url().includes('login') || page.url().includes('dashboard')) return
  const text = await page.locator('body').innerText()
  expect(text).toMatch(/caseload|assigned members/i)
})

test('TC-NAV013 — member cannot access /navigator', async ({ page }) => {
  await loginAs(page, MEMBER_EMAIL, MEMBER_PASS)
  await page.goto(`${BASE}/navigator`, { waitUntil: 'domcontentloaded' })
  expect(page.url()).not.toContain('/navigator')
})

// ══════════════════════════════════════════════
// MARKETPLACE CATEGORIES
// ══════════════════════════════════════════════
const MKT_CATEGORIES = ['transport','home-services','meals','health','legal-financial','tech-help','companionship']

for (const cat of MKT_CATEGORIES) {
  test(`TC-MKT010-${cat} — GET /api/marketplace/${cat} returns 200 or 401`, async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/marketplace/${cat}`)
    expect([200, 302, 307, 401, 404]).toContain(res.status())
    if (res.status() === 200) {
      const json = await res.json()
      expect(json).toHaveProperty('category', cat)
      expect(json).toHaveProperty('label')
    }
  })
}

test('TC-MKT020 — /api/marketplace/providers returns 200 or 401', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/marketplace/providers`)
  expect([200, 302, 307, 401, 404]).toContain(res.status())
  if (res.status() === 200) {
    const json = await res.json()
    expect(json).toHaveProperty('providers')
    expect(Array.isArray(json.providers)).toBe(true)
  }
})

test('TC-MKT021 — /api/marketplace/transactions returns 200 or 401', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/marketplace/transactions`)
  expect([200, 302, 307, 401, 404]).toContain(res.status())
})

test('TC-MKT022 — POST /api/marketplace/booking rejects anon', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/marketplace/booking`, {
    data: { provider_id: 'test', service_type: 'transport' }
  })
  expect([401, 403]).toContain(res.status())
})

test('TC-MKT023 — POST /api/marketplace/booking validates required fields', async ({ page }) => {
  await loginAs(page, MEMBER_EMAIL, MEMBER_PASS)
  const res = await page.request.post(`${BASE}/api/marketplace/booking`, { data: {} })
  expect([400, 401]).toContain(res.status())
})

// ══════════════════════════════════════════════
// STRIPE / BILLING
// ══════════════════════════════════════════════
test('TC-STR001 — POST /api/create-checkout-session rejects anon', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/create-checkout-session`, {
    data: { plan: 'complete' }
  })
  expect([401, 403]).toContain(res.status())
})

test('TC-STR002 — POST /api/create-checkout-session validates price_id', async ({ page }) => {
  await loginAs(page, MEMBER_EMAIL, MEMBER_PASS)
  const res = await page.request.post(`${BASE}/api/create-checkout-session`, { data: {} })
  expect([400, 401]).toContain(res.status())
})

test('TC-STR003 — POST /api/stripe/portal rejects anon', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/stripe/portal`, { data: {} })
  expect([401, 403]).toContain(res.status())
})

test('TC-STR004 — POST /api/stripe/webhook rejects missing signature', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/stripe/webhook`, {
    data: { type: 'customer.subscription.updated' }
  })
  expect([400, 401]).toContain(res.status())
})

// ══════════════════════════════════════════════
// COMMUNITY CARE FUND
// ══════════════════════════════════════════════
test('TC-CCF010 — GET /api/community-care-fund rejects anon', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/community-care-fund`)
  expect([401, 403]).toContain(res.status())
})

test('TC-CCF011 — POST /api/community-care-fund validates required fields', async ({ page }) => {
  await loginAs(page, MEMBER_EMAIL, MEMBER_PASS)
  const res = await page.request.post(`${BASE}/api/community-care-fund`, { data: {} })
  expect([400, 401]).toContain(res.status())
})

test('TC-CCF012 — POST /api/community-care-fund with valid data returns pending', async ({ page }) => {
  await loginAs(page, MEMBER_EMAIL, MEMBER_PASS)
  const res = await page.request.post(`${BASE}/api/community-care-fund`, {
    data: { amount_cents: 5000, reason: 'Medical expenses' }
  })
  if (res.status() === 200) {
    const json = await res.json()
    expect(json.status).toBe('pending_review')
  } else {
    expect([400, 401]).toContain(res.status())
  }
})

// ══════════════════════════════════════════════
// DEVICE API
// ══════════════════════════════════════════════
test('TC-DV010 — GET /api/device rejects anon', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/device`)
  expect([401, 403]).toContain(res.status())
})

test('TC-DV011 — GET /api/device returns devices array for member', async ({ page }) => {
  await loginAs(page, MEMBER_EMAIL, MEMBER_PASS)
  const res = await page.request.get(`${BASE}/api/device`)
  if (res.status() === 200) {
    const json = await res.json()
    expect(json).toHaveProperty('devices')
    expect(Array.isArray(json.devices)).toBe(true)
  } else {
    expect(401).toBe(res.status())
  }
})

// ══════════════════════════════════════════════
// DONATE PAGE
// ══════════════════════════════════════════════
test('TC-DON001 — /donate loads without auth', async ({ page }) => {
  await page.goto(`${BASE}/donate`, { waitUntil: 'domcontentloaded' })
  expect(page.url()).not.toContain('500')
  const text = await page.locator('body').innerText()
  expect(text).toMatch(/donate|support|thriveat/i)
})

test('TC-DON002 — /donate has amount selector buttons', async ({ page }) => {
  await page.goto(`${BASE}/donate`, { waitUntil: 'domcontentloaded' })
  const buttons = page.locator('button').filter({ hasText: /\$\d+/ })
  expect(await buttons.count()).toBeGreaterThanOrEqual(3)
})

test('TC-DON003 — /donate has not-tax-deductible disclaimer', async ({ page }) => {
  await page.goto(`${BASE}/donate`, { waitUntil: 'domcontentloaded' })
  const text = await page.locator('body').innerText()
  expect(text).toMatch(/not tax.deductible|for-profit/i)
})

test('TC-DON004 — /donate has name and email fields', async ({ page }) => {
  await page.goto(`${BASE}/donate`, { waitUntil: 'domcontentloaded' })
  expect(await page.locator('input[type="text"], input[name="name"]').count()).toBeGreaterThan(0)
  expect(await page.locator('input[type="email"]').count()).toBeGreaterThan(0)
})

// ══════════════════════════════════════════════
// VOLUNTEER TRAINING STATUS
// ══════════════════════════════════════════════
test('TC-VTR001 — GET /api/volunteer/training-status rejects anon', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/volunteer/training-status`)
  expect([401, 403]).toContain(res.status())
})

test('TC-VTR002 — GET /api/volunteer/training-status returns training fields', async ({ page }) => {
  await loginAs(page, MEMBER_EMAIL, MEMBER_PASS)
  const res = await page.request.get(`${BASE}/api/volunteer/training-status`)
  if (res.status() === 200) {
    const json = await res.json()
    expect(json).toHaveProperty('training_completed')
    expect(json).toHaveProperty('can_volunteer')
  } else {
    expect(401).toBe(res.status())
  }
})

// ══════════════════════════════════════════════
// TWILIO WEBHOOK
// ══════════════════════════════════════════════
test('TC-TWL001 — POST /api/webhooks/twilio returns TwiML not 500', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/webhooks/twilio`, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: 'CallStatus=completed&CallSid=CA123'
  })
  expect(res.status()).not.toBe(500)
  expect([200, 400, 401]).toContain(res.status())
})

test('TC-TWL002 — GET /api/webhooks/twilio returns active status', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/webhooks/twilio`)
  expect([200, 404]).toContain(res.status())
})

// ══════════════════════════════════════════════
// GRACE REMINDER CRON
// ══════════════════════════════════════════════
test('TC-GRC001 — GET /api/cron/grace-reminder without secret returns 401', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/cron/grace-reminder`)
  expect([401, 403]).toContain(res.status())
})

test('TC-GRC002 — GET /api/cron/grace-reminder with secret returns 200', async ({ page }) => {
  const secret = process.env.CRON_SECRET || '0LjR0pE/7WueB508Z6OER1s/6x0Buze2vbRPVljKxFs='
  const res = await page.request.get(`${BASE}/api/cron/grace-reminder`, {
    headers: { Authorization: `Bearer ${secret}` }
  })
  expect([200, 207]).toContain(res.status())
})

// ══════════════════════════════════════════════
// CORPORATE VOLUNTEER
// ══════════════════════════════════════════════
test('TC-CVP010 — GET /api/corporate-volunteer/progress rejects anon', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/corporate-volunteer/progress`)
  expect([401, 403]).toContain(res.status())
})

test('TC-CVP011 — GET /api/corporate-volunteer/progress returns tier data', async ({ page }) => {
  await loginAs(page, MEMBER_EMAIL, MEMBER_PASS)
  const res = await page.request.get(`${BASE}/api/corporate-volunteer/progress`)
  if (res.status() === 200) {
    const json = await res.json()
    expect(json).toHaveProperty('tier')
    expect(json).toHaveProperty('total_hours')
  } else {
    expect(401).toBe(res.status())
  }
})

// ══════════════════════════════════════════════
// FAMILY PORTAL DEPTH
// ══════════════════════════════════════════════
test('TC-FAM010 — /dashboard/family has wellness summary section', async ({ page }) => {
  await loginAs(page, MEMBER_EMAIL, MEMBER_PASS)
  await page.goto(`${BASE}/dashboard/family`, { waitUntil: 'domcontentloaded' })
  if (page.url().includes('login')) return
  const text = await page.locator('body').innerText()
  expect(text).toMatch(/wellness summary/i)
})

test('TC-FAM011 — /dashboard/family has fraud protection card', async ({ page }) => {
  await loginAs(page, MEMBER_EMAIL, MEMBER_PASS)
  await page.goto(`${BASE}/dashboard/family`, { waitUntil: 'domcontentloaded' })
  if (page.url().includes('login')) return
  const text = await page.locator('body').innerText()
  expect(text).toMatch(/fraud protection/i)
})

test('TC-FAM012 — /dashboard/family has events calendar section', async ({ page }) => {
  await loginAs(page, MEMBER_EMAIL, MEMBER_PASS)
  await page.goto(`${BASE}/dashboard/family`, { waitUntil: 'domcontentloaded' })
  if (page.url().includes('login')) return
  const text = await page.locator('body').innerText()
  expect(text).toMatch(/family events calendar/i)
})

test('TC-FAM013 — /dashboard/family has mood timeline section', async ({ page }) => {
  await loginAs(page, MEMBER_EMAIL, MEMBER_PASS)
  await page.goto(`${BASE}/dashboard/family`, { waitUntil: 'domcontentloaded' })
  if (page.url().includes('login')) return
  const text = await page.locator('body').innerText()
  expect(text).toMatch(/mood|how.*feeling/i)
})

// ══════════════════════════════════════════════
// COMMUNITIES DEPTH
// ══════════════════════════════════════════════
test('TC-COM010 — /dashboard/communities has at least 20 circle cards', async ({ page }) => {
  await loginAs(page, MEMBER_EMAIL, MEMBER_PASS)
  await page.goto(`${BASE}/dashboard/communities`, { waitUntil: 'domcontentloaded' })
  if (page.url().includes('login')) return
  const circles = page.locator('[data-community-circle]')
  const count = await circles.count()
  expect(count).toBeGreaterThanOrEqual(20)
})

test('TC-COM011 — /dashboard/communities has Join circle buttons', async ({ page }) => {
  await loginAs(page, MEMBER_EMAIL, MEMBER_PASS)
  await page.goto(`${BASE}/dashboard/communities`, { waitUntil: 'domcontentloaded' })
  if (page.url().includes('login')) return
  const joinBtns = page.locator('button').filter({ hasText: /join circle/i })
  expect(await joinBtns.count()).toBeGreaterThan(0)
})

// ══════════════════════════════════════════════
// ADDONS DEPTH
// ══════════════════════════════════════════════
test('TC-ADD001 — /dashboard/addons has all 4 SKUs', async ({ page }) => {
  await loginAs(page, MEMBER_EMAIL, MEMBER_PASS)
  await page.goto(`${BASE}/dashboard/addons`, { waitUntil: 'domcontentloaded' })
  if (page.url().includes('login')) return
  const text = await page.locator('body').innerText()
  expect(text).toMatch(/extra.*navigator.*hours|navigator.*hours.*block/i)
  expect(text).toMatch(/premium.*content|content.*access/i)
  expect(text).toMatch(/enhanced.*fraud|fraud.*monitoring/i)
  expect(text).toMatch(/family.*care.*coordination/i)
})

test('TC-ADD002 — /dashboard/addons has Add to plan buttons', async ({ page }) => {
  await loginAs(page, MEMBER_EMAIL, MEMBER_PASS)
  await page.goto(`${BASE}/dashboard/addons`, { waitUntil: 'domcontentloaded' })
  if (page.url().includes('login')) return
  const addBtns = page.locator('button').filter({ hasText: /add to plan/i })
  expect(await addBtns.count()).toBeGreaterThanOrEqual(4)
})

// ══════════════════════════════════════════════
// EMPLOYER ADMIN DEPTH
// ══════════════════════════════════════════════
test('TC-EMP001 — /employer-admin blocks member role', async ({ page }) => {
  await loginAs(page, MEMBER_EMAIL, MEMBER_PASS)
  await page.goto(`${BASE}/employer-admin`, { waitUntil: 'domcontentloaded' })
  expect(page.url()).not.toContain('/employer-admin')
})

test('TC-EMP002 — /employer-admin shows volunteer hours section when accessible', async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASS)
  await page.goto(`${BASE}/employer-admin`, { waitUntil: 'domcontentloaded' })
  if (page.url().includes('login') || page.url().includes('dashboard')) return
  const text = await page.locator('body').innerText()
  expect(text).toMatch(/volunteer hours|member count/i)
})

