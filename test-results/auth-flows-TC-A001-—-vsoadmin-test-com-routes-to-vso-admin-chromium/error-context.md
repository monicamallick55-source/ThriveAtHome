# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-flows.spec.ts >> TC-A001 — vsoadmin@test.com routes to /vso-admin
- Location: tests/e2e/auth-flows.spec.ts:20:7

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "/vso-admin"
Received string:    "https://thrive-at-home-pied.vercel.app/dashboard"
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
  1  | import { test, expect } from '@playwright/test';
  2  | import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';
  3  | 
  4  | // TC-A001–A006: Auth flows
  5  | 
  6  | const ROLE_ROUTES = [
  7  |   { account: ACCOUNTS.member,       expectedPath: '/dashboard' },
  8  |   { account: ACCOUNTS.family,       expectedPath: '/dashboard/family' },
  9  |   { account: ACCOUNTS.navigator,    expectedPath: '/navigator' },
  10 |   { account: ACCOUNTS.admin,        expectedPath: '/admin' },
  11 |   { account: ACCOUNTS.volunteer,    expectedPath: '/volunteer' },
  12 |   { account: ACCOUNTS.orgadmin,     expectedPath: '/org-admin' },
  13 |   { account: ACCOUNTS.employer,     expectedPath: '/employer-admin' },
  14 |   { account: ACCOUNTS.uniadmin,     expectedPath: '/university-admin' },
  15 |   { account: ACCOUNTS.vsoadmin,     expectedPath: '/vso-admin' },
  16 |   { account: ACCOUNTS.k12admin,     expectedPath: '/school-admin' },
  17 | ];
  18 | 
  19 | for (const { account, expectedPath } of ROLE_ROUTES) {
  20 |   test(`TC-A001 — ${account.email} routes to ${expectedPath}`, async ({ page }) => {
  21 |     await loginAs(page, account);
  22 |     await page.waitForLoadState('networkidle');
  23 |     if (page.url().includes('/login')) {
  24 |       console.warn(`TC-A001: ${account.email} login failed — not seeded or rate limited`);
  25 |       return;
  26 |     }
> 27 |     expect(page.url()).toContain(expectedPath);
     |                        ^ Error: expect(received).toContain(expected) // indexOf
  28 |   });
  29 | }
  30 | 
  31 | test('TC-A002 — /signup page loads', async ({ page }) => {
  32 |   await page.goto(`${BASE}/signup`);
  33 |   await page.waitForLoadState('networkidle');
  34 |   expect(page.url()).not.toContain('/login');
  35 |   const body = await page.locator('body').textContent();
  36 |   expect(body?.toLowerCase()).toMatch(/sign up|create account|register/);
  37 | });
  38 | 
  39 | test('TC-A004 — member cannot reach admin after login', async ({ page }) => {
  40 |   await loginAs(page, ACCOUNTS.member, '/dashboard');
  41 |   if (page.url().includes('/login')) { console.warn('TC-A004: login failed'); return; }
  42 |   await page.goto(`${BASE}/admin`);
  43 |   await page.waitForLoadState('networkidle');
  44 |   expect(page.url()).not.toContain('/admin');
  45 | });
  46 | 
  47 | test('TC-A005 — member cannot reach navigator after login', async ({ page }) => {
  48 |   await loginAs(page, ACCOUNTS.member, '/dashboard');
  49 |   if (page.url().includes('/login')) { console.warn('TC-A005: login failed'); return; }
  50 |   await page.goto(`${BASE}/navigator`);
  51 |   await page.waitForLoadState('networkidle');
  52 |   expect(page.url()).not.toContain('/navigator');
  53 | });
  54 | 
  55 | test('TC-A006 — /login page has email and password fields', async ({ page }) => {
  56 |   await page.goto(`${BASE}/login`);
  57 |   await page.waitForLoadState('networkidle');
  58 |   const emailInput = page.locator('input[type="email"], input[name="email"], #email').first();
  59 |   const passwordInput = page.locator('input[type="password"], input[name="password"], #password').first();
  60 |   await expect(emailInput).toBeVisible();
  61 |   await expect(passwordInput).toBeVisible();
  62 | });
  63 | 
```