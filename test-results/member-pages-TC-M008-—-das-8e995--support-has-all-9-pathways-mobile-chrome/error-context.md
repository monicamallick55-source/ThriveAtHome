# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: member-pages.spec.ts >> TC-M008 — /dashboard/grief-support has all 9 pathways
- Location: tests/e2e/member-pages.spec.ts:109:5

# Error details

```
Error: TC-M008: Expected 9 grief pathways, found 5

expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 7
Received:    5
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - navigation [ref=e3]:
      - link "🏠 Home" [ref=e4] [cursor=pointer]:
        - /url: /dashboard
        - generic [ref=e5]: 🏠
        - generic [ref=e6]: Home
      - link "📋 History" [ref=e7] [cursor=pointer]:
        - /url: /dashboard/history
        - generic [ref=e8]: 📋
        - generic [ref=e9]: History
      - link "👥 Community" [ref=e10] [cursor=pointer]:
        - /url: /dashboard/communities
        - generic [ref=e11]: 👥
        - generic [ref=e12]: Community
      - link "✉️ Messages" [ref=e13] [cursor=pointer]:
        - /url: /dashboard/messages
        - generic [ref=e14]: ✉️
        - generic [ref=e15]: Messages
      - link "📄 Docs" [ref=e16] [cursor=pointer]:
        - /url: /dashboard/documents
        - generic [ref=e17]: 📄
        - generic [ref=e18]: Docs
    - main [ref=e19]:
      - generic [ref=e20]:
        - generic [ref=e21]:
          - heading "Life Transitions Support" [level=1] [ref=e22]
          - paragraph [ref=e23]: Major life changes are hard. Your navigator is here to help — and you are not alone.
        - generic [ref=e24]:
          - heading "Common transitions we support" [level=2] [ref=e25]
          - button "💔 Late-life divorce or separation Ending a long marriage later in life brings unique legal, financial, and emotional challenges. You don't have to navigate this alone." [ref=e27]:
            - generic [ref=e28]: 💔
            - generic [ref=e29]:
              - paragraph [ref=e30]: Late-life divorce or separation
              - paragraph [ref=e31]: Ending a long marriage later in life brings unique legal, financial, and emotional challenges. You don't have to navigate this alone.
            - img [ref=e32]
          - button "🧠 Dementia or MCI diagnosis A diagnosis of Alzheimer's, another dementia, or mild cognitive impairment (MCI) changes everything. Early planning and support make a meaningful difference." [ref=e35]:
            - generic [ref=e36]: 🧠
            - generic [ref=e37]:
              - paragraph [ref=e38]: Dementia or MCI diagnosis
              - paragraph [ref=e39]: A diagnosis of Alzheimer's, another dementia, or mild cognitive impairment (MCI) changes everything. Early planning and support make a meaningful difference.
            - img [ref=e40]
          - button "🏠 Adult child moving away When a child who has been nearby moves to another city or country, it can feel like a significant loss — and a good reason to build stronger local connections." [ref=e43]:
            - generic [ref=e44]: 🏠
            - generic [ref=e45]:
              - paragraph [ref=e46]: Adult child moving away
              - paragraph [ref=e47]: When a child who has been nearby moves to another city or country, it can feel like a significant loss — and a good reason to build stronger local connections.
            - img [ref=e48]
          - button "🏘️ Housing insecurity or forced move Facing the possibility of losing your home — whether from a rent increase, a health change, or another reason — is one of the most stressful situations there is." [ref=e51]:
            - generic [ref=e52]: 🏘️
            - generic [ref=e53]:
              - paragraph [ref=e54]: Housing insecurity or forced move
              - paragraph [ref=e55]: Facing the possibility of losing your home — whether from a rent increase, a health change, or another reason — is one of the most stressful situations there is.
            - img [ref=e56]
        - paragraph [ref=e59]: Your navigator can connect you with licensed therapists, grief counselors, and chaplains. Ask your navigator for a referral.
  - alert [ref=e60]
```

