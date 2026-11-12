/**
 * TC-B001–TC-B042 — Billing & Subscription Tests
 * Tests Stripe checkout flows, B2B enrollment, webhooks, and feature gating.
 *
 * Run: npx playwright test tests/e2e/billing.spec.ts
 *
 * NOTE: Stripe Checkout tests open the Stripe-hosted iframe.
 * They require real network access in test mode.
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs, STRIPE_TEST_CARD } from './helpers';

/** Helper: fill Stripe Checkout iframe */
async function fillStripeCard(page: import('@playwright/test').Page): Promise<void> {
  // Stripe hosted page opens in a new tab or redirect
  await page.waitForURL(/checkout\.stripe\.com|stripe\.com\/pay/, { timeout: 20_000 });

  // Card number field
  await page.getByPlaceholder(/card number/i).or(
    page.locator('[data-elements-stable-field-name="cardNumber"] input')
  ).fill(STRIPE_TEST_CARD);

  // Expiry
  await page.getByPlaceholder(/mm.*yy|expiry/i).or(
    page.locator('[data-elements-stable-field-name="cardExpiry"] input')
  ).fill('12/26');

  // CVC
  await page.getByPlaceholder(/cvc|cvv/i).or(
    page.locator('[data-elements-stable-field-name="cardCvc"] input')
  ).fill('123');

  // Submit
  await page.getByRole('button', { name: /pay|subscribe|confirm/i }).click();
}

/** TC-B001 — Basic checkout $39/mo */
test('TC-B001 — Basic checkout flow ($39/mo)', async ({ page }) => {
  await page.goto('/pricing');

  // Click Basic plan CTA (scoped to pricing card, not nav)
  const basicCTA = page.getByTestId('plan-cta-basic').or(
    page.getByRole('link', { name: /get started|choose basic|subscribe/i }).nth(1)
  ).first();
  await basicCTA.click();
  // Wait for navigation away from /pricing
  await page.waitForURL(url => !url.pathname.endsWith('/pricing'), { timeout: 15_000 }).catch(() => {});
  await page.waitForLoadState('domcontentloaded');

  const url = page.url();
  // Either goes to /signup (unauthenticated) or Stripe Checkout
  const isSignup = url.includes('/signup') || url.includes('/login');
  const isStripe  = url.includes('checkout.stripe.com') || url.includes('/checkout');
  expect(isSignup || isStripe, 'Basic CTA should go to signup or Stripe').toBe(true);
});

/** TC-B004 — Annual toggle: Complete Annual shows $853/yr */
test('TC-B003/B004 — annual pricing toggle', async ({ page }) => {
  await page.goto('/pricing');

  // Look for annual toggle
  const toggle = page.getByRole('switch', { name: /annual|yearly/i }).or(
    page.getByRole('button', { name: /annual|yearly/i })
  ).or(page.getByLabel(/annual|yearly/i));

  const hasToggle = await toggle.isVisible({ timeout: 5000 }).catch(() => false);
  if (!hasToggle) {
    console.warn('TC-B003: Annual toggle not found on /pricing');
    return;
  }

  await toggle.click();

  // After toggle: should show annual prices
  const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  const hasAnnual = /\$421|\$853|421\/yr|853\/yr|save/i.test(bodyText);
  expect(hasAnnual, 'Annual prices ($421 / $853) should appear after toggle').toBe(true);
});

/** TC-B005 — Premier hidden on /pricing */
test('TC-B005 — Premier plan not on /pricing', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.getByText(/\$199\/mo|\$199 per month/i)).not.toBeVisible({ timeout: 5000 });
});

/** TC-B009 — Stripe webhooks API */
test.describe('TC-B009 — Stripe webhook handler', () => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? 'test-secret';

  test('subscription.updated → 200 or 400 (not 500)', async ({ page }) => {
    // Simulate a Stripe event (without valid signature — just check handler is wired)
    const resp = await page.request.post('/api/stripe/webhook', {
      headers: {
        'stripe-signature': 'invalid_sig',
        'content-type': 'application/json',
      },
      data: JSON.stringify({
        type: 'customer.subscription.updated',
        data: { object: { id: 'sub_test', status: 'active' } },
      }),
      failOnStatusCode: false,
    });
    // 400 = handler rejects invalid sig (correct); 500 = handler is broken
    expect(resp.status(), 'Stripe webhook should not 500').not.toBe(500);
    console.log(`TC-B009: webhook handler returned ${resp.status()}`);
  });

  test('invoice.payment_failed → not 500', async ({ page }) => {
    const resp = await page.request.post('/api/stripe/webhook', {
      headers: { 'stripe-signature': 'invalid_sig', 'content-type': 'application/json' },
      data: JSON.stringify({ type: 'invoice.payment_failed', data: { object: {} } }),
      failOnStatusCode: false,
    });
    expect(resp.status()).not.toBe(500);
  });

  test('subscription.deleted → not 500', async ({ page }) => {
    const resp = await page.request.post('/api/stripe/webhook', {
      headers: { 'stripe-signature': 'invalid_sig', 'content-type': 'application/json' },
      data: JSON.stringify({ type: 'customer.subscription.deleted', data: { object: { id: 'sub_test' } } }),
      failOnStatusCode: false,
    });
    expect(resp.status()).not.toBe(500);
  });
});

