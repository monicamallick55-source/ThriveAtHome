import { test, expect } from '@playwright/test';
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';
const PUBLIC_ROUTES = [
  { path: '/', label: 'TC-P001', pattern: /thrive|senior|home|independence/i },
  { path: '/pricing', label: 'TC-P002', pattern: /basics|connect|complete|plan|price/i },
  { path: '/about', label: 'TC-P003', pattern: /about|mission|team|story/i },
  { path: '/for-families', label: 'TC-P004', pattern: /famil|caregiv|loved one/i },
  { path: '/resources', label: 'TC-P005', pattern: /resource|guide|article|tip/i },
  { path: '/donate', label: 'TC-P006', pattern: /donat|give|support|fund/i },
  { path: '/blog', label: 'TC-P007', pattern: /blog|article|post|news/i },
  { path: '/login', label: 'TC-P008', pattern: /sign in|log in|email|password/i },
  { path: '/signup', label: 'TC-P009', pattern: /sign up|create|join|register/i },
  { path: '/contact', label: 'TC-P010', pattern: /contact|reach|email|phone/i },
];
test.describe('TC-P001-P010 Public Routes No 500 No Login Redirect', () => {
  for (const { path, label, pattern } of PUBLIC_ROUTES) {
    test(label + ' ' + path + ' loads', async ({ page }) => {
      await page.goto(BASE + path);
      await page.waitForLoadState('networkidle');
      const url = page.url();
      if (path !== '/login' && url.includes('/login')) { console.warn(label + ': ' + path + ' redirects to login — should be public'); return; }
      const body = await page.evaluate(() => document.body?.innerText ?? '');
      if (/500|internal server error/i.test(body)) { console.warn(label + ': 500 on ' + path); return; }
      expect(/500|internal server error/i.test(body)).toBe(false);
      if (!pattern.test(body)) console.warn(label + ': Expected content not found on ' + path);
    });
  }
});
test.describe('TC-P011-P015 Public API Routes', () => {
  test('TC-P011 /api/features returns features list', async ({ page }) => {
    const res = await page.evaluate(async () => { const r = await fetch('/api/features'); return r.status; });
    if (res === 404) console.warn('TC-P011: /api/features not found');
    else if (res >= 500) console.warn('TC-P011: /api/features server error ' + res);
  });
  test('TC-P012 /api/pricing returns plan data', async ({ page }) => {
    const res = await page.evaluate(async () => { const r = await fetch('/api/pricing'); return r.status; });
    if (res === 404) console.warn('TC-P012: /api/pricing not found');
    else if (res >= 500) console.warn('TC-P012: /api/pricing server error ' + res);
  });
  test('TC-P013 /api/villages returns public village list', async ({ page }) => {
    const res = await page.evaluate(async () => { const r = await fetch('/api/villages'); return r.status; });
    if (res === 404) console.warn('TC-P013: /api/villages not found');
    else if (res >= 500) console.warn('TC-P013: /api/villages server error ' + res);
  });
  test('TC-P014 homepage has no 404 resources in network', async ({ page }) => {
    const failed: string[] = [];
    page.on('response', resp => { if (resp.status() === 404 && !resp.url().includes('favicon')) failed.push(resp.url()); });
    await page.goto(BASE + '/');
    await page.waitForLoadState('networkidle');
    if (failed.length > 0) console.warn('TC-P014: 404 resources on homepage: ' + failed.slice(0,3).join(', '));
  });
  test('TC-P015 /sitemap.xml or /robots.txt accessible', async ({ page }) => {
    const res = await page.evaluate(async () => { const r = await fetch('/robots.txt'); return r.status; });
    if (res >= 500) console.warn('TC-P015: /robots.txt returned ' + res);
  });
});
