# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigator-portal.spec.ts >> TC-AD001 — /admin loads with member count + stats
- Location: tests/e2e/navigator-portal.spec.ts:76:5

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/admin**" until "load"
  navigated to "https://thrive-at-home-pied.vercel.app/dashboard"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]: My Dashboard | ThriveAtHome
  - generic [ref=e3]:
    - navigation [ref=e4]:
      - generic [ref=e5]:
        - link "ThriveAtHome" [ref=e6] [cursor=pointer]:
          - /url: /dashboard
        - generic [ref=e7]:
          - link "Home" [ref=e8] [cursor=pointer]:
            - /url: /dashboard
          - link "History" [ref=e9] [cursor=pointer]:
            - /url: /dashboard/history
          - link "Community" [ref=e10] [cursor=pointer]:
            - /url: /dashboard/communities
          - link "Family" [ref=e11] [cursor=pointer]:
            - /url: /dashboard/family
          - link "Messages" [ref=e12] [cursor=pointer]:
            - /url: /dashboard/messages
          - link "Buddy" [ref=e13] [cursor=pointer]:
            - /url: /dashboard/buddy
          - link "Documents" [ref=e14] [cursor=pointer]:
            - /url: /dashboard/documents
          - link "Settings" [ref=e15] [cursor=pointer]:
            - /url: /dashboard/settings
        - generic [ref=e17]: Member
    - main [ref=e18]:
      - generic [ref=e19]:
        - generic [ref=e20]:
          - heading "Good morning, Friend 🌿" [level=1] [ref=e21]
          - paragraph [ref=e22]: Thrive Basics member
        - generic [ref=e24]:
          - generic [ref=e25]:
            - img [ref=e26]
            - generic [ref=e29]: Upgrade to Thrive Complete
          - paragraph [ref=e30]: Friend, unlock rides, meals, companionship, and a dedicated Care Navigator — all included.
          - list [ref=e31]:
            - listitem [ref=e32]:
              - img [ref=e33]
              - text: Volunteer rides & transportation
            - listitem [ref=e35]:
              - img [ref=e36]
              - text: Meals coordination
            - listitem [ref=e38]:
              - img [ref=e39]
              - text: Friendly visits & companionship
            - listitem [ref=e41]:
              - img [ref=e42]
              - text: Tech help at home
            - listitem [ref=e44]:
              - img [ref=e45]
              - text: Light errands — pharmacy, grocery
          - generic [ref=e47]:
            - button "$79/mo" [ref=e48] [cursor=pointer]
            - button "$853/yr (save $95)" [ref=e49] [cursor=pointer]
          - button "Upgrade now — $79/mo" [ref=e50] [cursor=pointer]
          - paragraph [ref=e51]: Prorated credit applied immediately · Cancel anytime
        - generic [ref=e52]:
          - heading "Quick access" [level=2] [ref=e53]
          - generic [ref=e54]:
            - link "🏃 Fitness & Walking Complete only" [ref=e55]:
              - /url: "#"
              - generic [ref=e56]: 🏃
              - generic [ref=e57]: Fitness & Walking
              - generic [ref=e58]: Complete only
            - link "🤝 Volunteer Services Complete only" [ref=e59]:
              - /url: "#"
              - generic [ref=e60]: 🤝
              - generic [ref=e61]: Volunteer Services
              - generic [ref=e62]: Complete only
            - link "✉️ Messages" [ref=e63] [cursor=pointer]:
              - /url: /dashboard/messages
              - generic [ref=e64]: ✉️
              - generic [ref=e65]: Messages
            - link "🏠 Home Safety" [ref=e66] [cursor=pointer]:
              - /url: /dashboard/home-safety
              - generic [ref=e67]: 🏠
              - generic [ref=e68]: Home Safety
            - link "🛎️ Book Services Complete only" [ref=e69]:
              - /url: "#"
              - generic [ref=e70]: 🛎️
              - generic [ref=e71]: Book Services
              - generic [ref=e72]: Complete only
            - link "🌍 Community" [ref=e73] [cursor=pointer]:
              - /url: /community
              - generic [ref=e74]: 🌍
              - generic [ref=e75]: Community
        - generic [ref=e76]:
          - generic [ref=e77]: 📞 Aria check-in
          - paragraph [ref=e78]: Your AI companion Aria calls each morning to check in. Miss a call? We'll follow up to make sure you're okay.
          - generic [ref=e79]: "Next call: Tomorrow at 9:00 AM ✓"
        - generic [ref=e80]:
          - generic [ref=e81]: 👨‍👩‍👧 Family portal
          - paragraph [ref=e82]: Up to 3 family members can follow along. Upgrade to Complete for 8 seats.
          - link "Manage family access →" [ref=e83] [cursor=pointer]:
            - /url: /family
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
     |                ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
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