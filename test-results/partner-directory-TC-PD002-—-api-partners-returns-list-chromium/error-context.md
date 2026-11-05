# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: partner-directory.spec.ts >> TC-PD002 — /api/partners returns list
- Location: tests/e2e/partner-directory.spec.ts:17:5

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 500
Received array: [200, 401]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';
  3  | 
  4  | // TC-PD001–PD004: Partner Directory
  5  | 
  6  | test('TC-PD001 — /partners public page loads', async ({ page }) => {
  7  |   await page.goto(`${BASE}/partners`);
  8  |   await page.waitForLoadState('networkidle');
  9  |   if (page.url().includes('/login')) {
  10 |     console.warn('TC-PD001: /partners redirected to login — may require auth');
  11 |     return;
  12 |   }
  13 |   const status = await page.evaluate(() => document.readyState);
  14 |   expect(['complete', 'interactive']).toContain(status);
  15 | });
  16 | 
  17 | test('TC-PD002 — /api/partners returns list', async ({ page }) => {
  18 |   const res = await page.request.get(`${BASE}/api/partners`);
  19 |   if (res.status() === 404) {
  20 |     console.warn('TC-PD002: /api/partners not implemented yet');
  21 |     return;
  22 |   }
> 23 |   expect([200, 401]).toContain(res.status());
     |                      ^ Error: expect(received).toContain(expected) // indexOf
  24 |   if (res.status() === 200) {
  25 |     const body = await res.json().catch(() => null);
  26 |     expect(body).toBeTruthy();
  27 |   }
  28 | });
  29 | 
  30 | test('TC-PD003 — /api/partners filters by category', async ({ page }) => {
  31 |   const res = await page.request.get(`${BASE}/api/partners?category=health`);
  32 |   if (res.status() === 404) {
  33 |     console.warn('TC-PD003: /api/partners category filter not implemented yet');
  34 |     return;
  35 |   }
  36 |   expect([200, 401]).toContain(res.status());
  37 | });
  38 | 
  39 | test('TC-PD004 — partner detail page loads', async ({ page }) => {
  40 |   await page.goto(`${BASE}/partners/1`);
  41 |   await page.waitForLoadState('networkidle');
  42 |   if (page.url().includes('/login')) {
  43 |     console.warn('TC-PD004: /partners/1 redirected to login — may require auth');
  44 |     return;
  45 |   }
  46 |   if (page.url().includes('/404') || page.url().includes('not-found')) {
  47 |     console.warn('TC-PD004: partner detail page returns 404 — no partner seeded');
  48 |     return;
  49 |   }
  50 |   const status = await page.evaluate(() => document.readyState);
  51 |   expect(['complete', 'interactive']).toContain(status);
  52 | });
  53 | 
```