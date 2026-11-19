import { test, expect } from '@playwright/test';
import { BASE_URL as BASE, loginAs, ACCOUNTS } from './helpers';

test('TC-B2B001 — /org-admin loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.orgadmin);
  await page.goto(`${BASE}/org-admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-B2B010 — /employer-admin loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.employer);
  await page.goto(`${BASE}/employer-admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-B2B011 — /employers public page loads', async ({ page }) => {
  await page.goto(`${BASE}/employers`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-B2B020 — /senior-center-admin loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.seniorcenter);
  await page.goto(`${BASE}/senior-center-admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-B2B025 — /aaa-admin loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.aaa);
  await page.goto(`${BASE}/aaa-admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-B2B030 — /network-admin loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.network);
  await page.goto(`${BASE}/network-admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});

test('TC-B2B035 — /agency-admin loads', async ({ page }) => {
  await loginAs(page, ACCOUNTS.agency);
  await page.goto(`${BASE}/agency-admin`);
  await page.waitForLoadState('networkidle');
  expect(page.url()).not.toContain('/login');
});
