# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: billing.spec.ts >> TC-B001 — Basic checkout flow ($39/mo)
- Location: tests/e2e/billing.spec.ts:38:5

# Error details

```
Error: Basic CTA should go to signup or Stripe

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]: ThriveAtHome
  - generic [ref=e3]:
    - link "Thrive@Home" [ref=e4] [cursor=pointer]:
      - /url: /
      - generic [ref=e5]: Thrive@Home
    - generic [ref=e6]:
      - generic [ref=e7]:
        - generic [ref=e9]: "1"
        - generic [ref=e12]: "2"
        - generic [ref=e15]: "3"
      - generic [ref=e16]:
        - generic [ref=e17]: Choose Plan
        - generic [ref=e18]: Your Info
        - generic [ref=e19]: Payment
      - generic [ref=e20]:
        - heading "Choose your plan" [level=1] [ref=e21]
        - paragraph [ref=e22]: Start with what fits — upgrade anytime.
        - generic [ref=e23]:
          - button "Monthly" [ref=e24] [cursor=pointer]
          - button "Annual (save 10%)" [ref=e25] [cursor=pointer]
        - generic [ref=e26]:
          - button "Thrive Basics $39/mo Quinn AI concierge — 24/7 by phone Aria daily check-in calls Emergency alerts to family Family portal — 3 seats" [ref=e27] [cursor=pointer]:
            - generic [ref=e28]:
              - generic [ref=e29]:
                - generic [ref=e30]: Thrive Basics
                - generic [ref=e31]: $39/mo
              - img [ref=e33]
            - list [ref=e35]:
              - listitem [ref=e36]:
                - img [ref=e37]
                - text: Quinn AI concierge — 24/7 by phone
              - listitem [ref=e39]:
                - img [ref=e40]
                - text: Aria daily check-in calls
              - listitem [ref=e42]:
                - img [ref=e43]
                - text: Emergency alerts to family
              - listitem [ref=e45]:
                - img [ref=e46]
                - text: Family portal — 3 seats
          - button "Thrive Complete $79/mo Everything in Basics Volunteer rides & transportation Meals coordination Friendly visits & companionship" [ref=e48] [cursor=pointer]:
            - generic [ref=e50]:
              - generic [ref=e51]: Thrive Complete
              - generic [ref=e52]: $79/mo
            - list [ref=e54]:
              - listitem [ref=e55]:
                - img [ref=e56]
                - text: Everything in Basics
              - listitem [ref=e58]:
                - img [ref=e59]
                - text: Volunteer rides & transportation
              - listitem [ref=e61]:
                - img [ref=e62]
                - text: Meals coordination
              - listitem [ref=e64]:
                - img [ref=e65]
                - text: Friendly visits & companionship
        - button "Continue with Thrive Basics" [ref=e67] [cursor=pointer]:
          - text: Continue with Thrive Basics
          - img [ref=e68]
        - paragraph [ref=e70]:
          - text: Already a member?
          - link "Sign in" [ref=e71] [cursor=pointer]:
            - /url: /dashboard
      - paragraph [ref=e72]: Some Medicare Advantage plans may cover ThriveAtHome. Ask Quinn to check your plan.
```

# Test source

