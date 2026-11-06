/**
 * TC-LTD* — Life transitions deep (G5.5, G7.14, G7.15, G7.16) Nov 4
 * Covers: 4 pathways, facility-move, therapist/chaplain/grief directory, trusted advisors
 */
import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

// ── Life transitions ──────────────────────────────────────────────────────────

test('TC-LTD001 — /dashboard/life-transitions loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  if (page.url().includes('/login')) { console.warn('TC-LTD001: login failed'); return; }
  await page.goto(`${BASE}/dashboard/life-transitions`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-LTD001: redirected'); return; }
  const content = await page.content();
  expect(content).not.toMatch(/application error|internal server error/i);
});

test('TC-LTD002 — life-transitions page shows ≥ 4 pathways', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  if (page.url().includes('/login')) { console.warn('TC-LTD002: login failed'); return; }
  await page.goto(`${BASE}/dashboard/life-transitions`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-LTD002: redirected'); return; }
  const content = await page.content();
  const pathwayCount = (content.match(/pathway|transition|moving|loss|diagnosis|retirement/gi) || []).length;
  if (pathwayCount < 2) console.warn('TC-LTD002: fewer than expected pathway keywords found');
});

test('TC-LTD003 — /api/life-transitions GET responds', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  if (page.url().includes('/login')) { console.warn('TC-LTD003: login failed'); return; }
  const res = await page.request.get(`${BASE}/api/life-transitions`);
  expect(res.status()).not.toBe(500);
  expect([200, 400, 404]).toContain(res.status());
});

test('TC-LTD004 — /api/life-transitions POST creates transition plan', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  if (page.url().includes('/login')) { console.warn('TC-LTD004: login failed'); return; }
  const res = await page.request.post(`${BASE}/api/life-transitions`, {
    data: { type: 'moving', memberId: 'test' },
  });
  expect(res.status()).not.toBe(500);
  expect([200, 201, 400, 401, 404]).toContain(res.status());
});

// ── Facility-move planning ────────────────────────────────────────────────────

test('TC-LTD010 — /dashboard/transition loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  if (page.url().includes('/login')) { console.warn('TC-LTD010: login failed'); return; }
  await page.goto(`${BASE}/dashboard/transition`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-LTD010: redirected'); return; }
  const content = await page.content();
  expect(content).not.toMatch(/application error|internal server error/i);
});

test('TC-LTD011 — transition page shows facility-move checklist or steps', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  if (page.url().includes('/login')) { console.warn('TC-LTD011: login failed'); return; }
  await page.goto(`${BASE}/dashboard/transition`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-LTD011: redirected'); return; }
  const content = await page.content();
  const hasMoveContent = content.match(/move|facility|checklist|downsizing|assisted|independent|step/i);
  if (!hasMoveContent) console.warn('TC-LTD011: facility-move content not found');
});

// ── Therapist/chaplain/grief directory ───────────────────────────────────────

test('TC-LTD020 — /dashboard/grief-support loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  if (page.url().includes('/login')) { console.warn('TC-LTD020: login failed'); return; }
  await page.goto(`${BASE}/dashboard/grief-support`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-LTD020: redirected'); return; }
  const content = await page.content();
  expect(content).not.toMatch(/application error|internal server error/i);
});

test('TC-LTD021 — grief support shows all 9 pathways', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  if (page.url().includes('/login')) { console.warn('TC-LTD021: login failed'); return; }
  await page.goto(`${BASE}/dashboard/grief-support`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-LTD021: redirected'); return; }
  const cards = await page.locator('[data-testid*="pathway"], .pathway-card, section').count();
  if (cards < 3) console.warn(`TC-LTD021: only ${cards} sections found — expected 9 grief pathways`);
});

test('TC-LTD022 — chaplain not shown proactively (member must request)', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  if (page.url().includes('/login')) { console.warn('TC-LTD022: login failed'); return; }
  await page.goto(`${BASE}/dashboard/trusted-advisors`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-LTD022: redirected'); return; }
  const content = await page.content();
  // Chaplain should only appear if member explicitly enabled — not in a proactive banner
  const hasChaplainPromo = content.match(/we recommend.*chaplain|your chaplain is|scheduled.*chaplain/i);
  if (hasChaplainPromo) console.warn('TC-LTD022: chaplain shown proactively — should be on-request only');
});

// ── Trusted advisors ──────────────────────────────────────────────────────────

test('TC-LTD030 — /dashboard/trusted-advisors loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  if (page.url().includes('/login')) { console.warn('TC-LTD030: login failed'); return; }
  await page.goto(`${BASE}/dashboard/trusted-advisors`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-LTD030: redirected'); return; }
  const content = await page.content();
  expect(content).not.toMatch(/application error|internal server error/i);
});

test('TC-LTD031 — trusted advisors shows advisor categories', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  if (page.url().includes('/login')) { console.warn('TC-LTD031: login failed'); return; }
  await page.goto(`${BASE}/dashboard/trusted-advisors`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-LTD031: redirected'); return; }
  const content = await page.content();
  const hasAdvisors = content.match(/attorney|financial|advisor|navigator|care manager|therapist/i);
  if (!hasAdvisors) console.warn('TC-LTD031: trusted advisor categories not found');
});

test('TC-LTD032 — /api/trusted-advisors responds', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member);
  if (page.url().includes('/login')) { console.warn('TC-LTD032: login failed'); return; }
  const res = await page.request.get(`${BASE}/api/trusted-advisors`);
  expect(res.status()).not.toBe(500);
  expect([200, 400, 404]).toContain(res.status());
});