# Test source

```ts
  31  |   { path: '/dashboard/marketplace',           tc: 'TC-M019', key: [] }, // coming soon
  32  |   { path: '/dashboard/home-safety',           tc: 'TC-M020', key: [] },
  33  |   { path: '/dashboard/home-sharing',          tc: 'TC-M021', key: [] },
  34  |   { path: '/dashboard/encore-careers',        tc: 'TC-M022', key: [] },
  35  |   { path: '/dashboard/medicare-help',         tc: 'TC-M023', key: [] },
  36  |   { path: '/dashboard/plan-comparison',       tc: 'TC-M024', key: [] },
  37  |   { path: '/dashboard/fhir-referrals',        tc: 'TC-M025', key: [] },
  38  |   { path: '/dashboard/festivals',             tc: 'TC-M026', key: [] },
  39  |   { path: '/dashboard/training',              tc: 'TC-M027', key: [] },
  40  |   { path: '/dashboard/volunteer-opportunities', tc: 'TC-M028', key: [] },
  41  |   { path: '/dashboard/transition',            tc: 'TC-M029', key: [] },
  42  |   { path: '/dashboard/pets',                  tc: 'TC-M030', key: [] },
  43  |   { path: '/dashboard/gift-send',             tc: 'TC-M031', key: [] },
  44  |   { path: '/dashboard/gifts',                 tc: 'TC-M032', key: [] },
  45  |   { path: '/dashboard/celebrations',          tc: 'TC-M033', key: [] },
  46  |   { path: '/dashboard/celebrations/plan',     tc: 'TC-M034', key: [] },
  47  | ];
  48  | 
  49  | test.describe('TC-M001–M034 — member dashboard pages load', () => {
  50  |   // Log in once and reuse session via storage state
  51  |   test.beforeEach(async ({ page }) => {
  52  |     await loginAs(page, ACCOUNTS.member, '/dashboard');
  53  |   });
  54  | 
  55  |   for (const { path, tc, key } of MEMBER_PAGES) {
  56  |     test(`${tc} — ${path}`, async ({ page }) => {
  57  |       await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  58  | 
  59  |       const url = page.url();
  60  |       // Should NOT be redirected to /login
  61  |       expect(url).not.toContain('/login');
  62  | 
  63  |       const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  64  | 
  65  |       // Should NOT be a server error
  66  |       expect(/500|internal server error|application error/i.test(bodyText), `${tc}: server error`).toBe(false);
  67  | 
  68  |       // Should NOT be a hard 404 (page not found with no content)
  69  |       const is404 = /^(not found|404 — |page not found)$/im.test(bodyText.trim().substring(0, 100));
  70  |       expect(is404, `${tc}: ${path} returned 404`).toBe(false);
  71  | 
  72  |       // Key element spot-checks (soft — warn only)
  73  |       for (const keyword of key) {
  74  |         const found = new RegExp(keyword, 'i').test(bodyText);
  75  |         if (!found) console.warn(`${tc}: expected keyword "${keyword}" not found on ${path}`);
  76  |       }
  77  |     });
  78  |   }
  79  | });
  80  | 
  81  | /** TC-M015 — 4 add-on SKUs present on /dashboard/addons */
  82  | test('TC-M015 — /dashboard/addons has all 4 add-on SKUs', async ({ page }) => {
  83  |   await loginAs(page, ACCOUNTS.member, '/dashboard');
  84  |   await page.goto('/dashboard/addons');
  85  | 
  86  |   const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  87  | 
  88  |   // The 4 expected SKUs
  89  |   const skus = [
  90  |     /extra.*navigator.*hours|navigator.*hours.*block/i,
  91  |     /premium.*content|content.*access/i,
  92  |     /companion.*care.*credits|companion.*credits/i,
  93  |     /enhanced.*fraud|fraud.*monitoring/i,
  94  |   ];
  95  | 
  96  |   let missing = 0;
  97  |   for (const sku of skus) {
  98  |     if (!sku.test(bodyText)) {
  99  |       console.warn(`TC-M015: SKU not found: ${sku.source}`);
  100 |       missing++;
  101 |     }
  102 |   }
  103 |   if (missing > 0) {
  104 |     console.warn(`TC-M015: ${missing}/4 add-on SKUs not found — verify names in /dashboard/addons`);
  105 |   }
  106 | });
  107 | 
  108 | /** TC-M008 — 9 grief pathways on /dashboard/grief-support */
  109 | test('TC-M008 — /dashboard/grief-support has all 9 pathways', async ({ page }) => {
  110 |   await loginAs(page, ACCOUNTS.member, '/dashboard');
  111 |   await page.goto('/dashboard/grief-support');
  112 | 
  113 |   const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  114 | 
  115 |   const pathways = [
  116 |     /loss of a loved one/i,
  117 |     /major health diagnosis/i,
  118 |     /major life change/i,
  119 |     /caregiver support/i,
  120 |     /loss of driving/i,
  121 |     /late.?life divorce|divorce.*separation/i,
  122 |     /dementia|mci diagnosis/i,
  123 |     /adult child moving/i,
  124 |     /housing insecurity|forced move/i,
  125 |   ];
  126 | 
  127 |   let found = 0;
  128 |   for (const p of pathways) {
  129 |     if (p.test(bodyText)) found++;
  130 |   }
> 131 |   expect(found, `TC-M008: Expected 9 grief pathways, found ${found}`).toBeGreaterThanOrEqual(7);
      |                                                                       ^ Error: TC-M008: Expected 9 grief pathways, found 5
  132 |   if (found < 9) console.warn(`TC-M008: Only ${found}/9 grief pathways found`);
  133 | });
  134 | 
  135 | /** TC-M011 — /dashboard/trusted-advisors — chaplain not proactively shown */
  136 | test('TC-M011 — trusted advisors: chaplain not shown proactively', async ({ page }) => {
  137 |   await loginAs(page, ACCOUNTS.member, '/dashboard');
  138 |   await page.goto('/dashboard/trusted-advisors');
  139 | 
  140 |   // "Request an introduction" should be present
  141 |   const introBtn = page.getByRole('button', { name: /request.*introduction|contact/i }).or(
  142 |     page.getByRole('link', { name: /request.*introduction/i })
  143 |   );
  144 |   const hasIntroBtn = await introBtn.isVisible({ timeout: 5000 }).catch(() => false);
  145 |   if (!hasIntroBtn) console.warn('TC-M011: "Request an introduction" button not found');
  146 | 
  147 |   // Chaplain should require request (not auto-shown as a proactive suggestion)
  148 |   // Soft check — just warn
  149 |   const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
  150 |   const hasChaplain = /chaplain/i.test(bodyText);
  151 |   if (hasChaplain) {
  152 |     console.warn('TC-M011: Chaplain may be proactively shown — spec says it should require member request');
  153 |   }
  154 | });
  155 | 
  156 | /** TC-M005 — 20 communities listed */
  157 | test('TC-M005 — /dashboard/communities shows ≥ 20 circles', async ({ page }) => {
  158 |   await loginAs(page, ACCOUNTS.member, '/dashboard');
  159 |   await page.goto('/dashboard/communities');
  160 | 
  161 |   // Count community circle cards
  162 |   const circles = await page.locator('[data-testid="community-card"], .community-card, [class*="circle"], [class*="community"]').count();
  163 |   console.log(`TC-M005: Found ${circles} community elements`);
  164 |   // Soft check — the page may use different markup
  165 |   if (circles < 20) console.warn(`TC-M005: Expected ≥ 20 circles, found ${circles} — check markup`);
  166 | });
  167 | 
```