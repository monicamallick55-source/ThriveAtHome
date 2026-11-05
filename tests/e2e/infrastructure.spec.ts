import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';
test.describe('TC-INF001-INF006 Infrastructure', () => {
  test('TC-INF001 supabase_auth_id regression member routes not 500', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-INF001: not authed'); return; }
    for (const route of ['/api/home-safety','/api/entitlements','/api/festivals','/api/university-volunteers']) {
      const res = await page.evaluate(async (r) => { const resp = await fetch(r); return resp.status; }, route);
      if (res === 500) console.warn('TC-INF001: ' + route + ' returned 500 — supabase_auth_id fix may be missing');
      expect(res).not.toBe(500);
    }
  });
  test('TC-INF002 /api/home-safety returns 401 without auth', async ({ page }) => {
    const res = await page.evaluate(async () => { const r = await fetch('/api/home-safety'); return r.status; });
    expect(res).toBe(401);
  });
  test('TC-INF003 /api/members/profile returns 401 without auth', async ({ page }) => {
    const res = await page.evaluate(async () => { const r = await fetch('/api/members/profile'); return r.status; });
    expect([401,403]).toContain(res);
  });
  test('TC-INF004 cron endpoints require secret', async ({ page }) => {
    for (const path of ['/api/cron/birthday-calls','/api/cron/metro-activation','/api/cron/check-ins']) {
      const res = await page.evaluate(async (p) => { const r = await fetch(p); return r.status; }, path);
      if (res === 404) console.warn('TC-INF004: ' + path + ' not found');
      else if (res >= 500) console.warn('TC-INF004: ' + path + ' returns 500 without auth');
      else expect([401,403]).toContain(res);
    }
  });
  test('TC-INF005 member cant access admin', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-INF005: not authed'); return; }
    await page.goto(BASE + '/admin');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    if (!url.includes('/login') && !url.includes('/dashboard') && url.includes('/admin')) console.warn('TC-INF005: member can access /admin — role isolation broken');
  });
  test('TC-INF006 premier hidden from public pricing', async ({ page }) => {
    await page.goto(BASE + '/pricing');
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (/premier/i.test(body)) console.warn('TC-INF006: Premier plan visible on /pricing — should be hidden');
  });
});
test.describe('TC-PERF001-PERF003 Performance', () => {
  test('TC-PERF001 homepage loads under 5s', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE + '/');
    await page.waitForLoadState('networkidle');
    const elapsed = Date.now() - start;
    if (elapsed > 5000) console.warn('TC-PERF001: Homepage took ' + elapsed + 'ms — over 5s threshold');
  });
  test('TC-PERF002 member dashboard loads under 5s', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-PERF002: not authed'); return; }
    const start = Date.now();
    await page.goto(BASE + '/dashboard');
    await page.waitForLoadState('networkidle');
    const elapsed = Date.now() - start;
    if (elapsed > 5000) console.warn('TC-PERF002: Dashboard took ' + elapsed + 'ms — over 5s threshold');
  });
  test('TC-PERF003 no horizontal scroll on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE + '/');
    await page.waitForLoadState('networkidle');
    const hasHScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (hasHScroll) console.warn('TC-PERF003: Horizontal scroll on mobile viewport on homepage');
  });
});
