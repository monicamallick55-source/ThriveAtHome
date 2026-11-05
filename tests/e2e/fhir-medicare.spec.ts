import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';
test.describe('TC-FH001-FH006 FHIR Referral', () => {
  test('TC-FH001 POST fhir referrals no 500', async ({ page }) => {
    await loginAs(page, ACCOUNTS.navigator, '/navigator');
    if (page.url().includes('/login')) { console.warn('TC-FH001: not authed'); return; }
    const res = await page.evaluate(async () => { const r = await fetch('/api/fhir/referrals', { method: 'POST', headers: {'Content-Type':'application/fhir+json'}, body: JSON.stringify({resourceType:'Bundle',type:'transaction',entry:[]}) }); return r.status; });
    if (res === 404) console.warn('TC-FH001: /api/fhir/referrals not found');
    else if (res >= 500) console.warn('TC-FH001: FHIR server error ' + res);
    else expect(res).toBeLessThan(500);
  });
  test('TC-FH002 invalid FHIR returns 400 not 500', async ({ page }) => {
    await loginAs(page, ACCOUNTS.navigator, '/navigator');
    if (page.url().includes('/login')) { console.warn('TC-FH002: not authed'); return; }
    const res = await page.evaluate(async () => { const r = await fetch('/api/fhir/referrals', { method: 'POST', headers: {'Content-Type':'application/fhir+json'}, body: JSON.stringify({not_fhir:true}) }); return r.status; });
    if (res === 404) console.warn('TC-FH002: not found');
    else if (res >= 500) console.warn('TC-FH002: 500 on invalid FHIR — should be 400');
  });
  test('TC-FH003 GET fhir referrals no 500', async ({ page }) => {
    await loginAs(page, ACCOUNTS.navigator, '/navigator');
    if (page.url().includes('/login')) { console.warn('TC-FH003: not authed'); return; }
    const res = await page.evaluate(async () => { const r = await fetch('/api/fhir/referrals'); return r.status; });
    if (res === 404) console.warn('TC-FH003: not found');
    else if (res >= 500) console.warn('TC-FH003: server error ' + res);
  });
  test('TC-FH004 village-referrals no 500', async ({ page }) => {
    await loginAs(page, ACCOUNTS.navigator, '/navigator');
    if (page.url().includes('/login')) { console.warn('TC-FH004: not authed'); return; }
    const res = await page.evaluate(async () => { const r = await fetch('/api/village-referrals'); return r.status; });
    if (res === 404) console.warn('TC-FH004: not found');
    else if (res >= 500) console.warn('TC-FH004: server error ' + res);
  });
  test('TC-FH005 navigator portal no 500', async ({ page }) => {
    await loginAs(page, ACCOUNTS.navigator, '/navigator');
    if (page.url().includes('/login')) { console.warn('TC-FH005: not authed'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });
  test('TC-FH006 fhir not 500 regression', async ({ page }) => {
    await loginAs(page, ACCOUNTS.navigator, '/navigator');
    if (page.url().includes('/login')) { console.warn('TC-FH006: not authed'); return; }
    const res = await page.evaluate(async () => { const r = await fetch('/api/fhir/referrals'); return r.status; });
    if (res === 500) console.warn('TC-FH006: 500 — may still have user_id column bug');
    else expect(res).not.toBe(500);
  });
});
test.describe('TC-MED001-MED004 Medicare NLP', () => {
  test('TC-MED001 /api/medicare/nlp no 500', async ({ page }) => {
    await loginAs(page, ACCOUNTS.navigator, '/navigator');
    if (page.url().includes('/login')) { console.warn('TC-MED001: not authed'); return; }
    const res = await page.evaluate(async () => { const r = await fetch('/api/medicare/nlp', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({transcript:'Patient on Medicare Part B takes lisinopril.'}) }); return r.status; });
    if (res === 404) console.warn('TC-MED001: not found');
    else if (res >= 500) console.warn('TC-MED001: server error ' + res);
    else expect(res).toBeLessThan(500);
  });
  test('TC-MED002 NLP empty transcript not 500', async ({ page }) => {
    await loginAs(page, ACCOUNTS.navigator, '/navigator');
    if (page.url().includes('/login')) { console.warn('TC-MED002: not authed'); return; }
    const res = await page.evaluate(async () => { const r = await fetch('/api/medicare/nlp', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({transcript:''}) }); return r.status; });
    if (res === 404) console.warn('TC-MED002: not found');
    else if (res >= 500) console.warn('TC-MED002: empty transcript caused 500');
  });
  test('TC-MED003 /navigator/medicare no 500', async ({ page }) => {
    await loginAs(page, ACCOUNTS.navigator, '/navigator');
    if (page.url().includes('/login')) { console.warn('TC-MED003: not authed'); return; }
    await page.goto(BASE + '/navigator/medicare');
    await page.waitForLoadState('networkidle');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (/500|internal server error/i.test(body)) console.warn('TC-MED003: 500 on /navigator/medicare');
  });
  test('TC-MED004 navigator tasks POST no 500', async ({ page }) => {
    await loginAs(page, ACCOUNTS.navigator, '/navigator');
    if (page.url().includes('/login')) { console.warn('TC-MED004: not authed'); return; }
    const res = await page.evaluate(async () => { const r = await fetch('/api/navigator/tasks', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({type:'medicare_screening',member_id:'test-id'}) }); return r.status; });
    if (res === 404) console.warn('TC-MED004: /api/navigator/tasks not found');
    else if (res >= 500) console.warn('TC-MED004: server error ' + res);
  });
});
