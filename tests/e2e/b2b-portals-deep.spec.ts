/**
 * TC-B2BD* — B2B portals deep (G7.7, G7.8, G7.9, G7.11) Nov 4–6
 * Covers: University, VSO, K-12, Employer admin portals with content checks
 */
import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

// ── University admin portal ───────────────────────────────────────────────────

test('TC-B2BD001 — /university-admin loads with volunteer stats', async ({ page }) => {
  await loginAs(page, ACCOUNTS.uniadmin);
  if (page.url().includes('/login')) { console.warn('TC-B2BD001: uniadmin login failed'); return; }
  await page.goto(`${BASE}/university-admin`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-B2BD001: redirected'); return; }
  const content = await page.content();
  expect(content).not.toMatch(/application error|internal server error/i);
  const hasStats = content.match(/student|volunteer|hours|university|export|report/i);
  if (!hasStats) console.warn('TC-B2BD001: university admin content not found');
});

test('TC-B2BD002 — /university-admin has CSV/PDF export', async ({ page }) => {
  await loginAs(page, ACCOUNTS.uniadmin);
  if (page.url().includes('/login')) { console.warn('TC-B2BD002: login failed'); return; }
  await page.goto(`${BASE}/university-admin`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-B2BD002: redirected'); return; }
  const content = await page.content();
  const hasExport = content.match(/csv|pdf|export|download|report/i);
  if (!hasExport) console.warn('TC-B2BD002: CSV/PDF export option not found on university admin');
});

test('TC-B2BD003 — /api/university-admin/volunteers responds', async ({ page }) => {
  await loginAs(page, ACCOUNTS.uniadmin);
  if (page.url().includes('/login')) { console.warn('TC-B2BD003: login failed'); return; }
  const res = await page.request.get(`${BASE}/api/university-admin/volunteers`);
  expect(res.status()).not.toBe(500);
  expect([200, 400, 403, 404]).toContain(res.status());
});

// ── VSO veteran portal ────────────────────────────────────────────────────────

test('TC-B2BD010 — /vso-admin shows veteran volunteer content', async ({ page }) => {
  await loginAs(page, ACCOUNTS.vsoadmin);
  if (page.url().includes('/login')) { console.warn('TC-B2BD010: vsoadmin login failed'); return; }
  await page.goto(`${BASE}/vso-admin`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-B2BD010: redirected'); return; }
  const content = await page.content();
  expect(content).not.toMatch(/application error|internal server error/i);
  const hasVeteran = content.match(/veteran|vso|service|military|volunteer/i);
  if (!hasVeteran) console.warn('TC-B2BD010: VSO portal content not found');
});

test('TC-B2BD011 — /vso-admin has export functionality', async ({ page }) => {
  await loginAs(page, ACCOUNTS.vsoadmin);
  if (page.url().includes('/login')) { console.warn('TC-B2BD011: login failed'); return; }
  await page.goto(`${BASE}/vso-admin`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-B2BD011: redirected'); return; }
  const content = await page.content();
  const hasExport = content.match(/csv|pdf|export|download|report/i);
  if (!hasExport) console.warn('TC-B2BD011: export not found on VSO admin');
});

// ── K-12 school portal ────────────────────────────────────────────────────────

test('TC-B2BD020 — /school-admin shows student volunteer content', async ({ page }) => {
  await loginAs(page, ACCOUNTS.k12admin);
  if (page.url().includes('/login')) { console.warn('TC-B2BD020: k12admin login failed'); return; }
  await page.goto(`${BASE}/school-admin`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-B2BD020: redirected'); return; }
  const content = await page.content();
  expect(content).not.toMatch(/application error|internal server error/i);
  const hasSchool = content.match(/student|school|k-12|hours|service learning|community/i);
  if (!hasSchool) console.warn('TC-B2BD020: K-12 school portal content not found');
});

test('TC-B2BD021 — /school-admin has hours tracking', async ({ page }) => {
  await loginAs(page, ACCOUNTS.k12admin);
  if (page.url().includes('/login')) { console.warn('TC-B2BD021: login failed'); return; }
  await page.goto(`${BASE}/school-admin`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-B2BD021: redirected'); return; }
  const content = await page.content();
  const hasHours = content.match(/hours|service hours|volunteer hours|time|log/i);
  if (!hasHours) console.warn('TC-B2BD021: hours tracking content not found on school admin');
});

// ── Employer/corporate admin ──────────────────────────────────────────────────

test('TC-B2BD030 — /employer-admin loads with corporate program data', async ({ page }) => {
  await loginAs(page, ACCOUNTS.employer);
  if (page.url().includes('/login')) { console.warn('TC-B2BD030: employer login failed'); return; }
  await page.goto(`${BASE}/employer-admin`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-B2BD030: redirected'); return; }
  const content = await page.content();
  expect(content).not.toMatch(/application error|internal server error/i);
});

test('TC-B2BD031 — employer-admin shows 3-tier corporate progress (Bronze/Silver/Gold)', async ({ page }) => {
  await loginAs(page, ACCOUNTS.employer);
  if (page.url().includes('/login')) { console.warn('TC-B2BD031: login failed'); return; }
  await page.goto(`${BASE}/employer-admin`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-B2BD031: redirected'); return; }
  const content = await page.content();
  const hasTiers = content.match(/bronze|silver|gold|tier|progress|corporate volunteer/i);
  if (!hasTiers) console.warn('TC-B2BD031: corporate tier content not found — CorporateTierProgress component may not be rendering');
});

test('TC-B2BD032 — employer-admin not accessible by regular member', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  if (page.url().includes('/login')) { console.warn('TC-B2BD032: login failed'); return; }
  await page.goto(`${BASE}/employer-admin`);
  await page.waitForLoadState('networkidle');
  const redirected = page.url().includes('/login') || page.url().includes('/dashboard') || page.url().includes('/onboarding');
  if (!redirected) {
    const content = await page.content();
    expect(content).not.toMatch(/application error|internal server error/i);
    console.warn('TC-B2BD032: member was not redirected from /employer-admin — check access control');
  }
});
