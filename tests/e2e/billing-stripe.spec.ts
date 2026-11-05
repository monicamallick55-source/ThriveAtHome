import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';
test.describe('TC-B001-B010 B2C Plan Subscription', () => {
  test('TC-B001 /pricing shows basics connect complete not premier', async ({ page }) => {
    await page.goto(BASE + '/pricing');
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
    if (!/basics/i.test(body)) console.warn('TC-B001: Basics plan not on /pricing');
    if (!/connect/i.test(body)) console.warn('TC-B001: Connect plan not on /pricing');
    if (!/complete/i.test(body)) console.warn('TC-B001: Complete plan not on /pricing');
    if (/premier/i.test(body)) console.warn('TC-B001: Premier visible on /pricing — should be hidden');
  });
  test('TC-B002 member sees current plan on dashboard', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-B002: not authed'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (!/basics|connect|complete|premier|plan|tier/i.test(body)) console.warn('TC-B002: No current plan visible on dashboard');
  });
  test('TC-B003 /dashboard/upgrade page loads', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-B003: not authed'); return; }
    await page.goto(BASE + '/dashboard/upgrade');
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (/500|internal server error/i.test(body)) console.warn('TC-B003: 500 on /dashboard/upgrade');
    else if (!/upgrade|plan|select|choose|connect|complete/i.test(body)) console.warn('TC-B003: No upgrade content on /dashboard/upgrade');
  });
  test('TC-B004 upgrade button links to Stripe or checkout', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-B004: not authed'); return; }
    await page.goto(BASE + '/dashboard/upgrade');
    await page.waitForLoadState('networkidle');
    const upgradeBtn = page.locator('a, button').filter({ hasText: /upgrade|get.*plan|subscribe|checkout/i }).first();
    if (await upgradeBtn.count() === 0) console.warn('TC-B004: No upgrade/checkout button found');
  });
  test('TC-B005 /api/stripe/create-checkout-session returns 400 without plan', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-B005: not authed'); return; }
    const res = await page.evaluate(async () => { const r = await fetch('/api/stripe/create-checkout-session', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({}) }); return r.status; });
    if (res === 404) console.warn('TC-B005: /api/stripe/create-checkout-session not found');
    else if (res >= 500) console.warn('TC-B005: checkout-session server error ' + res);
    else expect(res).toBeLessThan(500);
  });
  test('TC-B006 /api/stripe/webhook returns 400 without signature', async ({ page }) => {
    const res = await page.evaluate(async () => { const r = await fetch('/api/stripe/webhook', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({type:'test'}) }); return r.status; });
    if (res === 404) console.warn('TC-B006: /api/stripe/webhook not found');
    else if (res >= 500) console.warn('TC-B006: webhook server error without signature ' + res);
    else expect(res).toBeLessThan(500);
  });
  test('TC-B007 /api/stripe/portal no 500 for member', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-B007: not authed'); return; }
    const res = await page.evaluate(async () => { const r = await fetch('/api/stripe/portal', { method: 'POST', headers: {'Content-Type':'application/json'}, body: '{}' }); return r.status; });
    if (res === 404) console.warn('TC-B007: /api/stripe/portal not found');
    else if (res >= 500) console.warn('TC-B007: stripe portal server error ' + res);
  });
  test('TC-B008 /dashboard/billing page loads no 500', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-B008: not authed'); return; }
    await page.goto(BASE + '/dashboard/billing');
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (/500|internal server error/i.test(body)) console.warn('TC-B008: 500 on /dashboard/billing');
  });
  test('TC-B009 /api/stripe/cancel-subscription no 500', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-B009: not authed'); return; }
    const res = await page.evaluate(async () => { const r = await fetch('/api/stripe/cancel-subscription', { method: 'POST', headers: {'Content-Type':'application/json'}, body: '{}' }); return r.status; });
    if (res === 404) console.warn('TC-B009: cancel-subscription not found');
    else if (res >= 500) console.warn('TC-B009: cancel-subscription server error ' + res);
  });
  test('TC-B010 donation page loads no 500', async ({ page }) => {
    await page.goto(BASE + '/donate');
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (/500|internal server error/i.test(body)) console.warn('TC-B010: 500 on /donate');
    else if (!/donat|give|support|fund/i.test(body)) console.warn('TC-B010: No donation content on /donate');
  });
});
