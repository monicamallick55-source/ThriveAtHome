# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-roles.spec.ts >> TC-P051 — /signup rejects invalid email and mismatched passwords
- Location: tests/e2e/auth-roles.spec.ts:127:5

# Error details

```
TimeoutError: locator.fill: Timeout 10000ms exceeded.
Call log:
  - waiting for getByLabel(/email/i)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - link "Thrive@Home" [ref=e3] [cursor=pointer]:
      - /url: /
      - generic [ref=e4]: Thrive@Home
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e8]: "1"
        - generic [ref=e11]: "2"
        - generic [ref=e14]: "3"
      - generic [ref=e15]:
        - generic [ref=e16]: Choose Plan
        - generic [ref=e17]: Your Info
        - generic [ref=e18]: Payment
      - generic [ref=e19]:
        - heading "Choose your plan" [level=1] [ref=e20]
        - paragraph [ref=e21]: Start with what fits — upgrade anytime.
        - generic [ref=e22]:
          - button "Monthly" [ref=e23] [cursor=pointer]
          - button "Annual (save 10%)" [ref=e24] [cursor=pointer]
        - generic [ref=e25]:
          - button "Thrive Basics $39/mo Quinn AI concierge — 24/7 by phone Aria daily check-in calls Emergency alerts to family Family portal — 3 seats" [ref=e26] [cursor=pointer]:
            - generic [ref=e27]:
              - generic [ref=e28]:
                - generic [ref=e29]: Thrive Basics
                - generic [ref=e30]: $39/mo
              - img [ref=e32]
            - list [ref=e34]:
              - listitem [ref=e35]:
                - img [ref=e36]
                - text: Quinn AI concierge — 24/7 by phone
              - listitem [ref=e38]:
                - img [ref=e39]
                - text: Aria daily check-in calls
              - listitem [ref=e41]:
                - img [ref=e42]
                - text: Emergency alerts to family
              - listitem [ref=e44]:
                - img [ref=e45]
                - text: Family portal — 3 seats
          - button "Thrive Complete $79/mo Everything in Basics Volunteer rides & transportation Meals coordination Friendly visits & companionship" [ref=e47] [cursor=pointer]:
            - generic [ref=e49]:
              - generic [ref=e50]: Thrive Complete
              - generic [ref=e51]: $79/mo
            - list [ref=e53]:
              - listitem [ref=e54]:
                - img [ref=e55]
                - text: Everything in Basics
              - listitem [ref=e57]:
                - img [ref=e58]
                - text: Volunteer rides & transportation
              - listitem [ref=e60]:
                - img [ref=e61]
                - text: Meals coordination
              - listitem [ref=e63]:
                - img [ref=e64]
                - text: Friendly visits & companionship
        - button "Continue with Thrive Basics" [ref=e66] [cursor=pointer]:
          - text: Continue with Thrive Basics
          - img [ref=e67]
        - paragraph [ref=e69]:
          - text: Already a member?
          - link "Sign in" [ref=e70] [cursor=pointer]:
            - /url: /dashboard
      - paragraph [ref=e71]: Some Medicare Advantage plans may cover ThriveAtHome. Ask Quinn to check your plan.
  - alert [ref=e72]
```

# Test source

