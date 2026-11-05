# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-flows.spec.ts >> TC-A002 — /signup page loads
- Location: tests/e2e/auth-flows.spec.ts:31:5

# Error details

```
Error: expect(received).toMatch(expected)

Expected pattern: /sign up|create account|register/
Received string:  "thrive@home123choose planyour infopaymentchoose your planstart with what fits — upgrade anytime.monthlyannual (save 10%)thrive basics$39/mo quinn ai concierge — 24/7 by phone aria daily check-in calls emergency alerts to family family portal — 3 seatsthrive complete$79/mo everything in basics volunteer rides & transportation meals coordination friendly visits & companionshipcontinue with thrive basics already a member? sign insome medicare advantage plans may cover thriveathome. ask quinn to check your plan.@keyframes spin { to { transform: rotate(360deg) } }(self.__next_f=self.__next_f||[]).push([0])self.__next_f.push([1,\"1:\\\"$sreact.fragment\\\"\\n2:i[985571,[\\\"/_next/static/chunks/0isr5p-vpeff_.js\\\",\\\"/_next/static/chunks/0i.l9589uvx0j.js\\\"],\\\"default\\\"]\\n3:i[339756,[\\\"/_next/static/chunks/0isr5p-vpeff_.js\\\",\\\"/_next/static/chunks/0i.l9589uvx0j.js\\\"],\\\"default\\\"]\\n4:i[408821,[\\\"/_next/static/chunks/0isr5p-vpeff_.js\\\",\\\"/_next/static/chunks/0i.l9589uvx0j.js\\\",\\\"/_next/static/chunks/0nqx9t32s__fn.js\\\"],\\\"default\\\"]\\n5:i[837457,[\\\"/_next/static/chunks/0isr5p-vpeff_.js\\\",\\\"/_next/static/chunks/0i.l9589uvx0j.js\\\"],\\\"default\\\"]\\n6:i[347257,[\\\"/_next/static/chunks/0isr5p-vpeff_.js\\\",\\\"/_next/static/chunks/0i.l9589uvx0j.js\\\"],\\\"clientpageroot\\\"]\\n7:i[82306,[\\\"/_next/static/chunks/0isr5p-vpeff_.js\\\",\\\"/_next/static/chunks/0i.l9589uvx0j.js\\\",\\\"/_next/static/chunks/0ap8.m1615k39.js\\\",\\\"/_next/static/chunks/0yy9t3-427u8p.js\\\"],\\\"default\\\"]\\na:i[897367,[\\\"/_next/static/chunks/0isr5p-vpeff_.js\\\",\\\"/_next/static/chunks/0i.l9589uvx0j.js\\\"],\\\"outletboundary\\\"]\\nb:\\\"$sreact.suspense\\\"\\ne:i[897367,[\\\"/_next/static/chunks/0isr5p-vpeff_.js\\\",\\\"/_next/static/chunks/0i.l9589uvx0j.js\\\"],\\\"viewportboundary\\\"]\\n10:i[897367,[\\\"/_next/static/chunks/0isr5p-vpeff_.js\\\",\\\"/_next/static/chunks/0i.l9589uvx0j.js\\\"],\\\"metadataboundary\\\"]\\n12:i[168027,[\\\"/_next/static/chunks/0isr5p-vpeff_.js\\\",\\\"/_next/static/chunks/0i.l9589uvx0j.js\\\"],\\\"default\\\",1]\\n:hl[\\\"/_next/static/chunks/0zk~e5cjxbkpo.css\\\",\\\"style\\\"]\\n:hc[\\\"/\\\",\\\"\\\"]\\n\"])self.__next_f.push([1,\"0:{\\\"p\\\":null,\\\"c\\\":[\\\"\\\",\\\"signup\\\"],\\\"q\\\":\\\"\\\",\\\"i\\\":false,\\\"f\\\":[[[\\\"\\\",{\\\"children\\\":[\\\"signup\\\",{\\\"children\\\":[\\\"__page__\\\",{}]}]},\\\"$undefined\\\",\\\"$undefined\\\",16],[[\\\"$\\\",\\\"$1\\\",\\\"c\\\",{\\\"children\\\":[[[\\\"$\\\",\\\"link\\\",\\\"0\\\",{\\\"rel\\\":\\\"stylesheet\\\",\\\"href\\\":\\\"/_next/static/chunks/0zk~e5cjxbkpo.css\\\",\\\"precedence\\\":\\\"next\\\",\\\"crossorigin\\\":\\\"$undefined\\\",\\\"nonce\\\":\\\"$undefined\\\"}],[\\\"$\\\",\\\"script\\\",\\\"script-0\\\",{\\\"src\\\":\\\"/_next/static/chunks/0isr5p-vpeff_.js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"}],[\\\"$\\\",\\\"script\\\",\\\"script-1\\\",{\\\"src\\\":\\\"/_next/static/chunks/0i.l9589uvx0j.js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"}]],[\\\"$\\\",\\\"html\\\",null,{\\\"lang\\\":\\\"en\\\",\\\"classname\\\":\\\"h-full\\\",\\\"children\\\":[\\\"$\\\",\\\"body\\\",null,{\\\"classname\\\":\\\"dm_sans_710f0650-module__lt2yhg__variable dm_mono_2c78b75d-module__kaj_ca__variable min-h-full flex flex-col antialiased\\\",\\\"children\\\":[[\\\"$\\\",\\\"$l2\\\",null,{}],[\\\"$\\\",\\\"$l3\\\",null,{\\\"parallelrouterkey\\\":\\\"children\\\",\\\"error\\\":\\\"$4\\\",\\\"errorstyles\\\":[],\\\"errorscripts\\\":[[\\\"$\\\",\\\"script\\\",\\\"script-0\\\",{\\\"src\\\":\\\"/_next/static/chunks/0nqx9t32s__fn.js\\\",\\\"async\\\":true}]],\\\"template\\\":[\\\"$\\\",\\\"$l5\\\",null,{}],\\\"templatestyles\\\":\\\"$undefined\\\",\\\"templatescripts\\\":\\\"$undefined\\\",\\\"notfound\\\":[[[\\\"$\\\",\\\"title\\\",null,{\\\"children\\\":\\\"404: this page could not be found.\\\"}],[\\\"$\\\",\\\"div\\\",null,{\\\"style\\\":{\\\"fontfamily\\\":\\\"system-ui,\\\\\\\"segoe ui\\\\\\\",roboto,helvetica,arial,sans-serif,\\\\\\\"apple color emoji\\\\\\\",\\\\\\\"segoe ui emoji\\\\\\\"\\\",\\\"height\\\":\\\"100vh\\\",\\\"textalign\\\":\\\"center\\\",\\\"display\\\":\\\"flex\\\",\\\"flexdirection\\\":\\\"column\\\",\\\"alignitems\\\":\\\"center\\\",\\\"justifycontent\\\":\\\"center\\\"},\\\"children\\\":[\\\"$\\\",\\\"div\\\",null,{\\\"children\\\":[[\\\"$\\\",\\\"style\\\",null,{\\\"dangerouslysetinnerhtml\\\":{\\\"__html\\\":\\\"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}\\\"}}],[\\\"$\\\",\\\"h1\\\",null,{\\\"classname\\\":\\\"next-error-h1\\\",\\\"style\\\":{\\\"display\\\":\\\"inline-block\\\",\\\"margin\\\":\\\"0 20px 0 0\\\",\\\"padding\\\":\\\"0 23px 0 0\\\",\\\"fontsize\\\":24,\\\"fontweight\\\":500,\\\"verticalalign\\\":\\\"top\\\",\\\"lineheight\\\":\\\"49px\\\"},\\\"children\\\":404}],[\\\"$\\\",\\\"div\\\",null,{\\\"style\\\":{\\\"display\\\":\\\"inline-block\\\"},\\\"children\\\":[\\\"$\\\",\\\"h2\\\",null,{\\\"style\\\":{\\\"fontsize\\\":14,\\\"fontweight\\\":400,\\\"lineheight\\\":\\\"49px\\\",\\\"margin\\\":0},\\\"children\\\":\\\"this page could not be found.\\\"}]}]]}]}]],[]],\\\"forbidden\\\":\\\"$undefined\\\",\\\"unauthorized\\\":\\\"$undefined\\\"}]]}]}]]}],{\\\"children\\\":[[\\\"$\\\",\\\"$1\\\",\\\"c\\\",{\\\"children\\\":[null,[\\\"$\\\",\\\"$l3\\\",null,{\\\"parallelrouterkey\\\":\\\"children\\\",\\\"error\\\":\\\"$undefined\\\",\\\"errorstyles\\\":\\\"$undefined\\\",\\\"errorscripts\\\":\\\"$undefined\\\",\\\"template\\\":[\\\"$\\\",\\\"$l5\\\",null,{}],\\\"templatestyles\\\":\\\"$undefined\\\",\\\"templatescripts\\\":\\\"$undefined\\\",\\\"notfound\\\":\\\"$undefined\\\",\\\"forbidden\\\":\\\"$undefined\\\",\\\"unauthorized\\\":\\\"$undefined\\\"}]]}],{\\\"children\\\":[[\\\"$\\\",\\\"$1\\\",\\\"c\\\",{\\\"children\\\":[[\\\"$\\\",\\\"$l6\\\",null,{\\\"component\\\":\\\"$7\\\",\\\"serverprovidedparams\\\":{\\\"searchparams\\\":{},\\\"params\\\":{},\\\"promises\\\":[\\\"$@8\\\",\\\"$@9\\\"]}}],[[\\\"$\\\",\\\"script\\\",\\\"script-0\\\",{\\\"src\\\":\\\"/_next/static/chunks/0ap8.m1615k39.js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"}],[\\\"$\\\",\\\"script\\\",\\\"script-1\\\",{\\\"src\\\":\\\"/_next/static/chunks/0yy9t3-427u8p.js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"}]],[\\\"$\\\",\\\"$la\\\",null,{\\\"children\\\":[\\\"$\\\",\\\"$b\\\",null,{\\\"name\\\":\\\"next.metadataoutlet\\\",\\\"children\\\":\\\"$@c\\\"}]}]]}],{},null,false,null]},null,false,\\\"$@d\\\"]},null,false,null],[\\\"$\\\",\\\"$1\\\",\\\"h\\\",{\\\"children\\\":[null,[\\\"$\\\",\\\"$le\\\",null,{\\\"children\\\":\\\"$lf\\\"}],[\\\"$\\\",\\\"div\\\",null,{\\\"hidden\\\":true,\\\"children\\\":[\\\"$\\\",\\\"$l10\\\",null,{\\\"children\\\":[\\\"$\\\",\\\"$b\\\",null,{\\\"name\\\":\\\"next.metadata\\\",\\\"children\\\":\\\"$l11\\\"}]}]}],[\\\"$\\\",\\\"meta\\\",null,{\\\"name\\\":\\\"next-size-adjust\\\",\\\"content\\\":\\\"\\\"}]]}],false]],\\\"m\\\":\\\"$undefined\\\",\\\"g\\\":[\\\"$12\\\",[[\\\"$\\\",\\\"link\\\",\\\"0\\\",{\\\"rel\\\":\\\"stylesheet\\\",\\\"href\\\":\\\"/_next/static/chunks/0zk~e5cjxbkpo.css\\\",\\\"precedence\\\":\\\"next\\\",\\\"crossorigin\\\":\\\"$undefined\\\",\\\"nonce\\\":\\\"$undefined\\\"}]]],\\\"s\\\":true,\\\"h\\\":null,\\\"s\\\":\\\"$undefined\\\",\\\"l\\\":\\\"$undefined\\\",\\\"p\\\":\\\"$undefined\\\",\\\"d\\\":\\\"$undefined\\\",\\\"b\\\":\\\"xmludzg1um5nyae_mfhsd\\\"}\\n\"])self.__next_f.push([1,\"13:[]\\nd:\\\"$w13\\\"\\n8:{}\\n9:\\\"$0:f:0:1:1:children:1:children:0:props:children:0:props:serverprovidedparams:params\\\"\\n\"])self.__next_f.push([1,\"f:[[\\\"$\\\",\\\"meta\\\",\\\"0\\\",{\\\"charset\\\":\\\"utf-8\\\"}],[\\\"$\\\",\\\"meta\\\",\\\"1\\\",{\\\"name\\\":\\\"viewport\\\",\\\"content\\\":\\\"width=device-width, initial-scale=1\\\"}]]\\n\"])self.__next_f.push([1,\"14:i[27201,[\\\"/_next/static/chunks/0isr5p-vpeff_.js\\\",\\\"/_next/static/chunks/0i.l9589uvx0j.js\\\"],\\\"iconmark\\\"]\\nc:null\\n11:[[\\\"$\\\",\\\"title\\\",\\\"0\\\",{\\\"children\\\":\\\"thriveathome\\\"}],[\\\"$\\\",\\\"meta\\\",\\\"1\\\",{\\\"name\\\":\\\"description\\\",\\\"content\\\":\\\"ai-powered senior care coordination for families.\\\"}],[\\\"$\\\",\\\"meta\\\",\\\"2\\\",{\\\"property\\\":\\\"og:title\\\",\\\"content\\\":\\\"thriveathome — where seniors thrive together\\\"}],[\\\"$\\\",\\\"meta\\\",\\\"3\\\",{\\\"property\\\":\\\"og:description\\\",\\\"content\\\":\\\"ai-powered senior care coordination for families.\\\"}],[\\\"$\\\",\\\"meta\\\",\\\"4\\\",{\\\"property\\\":\\\"og:site_name\\\",\\\"content\\\":\\\"thriveathome\\\"}],[\\\"$\\\",\\\"meta\\\",\\\"5\\\",{\\\"property\\\":\\\"og:type\\\",\\\"content\\\":\\\"website\\\"}],[\\\"$\\\",\\\"meta\\\",\\\"6\\\",{\\\"name\\\":\\\"twitter:card\\\",\\\"content\\\":\\\"summary_large_image\\\"}],[\\\"$\\\",\\\"meta\\\",\\\"7\\\",{\\\"name\\\":\\\"twitter:title\\\",\\\"content\\\":\\\"thriveathome — where seniors thrive together\\\"}],[\\\"$\\\",\\\"meta\\\",\\\"8\\\",{\\\"name\\\":\\\"twitter:description\\\",\\\"content\\\":\\\"ai-powered senior care coordination for families.\\\"}],[\\\"$\\\",\\\"link\\\",\\\"9\\\",{\\\"rel\\\":\\\"icon\\\",\\\"href\\\":\\\"/favicon.ico?favicon.0x3dzn~oxb6tn.ico\\\",\\\"sizes\\\":\\\"256x256\\\",\\\"type\\\":\\\"image/x-icon\\\"}],[\\\"$\\\",\\\"$l14\\\",\\\"10\\\",{}]]\\n\"])"
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
  27 |     expect(page.url()).toContain(expectedPath);
  28 |   });
  29 | }
  30 | 
  31 | test('TC-A002 — /signup page loads', async ({ page }) => {
  32 |   await page.goto(`${BASE}/signup`);
  33 |   await page.waitForLoadState('networkidle');
  34 |   expect(page.url()).not.toContain('/login');
  35 |   const body = await page.locator('body').textContent();
> 36 |   expect(body?.toLowerCase()).toMatch(/sign up|create account|register/);
     |                               ^ Error: expect(received).toMatch(expected)
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