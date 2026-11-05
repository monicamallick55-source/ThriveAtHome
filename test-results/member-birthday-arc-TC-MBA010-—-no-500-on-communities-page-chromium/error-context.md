# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: member-birthday-arc.spec.ts >> TC-MBA010 — no 500 on communities page
- Location: tests/e2e/member-birthday-arc.spec.ts:80:5

# Error details

```
Error: TC-MBA010: 500 on https://thrive-at-home-pied.vercel.app/api/auth/resolve-landing
```

```
Error: page.waitForURL: Test ended.
=========================== logs ===========================
waiting for navigation to "**/dashboard**" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - heading "ThriveAtHome" [level=1] [ref=e5]
      - generic [ref=e6]:
        - paragraph [ref=e7]:
          - text: “Welcome back.
          - text: Margaret is waiting
          - text: to hear from you.”
        - generic [ref=e8]:
          - generic [ref=e9]:
            - generic [ref=e10]: ✓
            - text: HIPAA compliant
          - generic [ref=e11]:
            - generic [ref=e12]: ✓
            - text: No contracts
          - generic [ref=e13]:
            - generic [ref=e14]: ✓
            - text: Cancel anytime
    - generic [ref=e16]:
      - link "← Back to home" [ref=e18] [cursor=pointer]:
        - /url: /
      - heading "Sign in" [level=2] [ref=e19]
      - paragraph [ref=e20]: Enter your details below
      - generic [ref=e21]:
        - generic [ref=e22]:
          - generic [ref=e23]: Email address
          - textbox "Email address" [ref=e24]:
            - /placeholder: you@example.com
            - text: member@test.com
        - generic [ref=e25]:
          - generic [ref=e26]: Password
          - generic [ref=e27]:
            - textbox "Password" [ref=e28]:
              - /placeholder: Your password
              - text: TestPass123!
            - button "Show password" [ref=e29] [cursor=pointer]:
              - img [ref=e30]
        - button "Sign in" [ref=e33] [cursor=pointer]
      - paragraph [ref=e34]:
        - text: New to ThriveAtHome?
        - link "Create an account" [ref=e35] [cursor=pointer]:
          - /url: /signup
  - alert [ref=e36]
```

# Test source

