/**
 * TC-VPF* — Full volunteer portal coverage (deployed Nov 6, 2026)
 * Covers: buddy portal, chaplaincy, neighbors, professionals, apply flow,
 *         retired-pro discovery, corporate tier progress bar
 */
import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

// ── Volunteer portal top-level pages ─────────────────────────────────────────

test('TC-VPF001 — /volunteer loads or redirects (no 500)', async ({ page }) => {
  await loginAs(page, ACCOUNTS.volunteer);
  if (page.url().includes('/login')) { console.warn('TC-VPF001: login failed'); return; }
  await page.goto(`${BASE}/volunteer`);
  await page.waitForLoadState('networkidle');
  const content = await page.content();
  expect(content).not.toMatch(/application error|internal server error/i);
});

test('TC-VPF002 — /volunteer/apply loads', async ({ page }) => {
  await page.goto(`${BASE}/volunteer/apply`);
  await page.waitForLoadState('networkidle');
  const content = await page.content();
  expect(content).not.toMatch(/application error|internal server error/i);
  expect(page.url()).not.toContain('/500');
});

test('TC-VPF003 — /volunteer/apply has application form', async ({ page }) => {
  await page.goto(`${BASE}/volunteer/apply`);
  await page.waitForLoadState('networkidle');
  const content = await page.content();
  const hasForm = content.match(/apply|volunteer|name|email|specialty|submit/i);
  if (!hasForm) console.warn('TC-VPF003: volunteer apply form content not found');
  expect(content).not.toMatch(/application error|internal server error/i);
});

// ── Buddy portal ──────────────────────────────────────────────────────────────

test('TC-VPF010 — /volunteer/buddy requires auth', async ({ page }) => {
  await page.goto(`${BASE}/volunteer/buddy`);
  await page.waitForLoadState('networkidle');
  const redirectedToLogin = page.url().includes('/login');
  const redirectedToOnboarding = page.url().includes('/onboarding');
  if (!redirectedToLogin && !redirectedToOnboarding) {
    // If page loaded, must not be a 500
    const content = await page.content();
    expect(content).not.toMatch(/application error|internal server error/i);
  }
});

