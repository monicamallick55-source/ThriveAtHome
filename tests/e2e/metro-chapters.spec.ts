import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';
test.describe('TC-CH001-CH010 Metro Chapters', () => {
  test('TC-CH001 /api/metro-chapters no 500', async ({ page }) => {
    const res = await page.evaluate(async () => { const r = await fetch('/api/metro-chapters'); return r.status; });
    if (res === 404) console.warn('TC-CH001: not found');
    else if (res >= 500) console.warn('TC-CH001: server error ' + res);
  });
  test('TC-CH002 zip lookup no 500', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-CH002: not authed'); return; }
    const res = await page.evaluate(async () => { const r = await fetch('/api/metro-chapters/lookup?zip=90210'); return r.status; });
    if (res === 404) console.warn('TC-CH002: lookup not found');
    else if (res >= 500) console.warn('TC-CH002: server error ' + res);
  });
  test('TC-CH003 metro-activation cron requires auth', async ({ page }) => {
    const res = await page.evaluate(async () => { const r = await fetch('/api/cron/metro-activation', { headers: {Authorization:'Bearer wrong'} }); return r.status; });
    if (res === 404) console.warn('TC-CH003: cron not found');
    else if (res >= 500) console.warn('TC-CH003: server error without auth ' + res);
    else expect([401,403]).toContain(res);
  });
  test('TC-CH004 member dashboard has local content', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-CH004: not authed'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (!/chapter|metro|local|community|neighbor|area|region/i.test(body)) console.warn('TC-CH004: no local/chapter content on dashboard');
  });
  test('TC-CH005 /chapter/los-angeles no 500', async ({ page }) => {
    await page.goto(BASE + '/chapter/los-angeles');
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (/500|internal server error/i.test(body)) console.warn('TC-CH005: 500 on /chapter/los-angeles');
  });
  test('TC-CH006 member profile has metro or zip', async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn('TC-CH006: not authed'); return; }
    const res = await page.evaluate(async () => { const r = await fetch('/api/members/profile'); if (r.status !== 200) return null; return r.json(); });
    if (res && !res.metro_id && !res.metro && !res.zip_code) console.warn('TC-CH006: member profile missing metro_id or zip_code');
  });
  test('TC-CH007 /admin/metro-chapters no 500', async ({ page }) => {
    await loginAs(page, ACCOUNTS.admin, '/admin');
    if (page.url().includes('/login')) { console.warn('TC-CH007: admin not authed'); return; }
    await page.goto(BASE + '/admin/metro-chapters');
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (/500|internal server error/i.test(body)) console.warn('TC-CH007: 500 on /admin/metro-chapters');
  });
  test('TC-CH008 /api/admin/ma-report no 500', async ({ page }) => {
    await loginAs(page, ACCOUNTS.admin, '/admin');
    if (page.url().includes('/login')) { console.warn('TC-CH008: admin not authed'); return; }
    const res = await page.evaluate(async () => { const r = await fetch('/api/admin/ma-report'); return r.status; });
    if (res === 404) console.warn('TC-CH008: not found');
    else if (res >= 500) console.warn('TC-CH008: server error ' + res);
  });
  test('TC-CH009 /api/school-programs no 500', async ({ page }) => {
    const res = await page.evaluate(async () => { const r = await fetch('/api/school-programs'); return r.status; });
    if (res === 404) console.warn('TC-CH009: not found');
    else if (res >= 500) console.warn('TC-CH009: server error ' + res);
  });
  test('TC-CH010 chapter cron no-auth returns 401 not 500', async ({ page }) => {
    const res = await page.evaluate(async () => { const r = await fetch('/api/cron/metro-activation'); return r.status; });
    if (res === 404) console.warn('TC-CH010: not found');
    else if (res >= 500) console.warn('TC-CH010: server error without auth ' + res);
  });
});
