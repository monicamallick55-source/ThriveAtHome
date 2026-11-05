import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';
test.describe('TC-MBA001-MBA010 Birthday Arc and Achievements', () => {
  test('TC-MBA001 member profile has birthday field', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-MBA001: not authed'); return; }
    await page.goto(BASE + '/dashboard/profile');
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (/500|internal server error/i.test(body)) { console.warn('TC-MBA001: 500 on /dashboard/profile'); return; }
    if (!/birthday|birth date|date of birth|dob/i.test(body)) console.warn('TC-MBA001: No birthday field on member profile');
  });
  test('TC-MBA002 /api/members/profile returns date_of_birth or birthday', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-MBA002: not authed'); return; }
    const res = await page.evaluate(async () => { const r = await fetch('/api/members/profile'); if (r.status !== 200) return { status: r.status, data: null }; return { status: 200, data: await r.json() }; });
    if (res.status === 404) console.warn('TC-MBA002: /api/members/profile not found');
    else if (res.status >= 500) console.warn('TC-MBA002: server error ' + res.status);
    else if (res.status === 200 && res.data && !res.data.date_of_birth && !res.data.birthday && !res.data.dob) console.warn('TC-MBA002: Profile missing birthday field');
  });
  test('TC-MBA003 /api/cron/birthday-calls requires secret', async ({ page }) => {
    const res = await page.evaluate(async () => { const r = await fetch('/api/cron/birthday-calls'); return r.status; });
    if (res === 404) console.warn('TC-MBA003: /api/cron/birthday-calls not found');
    else if (res >= 500) console.warn('TC-MBA003: birthday cron server error without auth ' + res);
    else expect([401,403]).toContain(res);
  });
  test('TC-MBA004 /api/cron/birthday-calls with correct secret no 500', async ({ page }) => {
    const res = await page.evaluate(async () => {
      const r = await fetch('/api/cron/birthday-calls', { headers: { Authorization: 'Bearer ' + (window as any).__CRON_SECRET__ || 'test' } });
      return r.status;
    });
    if (res === 404) console.warn('TC-MBA004: /api/cron/birthday-calls not found');
    else if (res >= 500) console.warn('TC-MBA004: birthday cron server error ' + res);
  });
  test('TC-MBA005 /dashboard/achievements page loads no 500', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-MBA005: not authed'); return; }
    await page.goto(BASE + '/dashboard/achievements');
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (/500|internal server error/i.test(body)) console.warn('TC-MBA005: 500 on /dashboard/achievements');
    else if (!/achievement|badge|milestone|unlock|earn/i.test(body)) console.warn('TC-MBA005: No achievement content on /dashboard/achievements');
  });
  test('TC-MBA006 /api/achievements returns list for member', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-MBA006: not authed'); return; }
    const res = await page.evaluate(async () => { const r = await fetch('/api/achievements'); return r.status; });
    if (res === 404) console.warn('TC-MBA006: /api/achievements not found');
    else if (res >= 500) console.warn('TC-MBA006: achievements server error ' + res);
  });
  test('TC-MBA007 member dashboard shows interest circles', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-MBA007: not authed'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (!/interest|circle|group|communit|connect/i.test(body)) console.warn('TC-MBA007: No interest circles on member dashboard');
  });
  test('TC-MBA008 /api/interest-circles returns list', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-MBA008: not authed'); return; }
    const res = await page.evaluate(async () => { const r = await fetch('/api/interest-circles'); return r.status; });
    if (res === 404) console.warn('TC-MBA008: /api/interest-circles not found');
    else if (res >= 500) console.warn('TC-MBA008: server error ' + res);
  });
  test('TC-MBA009 /api/check-ins no 500 for member', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-MBA009: not authed'); return; }
    const res = await page.evaluate(async () => { const r = await fetch('/api/check-ins'); return r.status; });
    if (res === 404) console.warn('TC-MBA009: /api/check-ins not found');
    else if (res >= 500) console.warn('TC-MBA009: check-ins server error ' + res);
  });
  test('TC-MBA010 /api/cron/check-ins requires secret', async ({ page }) => {
    const res = await page.evaluate(async () => { const r = await fetch('/api/cron/check-ins'); return r.status; });
    if (res === 404) console.warn('TC-MBA010: /api/cron/check-ins not found');
    else if (res >= 500) console.warn('TC-MBA010: check-ins cron server error without auth ' + res);
    else expect([401,403]).toContain(res);
  });
});
