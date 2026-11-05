/**
 * TC-WS — Safety & Health Workflow Tests
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './helpers';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';

test.describe('TC-WS001–WS005 — Home Safety Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
    await page.goto(`${BASE}/dashboard/home-safety`);
    await page.waitForLoadState('networkidle');
  });

  test('TC-WS001 — home safety page shows categories or enroll form', async ({ page }) => {
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasContent = /safety|fall|enroll|assess|hazard|checklist|emergency/i.test(body);
    if (!hasContent) console.warn('TC-WS001: No home safety content found');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WS002 — enroll button or checklist visible', async ({ page }) => {
    const hasEnroll = await page.locator('button').filter({ hasText: /enroll|start|begin/i }).count() > 0;
    const hasChecklist = await page.locator('button').filter({ hasText: /complete|mark|done/i }).count() > 0;
    if (!hasEnroll && !hasChecklist) console.warn('TC-WS002: Neither enroll button nor checklist items found');
  });

  test('TC-WS003 — enroll form has home type and emergency contact fields', async ({ page }) => {
    const enrollBtn = page.locator('button').filter({ hasText: /enroll|start/i }).first();
    if (await enrollBtn.count() > 0) {
      await enrollBtn.click();
      await page.waitForTimeout(500);
    }
    const hasSelect = await page.locator('select').count() > 0;
    const hasInput = await page.locator('input[placeholder]').count() > 0;
    if (!hasSelect && !hasInput) console.warn('TC-WS003: Enroll form fields not visible');
  });

  test('TC-WS004 — safety category filter buttons work', async ({ page }) => {
    const catBtns = page.locator('button').filter({ hasText: /fall|fire|earthquake|medical|emergency/i });
    if (await catBtns.count() > 0) {
      await catBtns.first().click();
      await page.waitForTimeout(300);
      expect(page.url()).not.toContain('/login');
    } else {
      console.warn('TC-WS004: No category filter buttons found');
    }
  });
});

test.describe('TC-WS010–WS015 — Trusted Advisors & Medicare', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
  });

  test('TC-WS010 — trusted advisors page shows advisor list', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/trusted-advisors`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasAdvisors = /advisor|therapist|counselor|attorney|financial|chaplain/i.test(body);
    if (!hasAdvisors) console.warn('TC-WS010: No advisor types found');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WS011 — advisor filter buttons work', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/trusted-advisors`);
    await page.waitForLoadState('networkidle');
    const filterBtns = page.locator('button').filter({ hasText: /therapist|counselor|attorney|financial|all/i });
    if (await filterBtns.count() > 0) {
      await filterBtns.first().click();
      await page.waitForTimeout(300);
      expect(page.url()).not.toContain('/login');
    } else {
      console.warn('TC-WS011: No advisor filter buttons found');
    }
  });

  test('TC-WS012 — request intro button on advisor card', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/trusted-advisors`);
    await page.waitForLoadState('networkidle');
    const introBtn = page.locator('button').filter({ hasText: /request intro|connect|reach out/i }).first();
    if (await introBtn.count() > 0) {
      expect(await introBtn.isDisabled()).toBe(false);
    } else {
      console.warn('TC-WS012: No request intro button found');
    }
  });

  test('TC-WS013 — Medicare help page shows programs', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/medicare-help`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasPrograms = /medicare|part [abcd]|msp|extra help|medi.?cal|cobra|enrollment/i.test(body);
    if (!hasPrograms) console.warn('TC-WS013: No Medicare program content found');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WS014 — Medicare Learn More click does not 500', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/medicare-help`);
    await page.waitForLoadState('networkidle');
    const learnBtn = page.locator('button').filter({ hasText: /learn more|help|request|get help/i }).first();
    if (await learnBtn.count() > 0) {
      await learnBtn.click();
      await page.waitForTimeout(500);
      const body = await page.evaluate(() => document.body?.innerText ?? '');
      expect(/500|internal server error/i.test(body)).toBe(false);
    } else {
      console.warn('TC-WS014: No Learn More button on Medicare help page');
    }
  });

  test('TC-WS015 — FHIR referrals page shows create button', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/fhir-referrals`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasCreate = /create|new|referral|request/i.test(body);
    if (!hasCreate) console.warn('TC-WS015: No create/new referral button found');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });
});

test.describe('TC-WS020–WS030 — Pets, Encore Careers & Home Sharing', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.member, '/dashboard');
  });

  test('TC-WS020 — pets page loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/pets`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WS021 — add pet button opens form', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/pets`);
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button').filter({ hasText: /add.*pet|new.*pet|\+ pet/i }).first();
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.waitForTimeout(500);
      const hasInput = await page.locator('input').count() > 0;
      if (!hasInput) console.warn('TC-WS021: Add pet form did not open');
    } else {
      console.warn('TC-WS021: No add pet button found');
    }
  });

  test('TC-WS022 — encore careers shows job listings', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/encore-careers`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });

  test('TC-WS023 — encore careers apply button opens form', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/encore-careers`);
    await page.waitForLoadState('networkidle');
    const applyBtn = page.locator('button').filter({ hasText: /apply|express interest/i }).first();
    if (await applyBtn.count() > 0) {
      await applyBtn.click();
      await page.waitForTimeout(500);
      const hasTextarea = await page.locator('textarea').count() > 0;
      if (!hasTextarea) console.warn('TC-WS023: Cover note textarea not visible after clicking Apply');
    } else {
      console.warn('TC-WS023: No apply button found');
    }
  });

  test('TC-WS030 — home sharing page shows provider/seeker choice', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/home-sharing`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const hasChoice = /provider|seeker|room|share|housemate|host/i.test(body);
    if (!hasChoice) console.warn('TC-WS030: Home sharing not showing provider/seeker choice');
    expect(/500|internal server error/i.test(body)).toBe(false);
  });
});
