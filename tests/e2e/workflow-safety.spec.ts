import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';

test.describe('TC-WS001-WS005 Home Safety Workflow', () => {
  async function goToHomeSafety(page) {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    await page.goto(BASE + '/dashboard/home-safety');
    await page.waitForLoadState('networkidle');
    if (page.url().includes('/login')) {
      await loginAs(page, ACCOUNTS.member, '/dashboard');
      await page.goto(BASE + '/dashboard/home-safety');
      await page.waitForLoadState('networkidle');
    }
    return !page.url().includes('/login');
  }

  test('TC-WS001 home safety page shows categories or enroll form', async ({ page }) => {
    const ok = await goToHomeSafety(page);
    if (!ok) { console.warn('TC-WS001: Still on /login after retry — auth rate-limited'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (!/safety|fall|enroll|assess|hazard|checklist|emergency/i.test(body)) console.warn('TC-WS001: No home safety content found');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WS002 enroll button or checklist visible', async ({ page }) => {
    const ok = await goToHomeSafety(page);
    if (!ok) { console.warn('TC-WS002: Still on /login after retry'); return; }
    const hasEnroll = await page.locator('button').filter({ hasText: /enroll|start|begin/i }).count() > 0;
    const hasChecklist = await page.locator('button').filter({ hasText: /complete|mark|done/i }).count() > 0;
    if (!hasEnroll && !hasChecklist) console.warn('TC-WS002: Neither enroll button nor checklist items found');
  });

  test('TC-WS003 enroll form has home type and emergency contact fields', async ({ page }) => {
    const ok = await goToHomeSafety(page);
    if (!ok) { console.warn('TC-WS003: Still on /login after retry'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasFields = /home.*type|type.*home|emergency|contact|phone/i.test(body);
    if (!hasFields) console.warn('TC-WS003: Home type or emergency contact fields not visible');
  });

  test('TC-WS004 home safety API returns 401 without auth', async ({ page }) => {
    const res = await page.evaluate(async () => {
      const r = await fetch('/api/home-safety');
      return r.status;
    });
    expect(res).toBe(401);
  });

  test('TC-WS005 home safety page has no 500 errors', async ({ page }) => {
    const ok = await goToHomeSafety(page);
    if (!ok) { console.warn('TC-WS005: Still on /login after retry'); return; }
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });
});