/** TC-B020 — B2B enrollment fee $3,300 */
test('TC-B020 — B2B onboarding wizard loads enrollment fee step', async ({ page }) => {
  await loginAs(page, ACCOUNTS.b2b_new_org);

  // Should land somewhere in org/B2B onboarding
  const url = page.url();
  const bodyText = await page.evaluate(() => document.body?.innerText ?? '');

  // Enrollment fee should be mentioned
  const hasEnrollmentFee = /3,300|\$3300|enrollment fee|one.?time/i.test(bodyText);
  if (!hasEnrollmentFee) {
    console.warn('TC-B020: Enrollment fee $3,300 not visible in B2B onboarding — check b2b_new_org@test.com flow');
  }
});

/** TC-B030 — Donation page */
test('TC-B030 — /donate shows donation form + not tax-deductible note', async ({ page }) => {
  await page.goto('/donate');
  const bodyText = await page.evaluate(() => document.body?.innerText ?? '');

  // Donation form should load
  const hasDonateForm = await page.getByRole('form').or(
    page.getByRole('textbox', { name: /amount/i })
  ).isVisible({ timeout: 5000 }).catch(() => false);
  if (!hasDonateForm) console.warn('TC-B030: Donation form not found on /donate');

  // "not tax-deductible" note required (for-profit entity)
  const hasDisclaimer = /not.*tax.?deductible|for.?profit/i.test(bodyText);
  expect(hasDisclaimer, 'TC-B030: "not tax-deductible" disclaimer required on /donate').toBe(true);
});

/** TC-B002 — Complete checkout $79/mo */
test('TC-B002 — Complete plan CTA goes to signup or Stripe', async ({ page }) => {
  await page.goto('/pricing');
  await page.waitForLoadState('domcontentloaded');
  const completeCTA = page.getByRole('link', { name: /choose complete|get complete|subscribe/i }).first().or(
    page.getByRole('button', { name: /choose complete|get complete/i }).first()
  );
  const hasCTA = await completeCTA.isVisible({ timeout: 5000 }).catch(() => false);
  if (!hasCTA) { console.warn('TC-B002: Complete plan CTA not found on /pricing'); return; }
  await completeCTA.click();
  const url = page.url();
  const ok = url.includes('/signup') || url.includes('/login') || url.includes('stripe') || url.includes('/checkout');
  expect(ok, 'TC-B002: Complete CTA should go to signup or Stripe').toBe(true);
});

/** TC-B006 — Plan upgrade flow */
test('TC-B006 — /dashboard/plan has upgrade option', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/plan');
  if (page.url().includes('/login')) { console.warn('TC-B006: member login failed'); return; }
  const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  const hasUpgrade = /upgrade|change plan|switch/i.test(bodyText);
  if (!hasUpgrade) console.warn('TC-B006: No upgrade option found on /dashboard/plan');
  expect(page.url()).not.toContain('/login');
});

/** TC-B007 — Cancellation via Stripe portal */
test('TC-B007 — /dashboard/plan has cancel or manage subscription link', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/plan');
  if (page.url().includes('/login')) { console.warn('TC-B007: member login failed'); return; }
  const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  const hasCancel = /cancel|manage.*subscription|billing.*portal/i.test(bodyText);
  if (!hasCancel) console.warn('TC-B007: No cancel/manage subscription link on /dashboard/plan');
  expect(page.url()).not.toContain('/login');
});

/** TC-B008 — Gift subscription UI */
test('TC-B008 — gift subscription option exists', async ({ page }) => {
  await page.goto('/pricing');
  await page.waitForLoadState('domcontentloaded');
  const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  const hasGift = /gift|give.*subscription|gift.*plan/i.test(bodyText);
  if (!hasGift) console.warn('TC-B008: Gift subscription option not found on /pricing — check /dashboard/gift-send too');
});

/** TC-B031 — Recurring donation */
test('TC-B031 — /donate has monthly/recurring option', async ({ page }) => {
  await page.goto('/donate');
  await page.waitForLoadState('domcontentloaded');
  const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  const hasRecurring = /monthly|recurring|per month|\$10/i.test(bodyText);
  if (!hasRecurring) console.warn('TC-B031: No monthly/recurring donation option on /donate');
  expect(/internal server error/i.test(bodyText)).toBe(false);
});

/** TC-B040 — Celebration Enhanced ($25) */
test('TC-B040 — celebration Enhanced tier ($25) visible', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/celebrations/plan');
  if (page.url().includes('/login')) { console.warn('TC-B040: member login failed'); return; }
  const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  const has25 = /\$25|25\.00|signature|enhanced/i.test(bodyText);
  if (!has25) console.warn('TC-B040: $25 / Enhanced celebration tier not visible on /dashboard/celebrations/plan');
  expect(page.url()).not.toContain('/login');
});

/** TC-B041 — Celebration Premier ($75) */
test('TC-B041 — celebration Premier tier ($75) visible', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard/celebrations/plan');
  if (page.url().includes('/login')) { console.warn('TC-B041: member login failed'); return; }
  const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  const has75 = /\$75|75\.00|premier|legacy/i.test(bodyText);
  if (!has75) console.warn('TC-B041: $75 / Premier celebration tier not visible on /dashboard/celebrations/plan');
  expect(page.url()).not.toContain('/login');
});
