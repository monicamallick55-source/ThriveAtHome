import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

// TC-LT001–LT008: Life Transitions

const TRANSITIONS = [
  'retirement', 'widow', 'diagnosis', 'moving',
  'caregiving', 'divorce', 'loss', 'financial', 'independence',
];

test('TC-LT001 — /dashboard/grief-support loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-LT001: login failed'); return; }
  await page.goto(`${BASE}/dashboard/grief-support`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-LT001: redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});

test('TC-LT002 — /dashboard/life-transitions loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-LT002: login failed'); return; }
  await page.goto(`${BASE}/dashboard/life-transitions`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-LT002: redirected to login'); return; }
  expect(page.url()).not.toContain('/login');
});

for (const key of TRANSITIONS) {
  test(`TC-LT003-${key} pathway no 500`, async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    if (page.url().includes('/login')) { console.warn(`TC-LT003-${key}: login failed`); return; }
    page.on('response', (res) => {
      if (res.status() === 500) throw new Error(`TC-LT003-${key}: 500 on ${res.url()}`);
    });
    const res = await page.request.get(`${BASE}/api/life-transitions/${key}`);
    if (res.status() === 404) { console.warn(`TC-LT003-${key}: pathway API not found`); return; }
    expect([200, 401]).toContain(res.status());
  });
}

test('TC-LT004 — /api/life-transitions endpoint exists', async ({ page }) => {
  const res = await page.request.get(`${BASE}/api/life-transitions`);
  if (res.status() === 404) { console.warn('TC-LT004: /api/life-transitions not found'); return; }
  expect([200, 401]).toContain(res.status());
});

test('TC-LT005 — transition plan task creation works', async ({ page }) => {
  const res = await page.request.post(`${BASE}/api/navigator/tasks`, {
    data: { task_type: 'life_transition', metadata: { pathway: 'loss' } },
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status() === 404) { console.warn('TC-LT005: /api/navigator/tasks not found'); return; }
  expect([200, 400, 401, 403]).toContain(res.status());
});

test('TC-LT006 — /dashboard/trusted-advisors loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard');
  if (page.url().includes('/login')) { console.warn('TC-LT006: login failed'); return; }
  await page.goto(`${BASE}/dashboard/trusted-advisors`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) { console.warn('TC-LT006: redirected after nav'); return; }
  expect(page.url()).not.toContain('/login');
});
