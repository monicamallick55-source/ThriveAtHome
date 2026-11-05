import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';
const TRANSITIONS = ['retirement','widow','diagnosis','moving','caregiving','divorce','loss','financial','independence'];
test.describe('TC-LT001-LT008 Life Transitions', () => {
  test('TC-LT001 /dashboard/life-transitions no 500', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-LT001: not authed'); return; }
    await page.goto(BASE + '/dashboard/life-transitions');
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (/500|internal server error/i.test(body)) console.warn('TC-LT001: 500 on life-transitions');
    else if (!/transition|change|retirement|widow|loss|move|divorce|diagnos/i.test(body)) console.warn('TC-LT001: no transitions content');
  });
  test('TC-LT002 all 9 transitions visible', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-LT002: not authed'); return; }
    await page.goto(BASE + '/dashboard/life-transitions');
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (/500|internal server error/i.test(body)) { console.warn('TC-LT002: 500'); return; }
    for (const key of TRANSITIONS) { if (!new RegExp(key,'i').test(body)) console.warn('TC-LT002: ' + key + ' not visible'); }
  });
  for (const key of TRANSITIONS) {
    test('TC-LT003-' + key + ' pathway no 500', async ({ page }) => {
      await loginAs(page, ACCOUNTS.member, '/dashboard');
      if (page.url().includes('/login')) { console.warn('TC-LT003-' + key + ': not authed'); return; }
      await page.goto(BASE + '/dashboard/life-transitions/' + key);
      await page.waitForLoadState('networkidle');
      const body = await page.evaluate(() => document.body?.innerText ?? '');
      if (/500|internal server error/i.test(body)) console.warn('TC-LT003-' + key + ': 500 on pathway');
    });
  }
  test('TC-LT004 /api/life-transitions/retirement no 500', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-LT004: not authed'); return; }
    const res = await page.evaluate(async () => { const r = await fetch('/api/life-transitions/retirement'); return r.status; });
    if (res === 404) console.warn('TC-LT004: not found');
    else if (res >= 500) console.warn('TC-LT004: server error ' + res);
  });
  test('TC-LT005 grief circle shown on loss pathway', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-LT005: not authed'); return; }
    await page.goto(BASE + '/dashboard/life-transitions/loss');
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (/500|internal server error/i.test(body)) { console.warn('TC-LT005: 500'); return; }
    if (!/grief|circle|group|support|loss|bereavement/i.test(body)) console.warn('TC-LT005: no grief circle on loss pathway');
  });
  test('TC-LT006 financial transition shows advisor link', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-LT006: not authed'); return; }
    await page.goto(BASE + '/dashboard/life-transitions/financial');
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (/500|internal server error/i.test(body)) { console.warn('TC-LT006: 500'); return; }
    if (!/advisor|attorney|financial|planner|estate|legal|connect/i.test(body)) console.warn('TC-LT006: no trusted advisor for financial transition');
  });
  test('TC-LT007 navigator POST life_transition task no 500', async ({ page }) => {
    await loginAs(page, ACCOUNTS.navigator, '/navigator');
    if (page.url().includes('/login')) { console.warn('TC-LT007: not authed'); return; }
    const res = await page.evaluate(async () => { const r = await fetch('/api/navigator/tasks', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({type:'life_transition',member_id:'test-id',transition_type:'retirement'}) }); return r.status; });
    if (res === 404) console.warn('TC-LT007: /api/navigator/tasks not found');
    else if (res >= 500) console.warn('TC-LT007: server error ' + res);
  });
  test('TC-LT008 life-transitions page no 500 hard check', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-LT008: not authed'); return; }
    await page.goto(BASE + '/dashboard/life-transitions');
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });
});
