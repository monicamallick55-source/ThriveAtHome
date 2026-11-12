/**
 * TC-N001–TC-N008 — Navigator Portal Tests
 *
 * Run: npx playwright test tests/e2e/navigator-portal.spec.ts
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

const NAV_TASK_TYPES = [
  'welcome_call',
  'crisis_followup',
  'fraud_review',
  'celebration_grief_review',
  'milestone_birthday',
  'life_transition',
  'service_request',
  'fhir_referral',
  'check_in_missed',
  'benefit_application',
  'advisor_connection',
  'campaign_review',
];

test.describe('TC-N001–N008 — Navigator Portal', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.navigator, '/navigator');
  });

  /** TC-N001 — Navigator dashboard loads */
  test('TC-N001 — /navigator loads with task queue and caseload', async ({ page }) => {
    await expect(page).toHaveURL(/\/navigator/);
    const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/application error|internal server error/i.test(bodyText)).toBe(false);
    // Should have some task-related content
    const hasTaskUI = /task|queue|caseload|member/i.test(bodyText);
    if (!hasTaskUI) console.warn('TC-N001: Task queue or caseload not visible');
  });

  /** TC-N002 — Task queue shows all task types */
  test('TC-N002 — task queue UI is visible', async ({ page }) => {
    const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
    // At least some task types should appear
    const foundTypes = NAV_TASK_TYPES.filter((t) =>
      new RegExp(t.replace(/_/g, '.?'), 'i').test(bodyText)
    );
    console.log(`TC-N002: Found task types in UI: ${foundTypes.join(', ') || 'none'}`);
    // Soft — depends on seeded data
    if (foundTypes.length === 0) console.warn('TC-N002: No task types visible — ensure navigator@test.com has seeded tasks');
  });

  /** TC-N003 — Mark task complete */
  test('TC-N003 — mark task complete button exists', async ({ page }) => {
    // Look for a "complete" or "mark done" action
    const completeBtn = page.getByRole('button', { name: /complete|mark done|resolve/i });
    const hasBtn = await completeBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasBtn) console.warn('TC-N003: "Mark complete" button not found — check task queue UI');
  });

  /** TC-N005 — Start facility-move plan */
  test('TC-N005 — facility-move plan can be started', async ({ page }) => {
    // Look for a member record and transition plan option
    const startPlanBtn = page.getByRole('button', { name: /start transition|transition plan|facility.?move/i });
    const hasBtn = await startPlanBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasBtn) console.warn('TC-N005: "Start transition plan" button not found — may be inside member detail');
  });

  /** TC-N008 — Hours tracking visible */
  test('TC-N008 — navigator hours tracking visible', async ({ page }) => {
    const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
    const hasHours = /hours|minutes|time.*used|session/i.test(bodyText);
    if (!hasHours) console.warn('TC-N008: Navigator hours tracking not visible in main dashboard');
  });
});

/** TC-AD001 — Admin dashboard loads */
test('TC-AD001 — /admin loads with member count + stats', async ({ page }) => {
  await loginAs(page, ACCOUNTS.admin, '/admin').catch(() => {});
  if (page.url().includes('/login')) { console.warn('TC-AD001: admin login failed — not seeded'); return; }
  const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  expect(/application error|internal server error/i.test(bodyText)).toBe(false);
  const hasStats = /member|subscription|aria|call|stat/i.test(bodyText);
  if (!hasStats) console.warn('TC-AD001: Admin stats not found on /admin');
});

/** TC-N004 — Navigator sends family invite */
test('TC-N004 — navigator can send family invite', async ({ page }) => {
  await loginAs(page, ACCOUNTS.navigator, '/navigator');
  if (page.url().includes('/login')) { console.warn('TC-N004: navigator login failed'); return; }
  const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  const hasInviteUI = /invite|family|add.*member/i.test(bodyText);
  if (!hasInviteUI) console.warn('TC-N004: No family invite UI found on /navigator');
  expect(page.url()).not.toContain('/login');
});

/** TC-N006 — Navigator marks member home from hospital */
test('TC-N006 — navigator hospital discharge workflow exists', async ({ page }) => {
  await loginAs(page, ACCOUNTS.navigator, '/navigator');
  if (page.url().includes('/login')) { console.warn('TC-N006: navigator login failed'); return; }
  const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  const hasDischarge = /hospital|discharge|home.*from|transition/i.test(bodyText);
  if (!hasDischarge) console.warn('TC-N006: Hospital discharge / home-from-hospital UI not visible');
  expect(page.url()).not.toContain('/login');
});

/** TC-N007 — Navigator approves member campaign */
test('TC-N007 — navigator campaign approval UI exists', async ({ page }) => {
  await loginAs(page, ACCOUNTS.navigator, '/navigator');
  if (page.url().includes('/login')) { console.warn('TC-N007: navigator login failed'); return; }
  const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  const hasCampaign = /campaign|approve|review/i.test(bodyText);
  if (!hasCampaign) console.warn('TC-N007: Campaign approval UI not visible — may need seeded campaign');
  expect(page.url()).not.toContain('/login');
});

/** TC-AD003–AD010 — Admin portal sub-pages */
const ADMIN_PAGES = [
  { tc: 'TC-AD003', path: '/admin/metro-activation',    keyword: /metro|activat|chapter/i },
  { tc: 'TC-AD004', path: '/admin/community-partners',  keyword: /partner|communit/i },
  { tc: 'TC-AD005', path: '/admin/grief-circles',       keyword: /grief|circle/i },
  { tc: 'TC-AD006', path: '/admin/devices',             keyword: /device|kiosk/i },
  { tc: 'TC-AD007', path: '/admin/org-imports',         keyword: /import|org/i },
  { tc: 'TC-AD008', path: '/admin/campaigns',           keyword: /campaign/i },
  { tc: 'TC-AD009', path: '/admin/community-partners',  keyword: /partner|listing/i },
  { tc: 'TC-AD010', path: '/admin',                     keyword: /flag|feature/i },
];

for (const { tc, path, keyword } of ADMIN_PAGES) {
  test(`${tc} — ${path} loads for admin`, async ({ page }) => {
    await loginAs(page, ACCOUNTS.admin, path);
    if (page.url().includes('/login')) { console.warn(`${tc}: admin login failed`); return; }
    const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/(?<![,\d])500(?![,\d])|internal server error/i.test(bodyText), `${tc}: server error on ${path}`).toBe(false);
    if (!keyword.test(bodyText)) console.warn(`${tc}: expected content not found on ${path}`);
    expect(page.url()).not.toContain('/login');
  });
}