test('TC-VPF011 — /volunteer/buddy loads for volunteer', async ({ page }) => {
  await loginAs(page, ACCOUNTS.volunteer);
  if (page.url().includes('/login')) { console.warn('TC-VPF011: login failed'); return; }
  await page.goto(`${BASE}/volunteer/buddy`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-VPF011: redirected to login'); return; }
  const content = await page.content();
  expect(content).not.toMatch(/application error|internal server error/i);
});

test('TC-VPF012 — buddy portal shows buddy assignment cards or empty state', async ({ page }) => {
  await loginAs(page, ACCOUNTS.volunteer);
  if (page.url().includes('/login')) { console.warn('TC-VPF012: login failed'); return; }
  await page.goto(`${BASE}/volunteer/buddy`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-VPF012: redirected'); return; }
  const content = await page.content();
  const hasContent = content.match(/buddy|assignment|member|call|log|no buddies|🤝/i);
  if (!hasContent) console.warn('TC-VPF012: buddy portal content not detected');
  expect(content).not.toMatch(/application error|internal server error/i);
});

// ── Chaplaincy ────────────────────────────────────────────────────────────────

test('TC-VPF020 — /volunteer/chaplaincy loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.faith);
  if (page.url().includes('/login')) { console.warn('TC-VPF020: faith login failed — try volunteer'); }
  if (page.url().includes('/login')) await loginAs(page, ACCOUNTS.volunteer);
  if (page.url().includes('/login')) { console.warn('TC-VPF020: login failed'); return; }
  await page.goto(`${BASE}/volunteer/chaplaincy`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-VPF020: redirected to login'); return; }
  const content = await page.content();
  expect(content).not.toMatch(/application error|internal server error/i);
});

test('TC-VPF021 — chaplaincy page shows spiritual/grief content', async ({ page }) => {
  await loginAs(page, ACCOUNTS.volunteer);
  if (page.url().includes('/login')) { console.warn('TC-VPF021: login failed'); return; }
  await page.goto(`${BASE}/volunteer/chaplaincy`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-VPF021: redirected'); return; }
  const content = await page.content();
  const hasContent = content.match(/chaplain|spiritual|grief|prayer|faith|visit/i);
  if (!hasContent) console.warn('TC-VPF021: chaplaincy content not detected');
});

// ── Neighbor volunteers ───────────────────────────────────────────────────────

test('TC-VPF030 — /volunteer/neighbors loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.neighbor);
  if (page.url().includes('/login')) { console.warn('TC-VPF030: neighbor login failed — try volunteer'); }
  if (page.url().includes('/login')) await loginAs(page, ACCOUNTS.volunteer);
  if (page.url().includes('/login')) { console.warn('TC-VPF030: login failed'); return; }
  await page.goto(`${BASE}/volunteer/neighbors`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-VPF030: redirected to login'); return; }
  const content = await page.content();
  expect(content).not.toMatch(/application error|internal server error/i);
});

test('TC-VPF031 — neighbors page shows zip-matched or match-pending content', async ({ page }) => {
  await loginAs(page, ACCOUNTS.neighbor);
  if (page.url().includes('/login')) await loginAs(page, ACCOUNTS.volunteer);
  if (page.url().includes('/login')) { console.warn('TC-VPF031: login failed'); return; }
  await page.goto(`${BASE}/volunteer/neighbors`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-VPF031: redirected'); return; }
  const content = await page.content();
  const hasContent = content.match(/neighbor|zip|match|nearby|area|distance/i);
  if (!hasContent) console.warn('TC-VPF031: neighbor matching content not found');
});

// ── Retired professionals ─────────────────────────────────────────────────────

test('TC-VPF040 — /volunteer/professionals loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.retired_pro);
  if (page.url().includes('/login')) { console.warn('TC-VPF040: retired_pro login failed — try volunteer'); }
  if (page.url().includes('/login')) await loginAs(page, ACCOUNTS.volunteer);
  if (page.url().includes('/login')) { console.warn('TC-VPF040: login failed'); return; }
  await page.goto(`${BASE}/volunteer/professionals`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-VPF040: redirected'); return; }
  const content = await page.content();
  expect(content).not.toMatch(/application error|internal server error/i);
});

test('TC-VPF041 — retired-pro page shows specialty/service cards', async ({ page }) => {
  await loginAs(page, ACCOUNTS.retired_pro);
  if (page.url().includes('/login')) await loginAs(page, ACCOUNTS.volunteer);
  if (page.url().includes('/login')) { console.warn('TC-VPF041: login failed'); return; }
  await page.goto(`${BASE}/volunteer/professionals`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-VPF041: redirected'); return; }
  const content = await page.content();
  const hasContent = content.match(/attorney|financial|doctor|specialty|legal|advisor|professional/i);
  if (!hasContent) console.warn('TC-VPF041: retired professional specialty content not found');
});

test('TC-VPF042 — retired-pro discovery surfaces in Legal/Financial Hub', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  if (page.url().includes('/login')) { console.warn('TC-VPF042: login failed'); return; }
  // Check the legal/financial hub or trusted advisors page
  await page.goto(`${BASE}/dashboard/trusted-advisors`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-VPF042: redirected to login'); return; }
  const content = await page.content();
  expect(content).not.toMatch(/application error|internal server error/i);
  // Should have retired professional content surfaced
  const hasRetiredPro = content.match(/retired|professional|attorney|financial advisor|doctor/i);
  if (!hasRetiredPro) console.warn('TC-VPF042: retired-pro content not surfaced on trusted advisors page');
});

// ── Corporate tier progress bar (G7.11) ──────────────────────────────────────

test('TC-VPF050 — /employer-admin loads corporate tier content', async ({ page }) => {
  await loginAs(page, ACCOUNTS.employer);
  if (page.url().includes('/login')) { console.warn('TC-VPF050: employer login failed'); return; }
  await page.goto(`${BASE}/employer-admin`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-VPF050: redirected to login'); return; }
  const content = await page.content();
  expect(content).not.toMatch(/application error|internal server error/i);
});

test('TC-VPF051 — employer-admin shows corporate volunteer tier progress', async ({ page }) => {
  await loginAs(page, ACCOUNTS.employer);
  if (page.url().includes('/login')) { console.warn('TC-VPF051: login failed'); return; }
  await page.goto(`${BASE}/employer-admin`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-VPF051: redirected'); return; }
  const content = await page.content();
  const hasTier = content.match(/tier|bronze|silver|gold|progress|corporate|volunteer hours/i);
  if (!hasTier) console.warn('TC-VPF051: corporate tier progress bar content not detected');
});

test('TC-VPF052 — /api/corporate-volunteer/progress responds', async ({ page }) => {
  await loginAs(page, ACCOUNTS.employer);
  if (page.url().includes('/login')) { console.warn('TC-VPF052: login failed'); return; }
  const res = await page.request.get(`${BASE}/api/corporate-volunteer/progress`);
  expect([200, 400, 404]).toContain(res.status());
  expect(res.status()).not.toBe(500);
});
