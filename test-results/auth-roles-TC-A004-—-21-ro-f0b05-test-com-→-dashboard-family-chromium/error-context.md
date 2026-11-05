# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-roles.spec.ts >> TC-A004 — 21 role login smoke tests >> Family (family@test.com) → /dashboard/family
- Location: tests/e2e/auth-roles.spec.ts:44:9

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/dashboard\/family.*/
Received string:  "https://thrive-at-home-pied.vercel.app/dashboard"
Timeout: 15000ms

Call log:
  - Expect "toHaveURL" with timeout 15000ms
    34 × unexpected value "https://thrive-at-home-pied.vercel.app/dashboard"

```

```yaml
- alert: My Dashboard | ThriveAtHome
- navigation:
  - link "ThriveAtHome":
    - /url: /dashboard
  - link "Home":
    - /url: /dashboard
  - link "History":
    - /url: /dashboard/history
  - link "Community":
    - /url: /dashboard/communities
  - link "Family":
    - /url: /dashboard/family
  - link "Messages":
    - /url: /dashboard/messages
  - link "Buddy":
    - /url: /dashboard/buddy
  - link "Documents":
    - /url: /dashboard/documents
  - link "Settings":
    - /url: /dashboard/settings
  - text: David
- main:
  - heading "Good morning, David 🌿" [level=1]
  - paragraph: Thrive Basics member
  - text: Upgrade to Thrive Complete
  - paragraph: David, unlock rides, meals, companionship, and a dedicated Care Navigator — all included.
  - list:
    - listitem: Volunteer rides & transportation
    - listitem: Meals coordination
    - listitem: Friendly visits & companionship
    - listitem: Tech help at home
    - listitem: Light errands — pharmacy, grocery
  - button "$79/mo"
  - button "$853/yr (save $95)"
  - button "Upgrade now — $79/mo"
  - paragraph: Prorated credit applied immediately · Cancel anytime
  - heading "Quick access" [level=2]
  - link "🏃 Fitness & Walking Complete only":
    - /url: "#"
  - link "🤝 Volunteer Services Complete only":
    - /url: "#"
  - link "✉️ Messages":
    - /url: /dashboard/messages
  - link "🏠 Home Safety":
    - /url: /dashboard/home-safety
  - link "🛎️ Book Services Complete only":
    - /url: "#"
  - link "🌍 Community":
    - /url: /community
  - text: 📞 Aria check-in
  - paragraph: Your AI companion Aria calls each morning to check in. Miss a call? We'll follow up to make sure you're okay.
  - text: "Next call: Tomorrow at 9:00 AM ✓ 👨‍👩‍👧 Family portal"
  - paragraph: Up to 3 family members can follow along. Upgrade to Complete for 8 seats.
  - link "Manage family access →":
    - /url: /family
```

# Test source

```ts
  1   | /**
  2   |  * TC-A004 — All 21 roles login smoke test
  3   |  * TC-A005 — Cross-role access blocked
  4   |  * TC-P050 — /login role routing
  5   |  * TC-P051 — /signup validation
  6   |  * TC-A006 — /device kiosk loads
  7   |  *
  8   |  * Run: npx playwright test tests/e2e/auth-roles.spec.ts
  9   |  *
  10  |  * NOTE: These tests require seed accounts to exist in Supabase.
  11  |  * See tests/db/seed-accounts.sql for setup.
  12  |  */
  13  | import { test, expect } from '@playwright/test';
  14  | import { ACCOUNTS, loginAs } from './helpers';
  15  | 
  16  | /** TC-A004 / TC-P050 — All 21 roles reach correct portal */
  17  | const ROLE_PORTAL_MAP: Array<{ key: keyof typeof ACCOUNTS; portal: string; label: string }> = [
  18  |   { key: 'member',       portal: '/dashboard',           label: 'Member' },
  19  |   { key: 'family',       portal: '/dashboard/family',    label: 'Family' },
  20  |   { key: 'navigator',    portal: '/navigator',            label: 'Navigator' },
  21  |   { key: 'admin',        portal: '/admin',               label: 'Admin' },
  22  |   { key: 'careworker',   portal: '/care-worker',         label: 'Care Worker' },
  23  |   { key: 'volunteer',    portal: '/volunteer/dashboard', label: 'General Volunteer' },
  24  |   { key: 'student',      portal: '/volunteer/dashboard', label: 'Student Volunteer' },
  25  |   { key: 'veteran',      portal: '/volunteer/dashboard', label: 'Veteran Volunteer' },
  26  |   { key: 'retired_pro',  portal: '/volunteer/dashboard', label: 'Retired Pro Volunteer' },
  27  |   { key: 'corporate',    portal: '/volunteer/dashboard', label: 'Corporate Volunteer' },
  28  |   { key: 'neighbor',     portal: '/volunteer/dashboard', label: 'Neighbor Volunteer' },
  29  |   { key: 'faith',        portal: '/volunteer/dashboard', label: 'Faith Volunteer' },
  30  |   { key: 'k12student',   portal: '/volunteer/dashboard', label: 'K-12 Student Volunteer' },
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
> 48  |       await expect(page).toHaveURL(new RegExp(portal.replace('/', '\\/').replace('-', '\\-') + '.*'), { timeout: 15_000 });
      |                          ^ Error: expect(page).toHaveURL(expected) failed
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
  131 |   await page.getByLabel(/email/i).fill('not-an-email');
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