```ts
  1   | /**
  2   |  * TC-B001–TC-B042 — Billing & Subscription Tests
  3   |  * Tests Stripe checkout flows, B2B enrollment, webhooks, and feature gating.
  4   |  *
  5   |  * Run: npx playwright test tests/e2e/billing.spec.ts
  6   |  *
  7   |  * NOTE: Stripe Checkout tests open the Stripe-hosted iframe.
  8   |  * They require real network access in test mode.
  9   |  */
  10  | import { test, expect } from '@playwright/test';
  11  | import { ACCOUNTS, loginAs, STRIPE_TEST_CARD } from './helpers';
  12  | 
  13  | /** Helper: fill Stripe Checkout iframe */
  14  | async function fillStripeCard(page: import('@playwright/test').Page): Promise<void> {
  15  |   // Stripe hosted page opens in a new tab or redirect
  16  |   await page.waitForURL(/checkout\.stripe\.com|stripe\.com\/pay/, { timeout: 20_000 });
  17  | 
  18  |   // Card number field
  19  |   await page.getByPlaceholder(/card number/i).or(
  20  |     page.locator('[data-elements-stable-field-name="cardNumber"] input')
  21  |   ).fill(STRIPE_TEST_CARD);
  22  | 
  23  |   // Expiry
  24  |   await page.getByPlaceholder(/mm.*yy|expiry/i).or(
  25  |     page.locator('[data-elements-stable-field-name="cardExpiry"] input')
  26  |   ).fill('12/26');
  27  | 
  28  |   // CVC
  29  |   await page.getByPlaceholder(/cvc|cvv/i).or(
  30  |     page.locator('[data-elements-stable-field-name="cardCvc"] input')
  31  |   ).fill('123');
  32  | 
  33  |   // Submit
  34  |   await page.getByRole('button', { name: /pay|subscribe|confirm/i }).click();
  35  | }
  36  | 
  37  | /** TC-B001 — Basic checkout $39/mo */
  38  | test('TC-B001 — Basic checkout flow ($39/mo)', async ({ page }) => {
  39  |   await page.goto('/pricing');
  40  | 
  41  |   // Click Basic plan CTA
  42  |   const basicCTA = page.getByRole('link', { name: /get started|choose basic|subscribe/i }).first().or(
  43  |     page.getByRole('button', { name: /get started|choose basic/i }).first()
  44  |   );
  45  |   await basicCTA.click();
  46  | 
  47  |   const url = page.url();
  48  |   // Either goes to /signup (unauthenticated) or Stripe Checkout
  49  |   const isSignup = url.includes('/signup') || url.includes('/login');
  50  |   const isStripe  = url.includes('checkout.stripe.com') || url.includes('/checkout');
> 51  |   expect(isSignup || isStripe, 'Basic CTA should go to signup or Stripe').toBe(true);
      |                                                                           ^ Error: Basic CTA should go to signup or Stripe
  52  | });
  53  | 
  54  | /** TC-B004 — Annual toggle: Complete Annual shows $853/yr */
  55  | test('TC-B003/B004 — annual pricing toggle', async ({ page }) => {
  56  |   await page.goto('/pricing');
  57  | 
  58  |   // Look for annual toggle
  59  |   const toggle = page.getByRole('switch', { name: /annual|yearly/i }).or(
  60  |     page.getByRole('button', { name: /annual|yearly/i })
  61  |   ).or(page.getByLabel(/annual|yearly/i));
  62  | 
  63  |   const hasToggle = await toggle.isVisible({ timeout: 5000 }).catch(() => false);
  64  |   if (!hasToggle) {
  65  |     console.warn('TC-B003: Annual toggle not found on /pricing');
  66  |     return;
  67  |   }
  68  | 
  69  |   await toggle.click();
  70  | 
  71  |   // After toggle: should show annual prices
  72  |   const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  73  |   const hasAnnual = /\$421|\$853|421\/yr|853\/yr|save/i.test(bodyText);
  74  |   expect(hasAnnual, 'Annual prices ($421 / $853) should appear after toggle').toBe(true);
  75  | });
  76  | 
  77  | /** TC-B005 — Premier hidden on /pricing */
  78  | test('TC-B005 — Premier plan not on /pricing', async ({ page }) => {
  79  |   await page.goto('/pricing');
  80  |   await expect(page.getByText(/\$199\/mo|\$199 per month/i)).not.toBeVisible({ timeout: 5000 });
  81  | });
  82  | 
  83  | /** TC-B009 — Stripe webhooks API */
  84  | test.describe('TC-B009 — Stripe webhook handler', () => {
  85  |   const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? 'test-secret';
  86  | 
  87  |   test('subscription.updated → 200 or 400 (not 500)', async ({ page }) => {
  88  |     // Simulate a Stripe event (without valid signature — just check handler is wired)
  89  |     const resp = await page.request.post('/api/stripe/webhook', {
  90  |       headers: {
  91  |         'stripe-signature': 'invalid_sig',
  92  |         'content-type': 'application/json',
  93  |       },
  94  |       data: JSON.stringify({
  95  |         type: 'customer.subscription.updated',
  96  |         data: { object: { id: 'sub_test', status: 'active' } },
  97  |       }),
  98  |       failOnStatusCode: false,
  99  |     });
  100 |     // 400 = handler rejects invalid sig (correct); 500 = handler is broken
  101 |     expect(resp.status(), 'Stripe webhook should not 500').not.toBe(500);
  102 |     console.log(`TC-B009: webhook handler returned ${resp.status()}`);
  103 |   });
  104 | 
  105 |   test('invoice.payment_failed → not 500', async ({ page }) => {
  106 |     const resp = await page.request.post('/api/stripe/webhook', {
  107 |       headers: { 'stripe-signature': 'invalid_sig', 'content-type': 'application/json' },
  108 |       data: JSON.stringify({ type: 'invoice.payment_failed', data: { object: {} } }),
  109 |       failOnStatusCode: false,
  110 |     });
  111 |     expect(resp.status()).not.toBe(500);
  112 |   });
  113 | 
  114 |   test('subscription.deleted → not 500', async ({ page }) => {
  115 |     const resp = await page.request.post('/api/stripe/webhook', {
  116 |       headers: { 'stripe-signature': 'invalid_sig', 'content-type': 'application/json' },
  117 |       data: JSON.stringify({ type: 'customer.subscription.deleted', data: { object: { id: 'sub_test' } } }),
  118 |       failOnStatusCode: false,
  119 |     });
  120 |     expect(resp.status()).not.toBe(500);
  121 |   });
  122 | });
  123 | 
  124 | /** TC-B020 — B2B enrollment fee $3,300 */
  125 | test('TC-B020 — B2B onboarding wizard loads enrollment fee step', async ({ page }) => {
  126 |   await loginAs(page, ACCOUNTS.b2b_new_org);
  127 | 
  128 |   // Should land somewhere in org/B2B onboarding
  129 |   const url = page.url();
  130 |   const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  131 | 
  132 |   // Enrollment fee should be mentioned
  133 |   const hasEnrollmentFee = /3,300|\$3300|enrollment fee|one.?time/i.test(bodyText);
  134 |   if (!hasEnrollmentFee) {
  135 |     console.warn('TC-B020: Enrollment fee $3,300 not visible in B2B onboarding — check b2b_new_org@test.com flow');
  136 |   }
  137 | });
  138 | 
  139 | /** TC-B030 — Donation page */
  140 | test('TC-B030 — /donate shows donation form + not tax-deductible note', async ({ page }) => {
  141 |   await page.goto('/donate');
  142 |   const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  143 | 
  144 |   // Donation form should load
  145 |   const hasDonateForm = await page.getByRole('form').or(
  146 |     page.getByRole('textbox', { name: /amount/i })
  147 |   ).isVisible({ timeout: 5000 }).catch(() => false);
  148 |   if (!hasDonateForm) console.warn('TC-B030: Donation form not found on /donate');
  149 | 
  150 |   // "not tax-deductible" note required (for-profit entity)
  151 |   const hasDisclaimer = /not.*tax.?deductible|for.?profit/i.test(bodyText);
```