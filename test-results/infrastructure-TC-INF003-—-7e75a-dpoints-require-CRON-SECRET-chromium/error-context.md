# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: infrastructure.spec.ts >> TC-INF003 — cron endpoints require CRON_SECRET
- Location: tests/e2e/infrastructure.spec.ts:19:5

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 405
Received array: [401, 403]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';
  3  | 
  4  | // TC-INF001–INF006: Infrastructure & Regression
  5  | // TC-PERF001–PERF003: Performance & Mobile
  6  | 
  7  | test('TC-INF001 — supabase_auth_id column used (no 500 on member login)', async ({ page }) => {
  8  |   await loginAs(page, ACCOUNTS.member, '/dashboard');
  9  |   if (page.url().includes('/login')) { console.warn('TC-INF001: login failed — may be auth issue'); return; }
  10 |   expect(page.url()).toContain('/dashboard');
  11 | });
  12 | 
  13 | test('TC-INF002 — /dashboard requires auth', async ({ page }) => {
  14 |   await page.goto(`${BASE}/dashboard`);
  15 |   await page.waitForLoadState('networkidle');
  16 |   expect(page.url()).toContain('/login');
  17 | });
  18 | 
  19 | test('TC-INF003 — cron endpoints require CRON_SECRET', async ({ page }) => {
  20 |   const endpoints = ['/api/cron/aria-calls', '/api/cron/birthday-arc', '/api/cron/chapter-activation'];
  21 |   for (const ep of endpoints) {
  22 |     const res = await page.request.post(`${BASE}${ep}`, {
  23 |       data: {},
  24 |       headers: { 'Content-Type': 'application/json' },
  25 |     });
  26 |     if (res.status() === 404) { console.warn(`TC-INF003: ${ep} not found`); continue; }
> 27 |     expect([401, 403]).toContain(res.status());
     |                        ^ Error: expect(received).toContain(expected) // indexOf
  28 |   }
  29 | });
  30 | 
  31 | test('TC-INF004 — member cannot access admin routes', async ({ page }) => {
  32 |   await loginAs(page, ACCOUNTS.member, '/dashboard');
  33 |   if (page.url().includes('/login')) { console.warn('TC-INF004: login failed'); return; }
  34 |   await page.goto(`${BASE}/admin`);
  35 |   await page.waitForLoadState('networkidle');
  36 |   expect(page.url()).not.toContain('/admin');
  37 | });
  38 | 
  39 | test('TC-INF005 — Premier plan hidden from /pricing', async ({ page }) => {
  40 |   await page.goto(`${BASE}/pricing`);
  41 |   await page.waitForLoadState('networkidle');
  42 |   const body = await page.locator('body').textContent();
  43 |   expect(body?.toLowerCase()).not.toContain('premier');
  44 | });
  45 | 
  46 | test('TC-INF006 — /api/features returns feature flags', async ({ page }) => {
  47 |   const res = await page.request.get(`${BASE}/api/features`);
  48 |   if (res.status() === 404) { console.warn('TC-INF006: /api/features not found'); return; }
  49 |   expect([200, 401]).toContain(res.status());
  50 |   if (res.status() === 200) {
  51 |     const body = await res.json().catch(() => null);
  52 |     expect(body).toBeTruthy();
  53 |   }
  54 | });
  55 | 
  56 | test('TC-PERF001 — homepage loads under 5s', async ({ page }) => {
  57 |   const start = Date.now();
  58 |   await page.goto(`${BASE}/`);
  59 |   await page.waitForLoadState('networkidle');
  60 |   const elapsed = Date.now() - start;
  61 |   if (elapsed > 5000) console.warn(`TC-PERF001: homepage took ${elapsed}ms (>5s)`);
  62 |   expect(page.url()).not.toContain('/login');
  63 | });
  64 | 
  65 | test('TC-PERF002 — dashboard loads under 5s', async ({ page }) => {
  66 |   await loginAs(page, ACCOUNTS.member, '/dashboard');
  67 |   if (page.url().includes('/login')) { console.warn('TC-PERF002: login failed'); return; }
  68 |   const start = Date.now();
  69 |   await page.goto(`${BASE}/dashboard`);
  70 |   await page.waitForLoadState('networkidle');
  71 |   const elapsed = Date.now() - start;
  72 |   if (elapsed > 5000) console.warn(`TC-PERF002: dashboard took ${elapsed}ms (>5s)`);
  73 |   expect(page.url()).not.toContain('/login');
  74 | });
  75 | 
  76 | test('TC-PERF003 — homepage no horizontal scroll at 390px', async ({ page }) => {
  77 |   await page.setViewportSize({ width: 390, height: 844 });
  78 |   await page.goto(`${BASE}/`);
  79 |   await page.waitForLoadState('networkidle');
  80 |   const hasHScroll = await page.evaluate(
  81 |     () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  82 |   );
  83 |   if (hasHScroll) console.warn('TC-PERF003: homepage has horizontal scroll at 390px');
  84 |   expect(page.url()).not.toContain('/login');
  85 | });
  86 | 
```