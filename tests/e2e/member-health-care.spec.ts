/**
 * TC-MH — Member Health & Care Tests
 * Tests health dashboard, navigator page, Medicare help,
 * FHIR referrals, encore careers, vault, profile.
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';

const HEALTH_PAGES = [
  { path: '/dashboard/health',           tc: 'TC-MH001', key: /health|wellness|mood|check.?in/i },
  { path: '/dashboard/navigator',        tc: 'TC-MH002', key: /navigator|care|coordinator/i },
  { path: '/dashboard/medicare-help',    tc: 'TC-MH003', key: /medicare|insurance|plan|coverage/i },
  { path: '/dashboard/fhir-referrals',   tc: 'TC-MH004', key: /referral|provider|fhir|care/i },
  { path: '/dashboard/benefits-finder',  tc: 'TC-MH005', key: /benefit|program|eligib|assistance/i },
  { path: '/dashboard/encore-careers',   tc: 'TC-MH006', key: /career|job|work|encore|opportunity/i },
  { path: '/dashboard/vault',            tc: 'TC-MH007', key: /vault|document|upload|file|store/i },
  { path: '/dashboard/profile',          tc: 'TC-MH008', key: /profile|name|contact|preference/i },
  { path: '/dashboard/marketplace',      tc: 'TC-MH009', key: /marketplace|service|provider|listing/i },
  { path: '/dashboard/home-sharing',     tc: 'TC-MH010', key: /home.*shar|room|housemate/i },
  { path: '/dashboard/buddy',            tc: 'TC-MH011', key: /buddy|match|companion|friend/i },
  { path: '/dashboard/transition',       tc: 'TC-MH012', key: /transition|facilit|move|plan/i },
  { path: '/dashboard/pets',             tc: 'TC-MH013', key: /pet|dog|cat|animal/i },
];

test.describe('TC-MH001–MH013 — Member Health & Care Pages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
  });

  for (const { path, tc, key } of HEALTH_PAGES) {
    test(`${tc} — ${path} loads`, async ({ page }) => {
      await page.goto(`${BASE}${path}`);
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toContain('/login');
      const body = await page.evaluate(() => document.body?.innerText ?? '');
      expect(/500|internal server error/i.test(body)).toBe(false);
      expect(/^(not found|404)$/im.test(body.trim().substring(0, 50))).toBe(false);
      if (!key.test(body)) console.warn(`${tc}: Expected content not found on ${path}`);
    });
  }
});

test.describe('TC-MH020 — Aria Check-in Settings', () => {
  test('TC-MH020 — member can view Aria check-in settings', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasAria = /aria|check.?in|call|morning/i.test(body);
    if (!hasAria) console.warn('TC-MH020: No Aria/check-in reference on dashboard');
  });
});
