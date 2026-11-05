# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: member-birthday-arc.spec.ts >> TC-MBA003 — birthday-arc cron requires CRON_SECRET
- Location: tests/e2e/member-birthday-arc.spec.ts:25:5

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
  4  | // TC-MBA001–MBA010: Birthday Arc, Achievements, Interest Circles, Check-ins
  5  | 
  6  | test('TC-MBA001 — /dashboard/profile has birthday field', async ({ page }) => {
  7  |   await loginAs(page, ACCOUNTS.member, '/dashboard');
  8  |   if (page.url().includes('/login')) { console.warn('TC-MBA001: login failed'); return; }
  9  |   await page.goto(`${BASE}/dashboard/profile`);
  10 |   await page.waitForLoadState('networkidle');
  11 |   if (page.url().includes('/login')) { console.warn('TC-MBA001: redirected after nav'); return; }
  12 |   const body = await page.locator('body').textContent();
  13 |   if (!body?.toLowerCase().includes('birthday') && !body?.toLowerCase().includes('birth')) {
  14 |     console.warn('TC-MBA001: birthday field not found on profile');
  15 |   }
  16 |   expect(page.url()).not.toContain('/login');
  17 | });
  18 | 
  19 | test('TC-MBA002 — /api/members/profile responds', async ({ page }) => {
  20 |   const res = await page.request.get(`${BASE}/api/members/profile`);
  21 |   if (res.status() === 404) { console.warn('TC-MBA002: /api/members/profile not found'); return; }
  22 |   expect([200, 401]).toContain(res.status());
  23 | });
  24 | 
  25 | test('TC-MBA003 — birthday-arc cron requires CRON_SECRET', async ({ page }) => {
  26 |   const res = await page.request.post(`${BASE}/api/cron/birthday-arc`, {
  27 |     data: {},
  28 |     headers: { 'Content-Type': 'application/json' },
  29 |   });
  30 |   if (res.status() === 404) { console.warn('TC-MBA003: birthday-arc cron not found'); return; }
> 31 |   expect([401, 403]).toContain(res.status());
     |                      ^ Error: expect(received).toContain(expected) // indexOf
  32 | });
  33 | 
  34 | test('TC-MBA004 — /dashboard achievements or milestones page loads', async ({ page }) => {
  35 |   await loginAs(page, ACCOUNTS.member, '/dashboard');
  36 |   if (page.url().includes('/login')) { console.warn('TC-MBA004: login failed'); return; }
  37 |   // Try /dashboard/achievements; fall back to dashboard
  38 |   await page.goto(`${BASE}/dashboard/achievements`);
  39 |   await page.waitForLoadState('networkidle');
  40 |   if (page.url().includes('/login')) { console.warn('TC-MBA004: redirected after nav'); return; }
  41 |   expect(page.url()).not.toContain('/login');
  42 | });
  43 | 
  44 | test('TC-MBA005 — /api/achievements responds', async ({ page }) => {
  45 |   const res = await page.request.get(`${BASE}/api/achievements`);
  46 |   if (res.status() === 404) { console.warn('TC-MBA005: /api/achievements not found'); return; }
  47 |   expect([200, 401]).toContain(res.status());
  48 | });
  49 | 
  50 | test('TC-MBA006 — /dashboard/communities shows interest circles', async ({ page }) => {
  51 |   await loginAs(page, ACCOUNTS.member, '/dashboard');
  52 |   if (page.url().includes('/login')) { console.warn('TC-MBA006: login failed'); return; }
  53 |   await page.goto(`${BASE}/dashboard/communities`);
  54 |   await page.waitForLoadState('networkidle');
  55 |   if (page.url().includes('/login')) { console.warn('TC-MBA006: redirected after nav'); return; }
  56 |   expect(page.url()).not.toContain('/login');
  57 | });
  58 | 
  59 | test('TC-MBA007 — /api/interest-circles responds', async ({ page }) => {
  60 |   const res = await page.request.get(`${BASE}/api/interest-circles`);
  61 |   if (res.status() === 404) { console.warn('TC-MBA007: /api/interest-circles not found'); return; }
  62 |   expect([200, 401]).toContain(res.status());
  63 | });
  64 | 
  65 | test('TC-MBA008 — /api/check-ins responds', async ({ page }) => {
  66 |   const res = await page.request.get(`${BASE}/api/check-ins`);
  67 |   if (res.status() === 404) { console.warn('TC-MBA008: /api/check-ins not found'); return; }
  68 |   expect([200, 401]).toContain(res.status());
  69 | });
  70 | 
  71 | test('TC-MBA009 — check-ins cron requires CRON_SECRET', async ({ page }) => {
  72 |   const res = await page.request.post(`${BASE}/api/cron/aria-calls`, {
  73 |     data: {},
  74 |     headers: { 'Content-Type': 'application/json' },
  75 |   });
  76 |   if (res.status() === 404) { console.warn('TC-MBA009: aria-calls cron not found'); return; }
  77 |   expect([401, 403]).toContain(res.status());
  78 | });
  79 | 
  80 | test('TC-MBA010 — no 500 on communities page', async ({ page }) => {
  81 |   page.on('response', (res) => {
  82 |     if (res.status() === 500) throw new Error(`TC-MBA010: 500 on ${res.url()}`);
  83 |   });
  84 |   await loginAs(page, ACCOUNTS.member, '/dashboard');
  85 |   if (page.url().includes('/login')) { console.warn('TC-MBA010: login failed'); return; }
  86 |   await page.goto(`${BASE}/dashboard/communities`);
  87 |   await page.waitForLoadState('networkidle');
  88 |   if (page.url().includes('/login')) { console.warn('TC-MBA010: redirected after nav'); return; }
  89 |   expect(page.url()).not.toContain('/login');
  90 | });
  91 | 
```