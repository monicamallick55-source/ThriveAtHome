/**
 * Feature Flag Enforcement Tests
 * TC-B005  — Premier plan hidden on /pricing
 * TC-REG002 — Premier remains hidden after any deploy
 * TC-REG005 — member_campaigns_live: false → no campaign button
 * TC-REG006 — marketplace_live: false → /dashboard/marketplace locked
 * TC-M080  — Complete member sees no campaign button
 * TC-M064  — member_campaigns_live feature gate
 *
 * Run: npx playwright test tests/e2e/feature-flags.spec.ts
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

/** TC-B005 / TC-REG002 — Premier plan NEVER shown */
test.describe('TC-B005/REG002 — Premier plan hidden', () => {
  test('premier not shown on /pricing (public)', async ({ page }) => {
    await page.goto('/pricing');
    // $199 price point must not appear
    await expect(page.getByText(/\$199/)).not.toBeVisible({ timeout: 8000 });
    // "Premier" label must not appear alongside a price
    const premierWithPrice = page.getByText(/premier/i).filter({ hasText: /\$199|\/mo/i });
    await expect(premierWithPrice).not.toBeVisible({ timeout: 5000 });
  });

  test('premier not shown on home /pricing section', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByText(/\$199/)).not.toBeVisible({ timeout: 5000 });
  });

  test('direct navigation to premier checkout blocked', async ({ page }) => {
    // Attempt a direct POST to /api/checkout with premier — should fail
    const resp = await page.request.post('/api/checkout', {
      data: { plan: 'premier' },
      failOnStatusCode: false,
    });
    // Should return 400 or 403 when premier_live: false
    expect([400, 403, 404, 405]).toContain(resp.status());
  });
});

/** TC-REG005 / TC-M080 / TC-M064 — Member campaigns locked */
test.describe('TC-REG005/M080 — member campaigns feature flag off', () => {
  test('complete plan member sees no campaign button', async ({ page }) => {
    await loginAs(page, ACCOUNTS.complete, '/dashboard');
    // Look for "Start a campaign" or "Start a cause campaign" button
    const campaignBtn = page.getByRole('button', { name: /start.*campaign|cause campaign/i }).or(
      page.getByRole('link', { name: /start.*campaign/i })
    );
    await expect(campaignBtn).not.toBeVisible({ timeout: 8000 });
  });

  test('basic plan member sees no campaign button', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    const campaignBtn = page.getByRole('button', { name: /start.*campaign|cause campaign/i }).or(
      page.getByRole('link', { name: /start.*campaign/i })
    );
    await expect(campaignBtn).not.toBeVisible({ timeout: 8000 });
  });
});

/** TC-REG006 / TC-M019 — Marketplace locked */
test('TC-REG006/M019 — /dashboard/marketplace is locked or coming soon', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  await page.goto('/dashboard/marketplace');

  const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  const isLocked =
    /coming soon|not yet available|marketplace.*locked|unlock|upgrade/i.test(bodyText) ||
    page.url().includes('/login') ||
    page.url().includes('/dashboard') && !page.url().includes('/marketplace');

  expect(isLocked, '/dashboard/marketplace should be locked (marketplace_live: false)').toBe(true);
});