```ts
  31  |   { key: 'agency',       portal: '/agency-admin',        label: 'Agency Admin' },
  32  |   { key: 'employer',     portal: '/employer-admin',      label: 'Employer Admin' },
  33  |   { key: 'network',      portal: '/network-admin',       label: 'Network Admin' },
  34  |   { key: 'seniorcenter', portal: '/senior-center-admin', label: 'Senior Center Admin' },
  35  |   { key: 'aaa',          portal: '/aaa-admin',           label: 'AAA Admin' },
  36  |   { key: 'orgadmin',     portal: '/org-admin',           label: 'Org Admin' },
  37  |   { key: 'vsoadmin',     portal: '/vso-admin',           label: 'VSO Admin' },
  38  |   { key: 'uniadmin',     portal: '/university-admin',    label: 'University Admin' },
  39  |   { key: 'k12admin',     portal: '/school-admin',        label: 'K-12 Admin' },
  40  | ];
  41  | 
  42  | test.describe('TC-A004 — 21 role login smoke tests', () => {
  43  |   for (const { key, portal, label } of ROLE_PORTAL_MAP) {
  44  |     test(`${label} (${ACCOUNTS[key].email}) → ${portal}`, async ({ page }) => {
  45  |       await loginAs(page, ACCOUNTS[key]);
  46  | 
  47  |       // Should land on the expected portal (or a sub-path of it)
  48  |       await expect(page).toHaveURL(new RegExp(portal.replace('/', '\\/').replace('-', '\\-') + '.*'), { timeout: 15_000 });
  49  | 
  50  |       // No 500 error on the portal page
  51  |       const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  52  |       expect(/500|internal server error|application error/i.test(bodyText)).toBe(false);
  53  | 
  54  |       // Portal has at least some meaningful content
  55  |       const h1 = await page.locator('h1, h2, [data-testid="dashboard-title"]').first().textContent({ timeout: 5000 }).catch(() => '');
  56  |       expect(h1?.length ?? 0).toBeGreaterThan(0);
  57  |     });
  58  |   }
  59  | });
  60  | 
  61  | /** TC-A005 — Cross-role access blocked */
  62  | test.describe('TC-A005 — cross-role access blocked', () => {
  63  |   test('member cannot access /navigator', async ({ page }) => {
  64  |     await loginAs(page, ACCOUNTS.member);
  65  |     await page.goto('/navigator');
  66  |     // Should be redirected away or shown 401/403
  67  |     const url = page.url();
  68  |     const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  69  |     const isBlocked =
  70  |       url.includes('/login') ||
  71  |       url.includes('/dashboard') ||
  72  |       /401|403|unauthorized|forbidden|access denied/i.test(bodyText);
  73  |     expect(isBlocked, 'Member should not access /navigator').toBe(true);
  74  |   });
  75  | 
  76  |   test('volunteer cannot access /admin', async ({ page }) => {
  77  |     await loginAs(page, ACCOUNTS.volunteer);
  78  |     await page.goto('/admin');
  79  |     const url = page.url();
  80  |     const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  81  |     const isBlocked =
  82  |       url.includes('/login') ||
  83  |       url.includes('/volunteer') ||
  84  |       /401|403|unauthorized|forbidden|access denied/i.test(bodyText);
  85  |     expect(isBlocked, 'Volunteer should not access /admin').toBe(true);
  86  |   });
  87  | 
  88  |   test('family cannot access /org-admin', async ({ page }) => {
  89  |     await loginAs(page, ACCOUNTS.family);
  90  |     await page.goto('/org-admin');
  91  |     const url = page.url();
  92  |     const isBlocked = url.includes('/login') || url.includes('/dashboard/family');
  93  |     expect(isBlocked, 'Family should not access /org-admin').toBe(true);
  94  |   });
  95  | 
  96  |   test('k12student cannot access /employer-admin', async ({ page }) => {
  97  |     await loginAs(page, ACCOUNTS.k12student);
  98  |     await page.goto('/employer-admin');
  99  |     const url = page.url();
  100 |     const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  101 |     const isBlocked =
  102 |       url.includes('/login') ||
  103 |       url.includes('/volunteer') ||
  104 |       /401|403|unauthorized|forbidden/i.test(bodyText);
  105 |     expect(isBlocked, 'K12 student should not access /employer-admin').toBe(true);
  106 |   });
  107 | });
  108 | 
  109 | /** TC-A006 — Device kiosk /device loads */
  110 | test('TC-A006 — /device kiosk loads with large-print UI', async ({ page }) => {
  111 |   await page.goto('/device');
  112 |   // Should NOT redirect to /login — kiosk is accessible or has its own auth flow
  113 |   const url = page.url();
  114 |   if (url.includes('/login')) {
  115 |     console.warn('TC-A006: /device redirects to /login — may need device-specific auth');
  116 |     return;
  117 |   }
  118 |   // Should have prominent Aria/call button
  119 |   const hasCallBtn = await page.getByRole('button', { name: /call|aria|check.?in/i }).isVisible().catch(() => false);
  120 |   if (!hasCallBtn) console.warn('TC-A006: Aria call button not found on /device');
  121 |   // No standard nav sidebar
  122 |   const hasSidebar = await page.locator('nav[aria-label="sidebar"], [data-testid="sidebar"]').isVisible().catch(() => false);
  123 |   expect(hasSidebar, '/device should not have standard sidebar nav').toBe(false);
  124 | });
  125 | 
  126 | /** TC-P051 — /signup form validation */
  127 | test('TC-P051 — /signup rejects invalid email and mismatched passwords', async ({ page }) => {
  128 |   await page.goto('/signup');
  129 | 
  130 |   // Invalid email
> 131 |   await page.getByLabel(/email/i).fill('not-an-email');
      |                                   ^ TimeoutError: locator.fill: Timeout 10000ms exceeded.
  132 |   await page.getByLabel(/password/i).first().fill('Password123!');
  133 |   await page.getByRole('button', { name: /sign up|create account|get started/i }).click();
  134 | 
  135 |   const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  136 |   const hasError = /invalid|enter.*email|valid email/i.test(bodyText) ||
  137 |     await page.locator('[role="alert"], .error, [data-error]').isVisible().catch(() => false);
  138 |   expect(hasError, 'Should show validation error for invalid email').toBe(true);
  139 | });
  140 | 
```