```ts
  1  | /**
  2  |  * Shared helpers for ThriveAtHome E2E test suite
  3  |  */
  4  | import { Page, expect } from '@playwright/test';
  5  | 
  6  | export const BASE_URL = process.env.BASE_URL || 'https://thrive-at-home-pied.vercel.app';
  7  | 
  8  | /** Seed test accounts — passwords must match what's seeded in Supabase */
  9  | export const ACCOUNTS = {
  10 |   member:        { email: 'member@test.com',        password: 'TestPass123!' },
  11 |   complete:      { email: 'complete@test.com',       password: 'TestPass123!' },
  12 |   premier:       { email: 'premier@test.com',        password: 'TestPass123!' },
  13 |   family:        { email: 'family@test.com',         password: 'TestPass123!' },
  14 |   navigator:     { email: 'navigator@test.com',      password: 'TestPass123!' },
  15 |   admin:         { email: 'admin@test.com',          password: 'TestPass123!' },
  16 |   volunteer:     { email: 'volunteer@test.com',      password: 'TestPass123!' },
  17 |   student:       { email: 'student@test.com',        password: 'TestPass123!' },
  18 |   veteran:       { email: 'veteran@test.com',        password: 'TestPass123!' },
  19 |   retired_pro:   { email: 'retired_pro@test.com',   password: 'TestPass123!' },
  20 |   corporate:     { email: 'corporate@test.com',      password: 'TestPass123!' },
  21 |   neighbor:      { email: 'neighbor@test.com',       password: 'TestPass123!' },
  22 |   faith:         { email: 'faith@test.com',          password: 'TestPass123!' },
  23 |   k12student:    { email: 'k12student@test.com',     password: 'TestPass123!' },
  24 |   agency:        { email: 'agency@test.com',         password: 'TestPass123!' },
  25 |   employer:      { email: 'employer@test.com',       password: 'TestPass123!' },
  26 |   network:       { email: 'network@test.com',        password: 'TestPass123!' },
  27 |   seniorcenter:  { email: 'seniorcenter@test.com',  password: 'TestPass123!' },
  28 |   aaa:           { email: 'aaa@test.com',            password: 'TestPass123!' },
  29 |   orgadmin:      { email: 'orgadmin@test.com',       password: 'TestPass123!' },
  30 |   vsoadmin:      { email: 'vsoadmin@test.com',       password: 'TestPass123!' },
  31 |   uniadmin:      { email: 'uniadmin@test.com',       password: 'TestPass123!' },
  32 |   k12admin:      { email: 'k12admin@test.com',       password: 'TestPass123!' },
  33 |   careworker:    { email: 'careworker@test.com',     password: 'TestPass123!' },
  34 |   medicare_member: { email: 'medicare_member@test.com', password: 'TestPass123!' },
  35 |   grief_member:  { email: 'grief_member@test.com',  password: 'TestPass123!' },
  36 |   opt_out_member: { email: 'opt_out_member@test.com', password: 'TestPass123!' },
  37 |   b2b_new_org:   { email: 'b2b_new_org@test.com',   password: 'TestPass123!' },
  38 | };
  39 | 
  40 | /**
  41 |  * Login via the /login form and wait for redirect.
  42 |  * Uses the password input specifically (not the show/hide toggle button).
  43 |  */
  44 | export async function loginAs(
  45 |   page: Page,
  46 |   account: { email: string; password: string },
  47 |   expectedPath?: string,
  48 | ): Promise<void> {
  49 |   await page.goto('/login');
  50 |   // Use the email input field
  51 |   await page.locator('input[type="email"], input[name="email"], #email').first().fill(account.email);
  52 |   // Use the password input field — NOT the show/hide toggle button
  53 |   await page.locator('input[type="password"], input[name="password"], #password').first().fill(account.password);
  54 |   await page.getByRole('button', { name: /sign in|log in/i }).click();
  55 | 
  56 |   if (expectedPath) {
> 57 |     await page.waitForURL(`**${expectedPath}**`, { timeout: 15_000 });
     |                ^ Error: page.waitForURL: Test ended.
  58 |   } else {
  59 |     // Wait for navigation away from /login
  60 |     await page.waitForFunction(() => !window.location.pathname.startsWith('/login'), { timeout: 15_000 });
  61 |   }
  62 | }
  63 | 
  64 | /**
  65 |  * Assert page loads (200) and no hard console errors.
  66 |  * Returns the response status code.
  67 |  */
  68 | export async function assertPageLoads(page: Page, path: string): Promise<number> {
  69 |   const [response] = await Promise.all([
  70 |     page.waitForResponse((r) => r.url().includes(path.replace('/', '').split('/')[0]) || r.status() < 400),
  71 |     page.goto(path),
  72 |   ]);
  73 |   const status = response?.status() ?? 200;
  74 |   expect([200, 301, 302, 307, 308].includes(status) || status === 404).toBeTruthy();
  75 |   return status;
  76 | }
  77 | 
  78 | /**
  79 |  * Assert no horizontal scroll at a given viewport width.
  80 |  * TC-P071, TC-PERF002
  81 |  */
  82 | export async function assertNoHorizontalScroll(page: Page): Promise<void> {
  83 |   const hasHScroll = await page.evaluate(
  84 |     () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  85 |   );
  86 |   expect(hasHScroll, 'Page should not have horizontal scroll').toBe(false);
  87 | }
  88 | 
  89 | /** Stripe test card number */
  90 | export const STRIPE_TEST_CARD = '4242 4242 4242 4242';
  91 | 
```