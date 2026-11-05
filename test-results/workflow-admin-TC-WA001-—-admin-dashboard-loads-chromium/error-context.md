# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workflow-admin.spec.ts >> TC-WA001 — admin dashboard loads
- Location: tests/e2e/workflow-admin.spec.ts:7:5

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "/admin"
Received string:    "https://thrive-at-home-pied.vercel.app/dashboard"
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - navigation [ref=e3]:
      - generic [ref=e4]:
        - link "ThriveAtHome" [ref=e5] [cursor=pointer]:
          - /url: /dashboard
        - generic [ref=e6]:
          - link "Home" [ref=e7] [cursor=pointer]:
            - /url: /dashboard
          - link "History" [ref=e8] [cursor=pointer]:
            - /url: /dashboard/history
          - link "Community" [ref=e9] [cursor=pointer]:
            - /url: /dashboard/communities
          - link "Family" [ref=e10] [cursor=pointer]:
            - /url: /dashboard/family
          - link "Messages" [ref=e11] [cursor=pointer]:
            - /url: /dashboard/messages
          - link "Buddy" [ref=e12] [cursor=pointer]:
            - /url: /dashboard/buddy
          - link "Documents" [ref=e13] [cursor=pointer]:
            - /url: /dashboard/documents
          - link "Settings" [ref=e14] [cursor=pointer]:
            - /url: /dashboard/settings
        - generic [ref=e16]: Member
    - main [ref=e17]:
      - generic [ref=e18]:
        - generic [ref=e19]:
          - heading "Good morning, Friend 🌿" [level=1] [ref=e20]
          - paragraph [ref=e21]: Thrive Basics member
        - generic [ref=e23]:
          - generic [ref=e24]:
            - img [ref=e25]
            - generic [ref=e28]: Upgrade to Thrive Complete
          - paragraph [ref=e29]: Friend, unlock rides, meals, companionship, and a dedicated Care Navigator — all included.
          - list [ref=e30]:
            - listitem [ref=e31]:
              - img [ref=e32]
              - text: Volunteer rides & transportation
            - listitem [ref=e34]:
              - img [ref=e35]
              - text: Meals coordination
            - listitem [ref=e37]:
              - img [ref=e38]
              - text: Friendly visits & companionship
            - listitem [ref=e40]:
              - img [ref=e41]
              - text: Tech help at home
            - listitem [ref=e43]:
              - img [ref=e44]
              - text: Light errands — pharmacy, grocery
          - generic [ref=e46]:
            - button "$79/mo" [ref=e47] [cursor=pointer]
            - button "$853/yr (save $95)" [ref=e48] [cursor=pointer]
          - button "Upgrade now — $79/mo" [ref=e49] [cursor=pointer]
          - paragraph [ref=e50]: Prorated credit applied immediately · Cancel anytime
        - generic [ref=e51]:
          - heading "Quick access" [level=2] [ref=e52]
          - generic [ref=e53]:
            - link "🏃 Fitness & Walking Complete only" [ref=e54]:
              - /url: "#"
              - generic [ref=e55]: 🏃
              - generic [ref=e56]: Fitness & Walking
              - generic [ref=e57]: Complete only
            - link "🤝 Volunteer Services Complete only" [ref=e58]:
              - /url: "#"
              - generic [ref=e59]: 🤝
              - generic [ref=e60]: Volunteer Services
              - generic [ref=e61]: Complete only
            - link "✉️ Messages" [ref=e62] [cursor=pointer]:
              - /url: /dashboard/messages
              - generic [ref=e63]: ✉️
              - generic [ref=e64]: Messages
            - link "🏠 Home Safety" [ref=e65] [cursor=pointer]:
              - /url: /dashboard/home-safety
              - generic [ref=e66]: 🏠
              - generic [ref=e67]: Home Safety
            - link "🛎️ Book Services Complete only" [ref=e68]:
              - /url: "#"
              - generic [ref=e69]: 🛎️
              - generic [ref=e70]: Book Services
              - generic [ref=e71]: Complete only
            - link "🌍 Community" [ref=e72] [cursor=pointer]:
              - /url: /community
              - generic [ref=e73]: 🌍
              - generic [ref=e74]: Community
        - generic [ref=e75]:
          - generic [ref=e76]: 📞 Aria check-in
          - paragraph [ref=e77]: Your AI companion Aria calls each morning to check in. Miss a call? We'll follow up to make sure you're okay.
          - generic [ref=e78]: "Next call: Tomorrow at 9:00 AM ✓"
        - generic [ref=e79]:
          - generic [ref=e80]: 👨‍👩‍👧 Family portal
          - paragraph [ref=e81]: Up to 3 family members can follow along. Upgrade to Complete for 8 seats.
          - link "Manage family access →" [ref=e82] [cursor=pointer]:
            - /url: /family
  - alert [ref=e83]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';
  3  | 
  4  | // TC-WA001–WA012: Admin + Care Worker workflows
  5  | // No beforeEach — each test logs in independently with soft-warn pattern
  6  | 
  7  | test('TC-WA001 — admin dashboard loads', async ({ page }) => {
  8  |   await loginAs(page, ACCOUNTS.admin);
  9  |   if (page.url().includes('/login')) { console.warn('TC-WA001: admin login failed — not seeded'); return; }
  10 |   await page.goto(`${BASE}/admin`);
  11 |   await page.waitForLoadState('networkidle');
  12 |   if (page.url().includes('/login')) { console.warn('TC-WA001: redirected to login after nav'); return; }
> 13 |   expect(page.url()).toContain('/admin');
     |                      ^ Error: expect(received).toContain(expected) // indexOf
  14 | });
  15 | 
  16 | test('TC-WA002 — /admin/ma-report loads', async ({ page }) => {
  17 |   await loginAs(page, ACCOUNTS.admin);
  18 |   if (page.url().includes('/login')) { console.warn('TC-WA002: admin login failed'); return; }
  19 |   await page.goto(`${BASE}/admin/ma-report`);
  20 |   await page.waitForLoadState('networkidle');
  21 |   if (page.url().includes('/login')) { console.warn('TC-WA002: redirected to login'); return; }
  22 |   expect(page.url()).not.toContain('/login');
  23 | });
  24 | 
  25 | test('TC-WA003 — /admin/metro-activation loads', async ({ page }) => {
  26 |   await loginAs(page, ACCOUNTS.admin);
  27 |   if (page.url().includes('/login')) { console.warn('TC-WA003: admin login failed'); return; }
  28 |   await page.goto(`${BASE}/admin/metro-activation`);
  29 |   await page.waitForLoadState('networkidle');
  30 |   if (page.url().includes('/login')) { console.warn('TC-WA003: redirected to login'); return; }
  31 |   expect(page.url()).not.toContain('/login');
  32 | });
  33 | 
  34 | test('TC-WA004 — /admin/devices loads', async ({ page }) => {
  35 |   await loginAs(page, ACCOUNTS.admin);
  36 |   if (page.url().includes('/login')) { console.warn('TC-WA004: admin login failed'); return; }
  37 |   await page.goto(`${BASE}/admin/devices`);
  38 |   await page.waitForLoadState('networkidle');
  39 |   if (page.url().includes('/login')) { console.warn('TC-WA004: redirected to login'); return; }
  40 |   expect(page.url()).not.toContain('/login');
  41 | });
  42 | 
  43 | test('TC-WA005 — /admin/campaigns loads', async ({ page }) => {
  44 |   await loginAs(page, ACCOUNTS.admin);
  45 |   if (page.url().includes('/login')) { console.warn('TC-WA005: admin login failed'); return; }
  46 |   await page.goto(`${BASE}/admin/campaigns`);
  47 |   await page.waitForLoadState('networkidle');
  48 |   if (page.url().includes('/login')) { console.warn('TC-WA005: redirected to login'); return; }
  49 |   expect(page.url()).not.toContain('/login');
  50 | });
  51 | 
  52 | test('TC-WA010 — /agency-admin loads for agency account', async ({ page }) => {
  53 |   await loginAs(page, ACCOUNTS.agency);
  54 |   if (page.url().includes('/login')) { console.warn('TC-WA010: agency login failed — not seeded'); return; }
  55 |   await page.goto(`${BASE}/agency-admin`);
  56 |   await page.waitForLoadState('networkidle');
  57 |   if (page.url().includes('/login')) { console.warn('TC-WA010: redirected to login'); return; }
  58 |   expect(page.url()).not.toContain('/login');
  59 | });
  60 | 
  61 | test('TC-WA011 — care worker portal loads', async ({ page }) => {
  62 |   await loginAs(page, ACCOUNTS.careworker);
  63 |   if (page.url().includes('/login')) { console.warn('TC-WA011: careworker login failed — not seeded'); return; }
  64 |   await page.waitForLoadState('networkidle');
  65 |   if (page.url().includes('/login')) { console.warn('TC-WA011: still on login after wait'); return; }
  66 |   expect(page.url()).not.toContain('/login');
  67 | });
  68 | 
  69 | test('TC-WA012 — /api/admin/feature-flags responds', async ({ page }) => {
  70 |   const res = await page.request.get(`${BASE}/api/admin/feature-flags`);
  71 |   if (res.status() === 404) { console.warn('TC-WA012: /api/admin/feature-flags not found'); return; }
  72 |   expect([200, 401, 403]).toContain(res.status());
  73 | });
  74 | 
```