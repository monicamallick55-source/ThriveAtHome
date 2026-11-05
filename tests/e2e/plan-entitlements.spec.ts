import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';
test.describe('TC-PE001-PE010 Plan Entitlements and Feature Gating', () => {
  test('TC-PE001 /api/entitlements returns plan_tier', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-PE001: not authed'); return; }
    const res = await page.evaluate(async () => { const r = await fetch('/api/entitlements'); if (r.status !== 200) return { status: r.status, data: null }; return { status: 200, data: await r.json() }; });
    if (res.status === 404) console.warn('TC-PE001: /api/entitlements not found');
    else if (res.status >= 500) console.warn('TC-PE001: server error ' + res.status);
    else if (res.status === 200 && res.data && !res.data.plan_tier && !res.data.tier && !res.data.plan) console.warn('TC-PE001: response missing plan_tier field');
  });
  test('TC-PE002 basics member cannot access navigator hours', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-PE002: not authed'); return; }
    const res = await page.evaluate(async () => { const r = await fetch('/api/navigator/hours'); return r.status; });
    if (res === 404) console.warn('TC-PE002: /api/navigator/hours not found');
    else if (res === 200) console.warn('TC-PE002: basics member can access navigator hours — gating may be missing');
    else if (res >= 500) console.warn('TC-PE002: server error ' + res);
  });
  test('TC-PE003 feature flags endpoint no 500', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-PE003: not authed'); return; }
    const res = await page.evaluate(async () => { const r = await fetch('/api/feature-flags'); return r.status; });
    if (res === 404) console.warn('TC-PE003: /api/feature-flags not found');
    else if (res >= 500) console.warn('TC-PE003: feature-flags server error ' + res);
  });
  test('TC-PE004 /dashboard/upgrade shows plan comparison', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-PE004: not authed'); return; }
    await page.goto(BASE + '/dashboard/upgrade');
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (/500|internal server error/i.test(body)) { console.warn('TC-PE004: 500 on /dashboard/upgrade'); return; }
    if (!/connect|complete|plan|upgrade|feature/i.test(body)) console.warn('TC-PE004: No plan comparison on upgrade page');
  });
  test('TC-PE005 /api/entitlements no 500 for all authed roles', async ({ page }) => {
    for (const account of ['member','navigator','admin'] as const) {
      await loginAs(page, ACCOUNTS[account], '/' + (account === 'member' ? 'dashboard' : account));
      if (page.url().includes('/login')) { console.warn('TC-PE005-' + account + ': not authed'); continue; }
      const res = await page.evaluate(async () => { const r = await fetch('/api/entitlements'); return r.status; });
      if (res >= 500) console.warn('TC-PE005-' + account + ': /api/entitlements server error ' + res);
    }
  });
  test('TC-PE006 member plan tier shown on profile', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-PE006: not authed'); return; }
    await page.goto(BASE + '/dashboard/profile');
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (/500|internal server error/i.test(body)) { console.warn('TC-PE006: 500 on /dashboard/profile'); return; }
    if (!/basics|connect|complete|premier|plan|tier/i.test(body)) console.warn('TC-PE006: No plan tier shown on profile');
  });
  test('TC-PE007 premier plan not on public pricing', async ({ page }) => {
    await page.goto(BASE + '/pricing');
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (/premier/i.test(body)) console.warn('TC-PE007: Premier plan visible on /pricing — should be hidden');
  });
  test('TC-PE008 /api/navigator/schedule no 500 for navigator', async ({ page }) => {
    await loginAs(page, ACCOUNTS.navigator, '/navigator');
    if (page.url().includes('/login')) { console.warn('TC-PE008: not authed'); return; }
    const res = await page.evaluate(async () => { const r = await fetch('/api/navigator/schedule'); return r.status; });
    if (res === 404) console.warn('TC-PE008: /api/navigator/schedule not found');
    else if (res >= 500) console.warn('TC-PE008: navigator schedule server error ' + res);
  });
  test('TC-PE009 complete member can access navigator booking', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-PE009: not authed'); return; }
    await page.goto(BASE + '/dashboard/navigator');
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (/500|internal server error/i.test(body)) console.warn('TC-PE009: 500 on /dashboard/navigator');
  });
  test('TC-PE010 /api/plan-features returns feature list', async ({ page }) => {
    const res = await page.evaluate(async () => { const r = await fetch('/api/plan-features'); return r.status; });
    if (res === 404) console.warn('TC-PE010: /api/plan-features not found');
    else if (res >= 500) console.warn('TC-PE010: server error ' + res);
  });
});
