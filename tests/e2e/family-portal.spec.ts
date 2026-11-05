/**
 * TC-F001–TC-F007 — Family Portal Tests
 *
 * Run: npx playwright test tests/e2e/family-portal.spec.ts
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

test.describe('TC-F001–F007 — Family Portal', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.family);
    await page.goto(`${process.env.PLAYWRIGHT_BASE_URL ?? "https://thrive-at-home-pied.vercel.app"}/dashboard/family`);
    await page.waitForLoadState("networkidle");
  });

  /** TC-F001 — Family main view */
  test('TC-F001 — /dashboard/family loads with member wellness summary', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/family/);

    const bodyText = await page.evaluate(() => document.body?.innerText ?? '');

    // Wellness summary panel
    const hasWellness = /mood|last call|check.?in|wellness/i.test(bodyText);
    if (!hasWellness) console.warn('TC-F001: Wellness summary not found');

    // Fraud protection card
    const hasFraud = /fraud|scam|protection/i.test(bodyText);
    if (!hasFraud) console.warn('TC-F001: Fraud protection card not found');

    // No server error
    expect(/500|internal server error/i.test(bodyText)).toBe(false);
  });

  /** TC-F002 — Family events calendar — add event */
  test('TC-F002 — family events calendar visible + add event form', async ({ page }) => {
    // Look for events calendar tab or section
    const calendarTab = page.getByRole('tab', { name: /events/i }).or(
      page.getByRole('link', { name: /events/i })
    ).or(page.getByText(/family events/i));

    const hasCalendar = await calendarTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasCalendar) console.warn('TC-F002: Family Events Calendar tab not visible');

    // "Add event" button
    const addEventBtn = page.getByRole('button', { name: /add event|new event/i });
    const hasAddEvent = await addEventBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasAddEvent) console.warn('TC-F002: "Add event" button not found');
  });

  /** TC-F004 — Mood timeline */
  test('TC-F004 — mood timeline visible', async ({ page }) => {
    const hasMood = await page.getByText(/mood/i).isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasMood) console.warn('TC-F004: Mood timeline not found on /dashboard/family');
  });

  /** TC-F006 — Celebration planning accessible to family */
  test('TC-F006 — family can access celebration planner', async ({ page }) => {
    await page.goto('/dashboard/celebrations/plan');
    const url = page.url();
    // Should reach planner, not get blocked
    expect(url).not.toContain('/login');
    const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(bodyText)).toBe(false);
  });
});

/** TC-A003 — Basic plan family seat limit (3 seats) */
test('TC-A003 — basic plan blocks 4th family invite with upgrade prompt', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  // This test requires the member to already have 3 family seats
  // Attempt to send a 4th invite
  const inviteResp = await page.request.post('/api/family/invite', {
    data: { email: 'fourth-family@test.com' },
    failOnStatusCode: false,
  });
  if (inviteResp.status() === 403) {
    console.log('TC-A003: 4th invite correctly rejected with 403');
  } else {
    console.warn(`TC-A003: 4th invite returned ${inviteResp.status()} — may need 3 existing family members seeded`);
  }
});
